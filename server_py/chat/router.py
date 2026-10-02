import re
import json
import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from server_py.config.app_config import client
from server_py.eleonor.brain import (
    update_eleonor_state,
    get_behavioral_mode,
    map_expression,
    get_ssml_voice_mode,
)
from server_py.eleonor.personality import get_system_prompt
from server_py.funciones.tts import generate_ssml_tts_base64
from server_py.memoria.database import (
    SessionLocal,
    ExamResult,
    EleonorHistory,
    ChatMessage,
    EleonorSession,
)
from server_py.memoria.skills import get_skill_snapshot, get_trends
from server_py.diagnostico.agents import generate_unified_prompt
from server_py.diagnostico.agents.game_generator import GAME_GENERATOR
from server_py.auth.router import get_current_user_id

router = APIRouter()


class ChatRequest(BaseModel):
    """Modelo de entrada para solicitudes de chat."""
    text: str


async def generate_response_stream(user_text: str, user_id: int):
    """Genera un flujo de respuesta para el chat del usuario.

    Pasos:
        1. Recupera o inicializa la sesión en DB.
        2. Guarda el mensaje del usuario.
        3. Recupera historial y contexto cognitivo.
        4. Construye mensajes para el modelo LLM.
        5. Procesa streaming de respuesta, decisiones, juegos y análisis.
        6. Genera audio SSML y actualiza estado en DB.

    Args:
        user_text (str): Texto enviado por el usuario.
        user_id (int): Identificador del usuario autenticado.
    """
    db = SessionLocal()

    # 1. Recuperar o inicializar sesión
    session = db.query(EleonorSession).filter(EleonorSession.user_id == user_id).first()
    if not session:
        session = EleonorSession(id=f"sess_{user_id}", user_id=user_id)
        db.add(session)
        db.commit()

    session_id = session.id

    db_state = {
        "valence": session.valence,
        "tension": session.tension,
        "engagement": session.engagement
    }

    # 2. Guardar mensaje del usuario
    new_user_msg = ChatMessage(role="user", content=user_text, session_id=session_id, user_id=user_id)
    db.add(new_user_msg)
    db.commit()

    # 3. Recuperar últimos mensajes
    past_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.timestamp.desc())
        .limit(4)
        .all()
    )
    past_messages.reverse()

    hilo_context = ""
    last_hito = (
        db.query(EleonorHistory)
        .filter(EleonorHistory.user_id == user_id)
        .order_by(EleonorHistory.timestamp.desc())
        .first()
    )
    if last_hito:
        hilo_context = f"HILO: {last_hito.summary}"

    formatted_history = [{"role": msg.role, "content": msg.content} for msg in past_messages]
    if hilo_context:
        formatted_history.insert(0, {"role": "system", "content": hilo_context})

    # 4. Contexto cognitivo
    cognitive_context = ""
    try:
        latest_exam = (
            db.query(ExamResult)
            .filter(ExamResult.user_id == user_id)
            .order_by(ExamResult.timestamp.desc())
            .first()
        )
        if latest_exam:
            snapshot = get_skill_snapshot(db, user_id)
            trends = get_trends(db, user_id)
            history_milestones = (
                db.query(EleonorHistory)
                .filter(EleonorHistory.user_id == user_id)
                .order_by(EleonorHistory.timestamp.desc())
                .limit(5)
                .all()
            )
            history_list = [{"summary": h.summary, "signals": h.signals} for h in history_milestones]

            cognitive_context = await generate_unified_prompt(
                latest_exam.data, snapshot, trends, history_list, session_state=db_state
            )
            print(f"[DB] Datos de examen encontrados para el usuario {user_id}")
        else:
            print(f"ℹ[DB] Sin datos de examen previo para el usuario {user_id}")

    except Exception as db_error:
        print(f"⚠️ Error al obtener contexto cognitivo de DB: {db_error}")

    system_prompt = get_system_prompt(db_state, cognitive_context)
    print(f"DEBUG: Cognitive Context applied: {cognitive_context[:100]}...")

    llm_messages = [{"role": "system", "content": system_prompt}] + formatted_history

    # Activación de juego explícita
    if "quiero jugar un juego" in user_text.lower():
        llm_messages.append(
            {"role": "system", "content": "ADVERTENCIA: El usuario ha pedido jugar. DEBES iniciar tu respuesta con el tag [GAME] y luego comentar algo sobre el desafío."}
        )

    print(f"\n[CLIENTE] > {user_text}")

    try:
        stream = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=llm_messages,
            stream=True,
            stream_options={"include_usage": True}
        )

        full_content, is_resp, current_mode, interaction_decision = "", False, "Normal", "yes"
        game_invoked, game_data = False, None

        async for chunk in stream:
            delta = ""
            if chunk.choices:
                delta = chunk.choices[0].delta.content or ""
                full_content += delta

            # 1. Búsqueda de Decisión (Flexible)
            if not is_resp and "[DECISION]" in full_content:
                try:
                    decision_part = full_content.split("[DECISION]")[1].split("[")[0].lower()
                    for keyword in ["yes", "minimal", "redirect", "pause"]:
                        if keyword in decision_part and interaction_decision != keyword:
                            interaction_decision = keyword
                            print(f"DEBUG: Modelo decidió (flexible): {interaction_decision}")
                            yield f"data: {json.dumps({'type': 'decision', 'content': interaction_decision})}\n\n"
                            break
                except Exception:
                    pass

            # 1.5. Búsqueda de Invocación de Juego [GAME]
            if not game_invoked and "[GAME]" in full_content:
                game_invoked = True
                try:
                    goal = ""
                    if "]:" in full_content.split("[GAME]")[1]:
                        goal = full_content.split("[GAME]")[1].split("[")[0].strip()

                    print(f"DEBUG: Eleonor invoca un juego | Objetivo: {goal or 'General'}")

                    # Generar juego dinámico
                    user_profile = {
                        "state": db_state,
                        "cognitive": cognitive_context
                    }
                    game_data = await GAME_GENERATOR.generate_game(user_profile, goal)

                    if game_data and "error" not in game_data:
                        yield f"data: {json.dumps({'type': 'game', 'content': game_data})}\n\n"
                    else:
                        print("⚠️ Error generando juego o Gemini devolvió error.")
                except Exception as inner_ge:
                    print(f"⚠️ Error en orquestación de juego: {inner_ge}")

            # 2. Transición a Respuesta [TEXTO]
            if "[TEXTO]" in full_content and not is_resp:
                is_resp = True
                print("DEBUG: [TEXTO] tag detectado. Iniciando streaming de respuesta.")
                try:
                    # Extraer Análisis (Soporta [ANALISIS] y [ANALYSIS])
                    ana_tag = "[ANALISIS]" if "[ANALISIS]" in full_content else "[ANALYSIS]"
                    if ana_tag in full_content:
                        try:
                            # Intenta capturar el bloque JSON entre el tag y [TEXTO]
                            ana_blob = full_content.split(ana_tag)[1].split("[TEXTO]")[0].strip()
                            # Limpieza exhaustiva
                            ana_blob = re.sub(r'^[:\s]+', '', ana_blob)
                            # Extraer solo lo que está entre llaves si hay ruido extra
                            json_match = re.search(r'\{.*\}', ana_blob, re.DOTALL)
                            if json_match:
                                ana_blob = json_match.group(0)
                            elif "{" in ana_blob and "}" not in ana_blob:
                                ana_blob += "}"

                            # print(f"DEBUG: Bloque Análisis Extraído: '{ana_blob}'")
                            ana_json = json.loads(ana_blob)

                            # Mapeo de nombres cortos v, t, e a nombres largos si es necesario
                            mapped_ana = {}
                            if "v" in ana_json:
                                mapped_ana["valence_delta"] = ana_json["v"]
                            if "t" in ana_json:
                                mapped_ana["tension_delta"] = ana_json["t"]
                            if "e" in ana_json:
                                mapped_ana["engagement_delta"] = ana_json["e"]

                            update_eleonor_state(mapped_ana or ana_json, session)
                        except Exception as inner_e:
                            print(f"⚠️ Error parsing JSON de análisis: {inner_e}")

                    # Forzar envío de estado SIEMPRE que entremos en respuesta
                    current_mode = get_behavioral_mode(session, {})
                    yield f"data: {json.dumps({'type': 'mode', 'content': current_mode})}\n\n"

                    session_state = {
                        "valence": session.valence,
                        "tension": session.tension,
                        "engagement": session.engagement,
                        "boundary": session.boundary
                    }
                    yield f"data: {json.dumps({'type': 'state', 'content': session_state})}\n\n"
                    yield f"data: {json.dumps({'type': 'expression', 'content': map_expression(session)})}\n\n"

                    # Enviar el primer trozo de texto que llegó con el tag
                    rem_text = full_content.split("[TEXTO]")[-1]
                    if rem_text and interaction_decision != "pause":
                        yield f"data: {json.dumps({'type': 'text', 'content': rem_text})}\n\n"
                except Exception as e:
                    print(f"⚠️ Error procesando metadatos: {e}")
                continue

            if is_resp and interaction_decision != "pause" and chunk.choices:
                yield f"data: {json.dumps({'type': 'text', 'content': delta})}\n\n"

            # 4. Captura de Tokens (Real Usage)
            if chunk.usage:
                u = chunk.usage
                print(
                    f"📊 [TOKENS] Prompt: {u.prompt_tokens} | Completion: {u.completion_tokens} | Total: {u.total_tokens}")

        # Si el stream termina y nunca activamos is_resp (porque faltó el tag [TEXTO])
        if not is_resp and full_content.strip():
            print("⚠️ Tag [TEXTO] no encontrado o incompleto. Aplicando limpieza Regex intensiva.")
            cleaned_text = re.sub(r'\[(DECISION|ANALISIS|ANALYSIS|GAME|TEXTO)\].*?(\[|$)',
                                  '', full_content, flags=re.DOTALL).strip()
            cleaned_text = re.sub(r'\[.*?\]', '', cleaned_text).strip()
            if cleaned_text:
                yield f"data: {json.dumps({'type': 'text', 'content': cleaned_text})}\n\n"
                is_resp = True

        # --- AUDIO FINAL ---
        res_text = ""
        if "[TEXTO]" in full_content:
            res_text = full_content.split("[TEXTO]")[-1].strip()
        elif is_resp:
            res_text = full_content.split("]")[-1].strip() if "]" in full_content else full_content

        if res_text and interaction_decision != "pause":
            print(f"✨ [ELEONOR] > {res_text}")
            print(f"DEBUG: Generando voz SSML para: {res_text[:30]}...")
            yield f"data: {json.dumps({'type': 'status', 'content': 'synthesizing_audio'})}\n\n"

            # Determinamos el modo SSML basado en el estado
            ssml_mode = get_ssml_voice_mode(session)
            audio_b64 = await generate_ssml_tts_base64(res_text, ssml_mode, {
                "valence": session.valence,
                "tension": session.tension,
                "engagement": session.engagement
            })

            if audio_b64:
                yield f"data: {json.dumps({'type': 'audio', 'content': audio_b64})}\n\n"

            # Guardar respuesta en el historial
            new_assistant_msg = ChatMessage(role="assistant", content=res_text, session_id=session_id, user_id=user_id)
            db.add(new_assistant_msg)
            # El log de tokens ya ocurre arriba vía chunk.usage

        # --- ACTUALIZACIÓN FINAL DE ESTADO (PERSISTENCIA DB) ---
        session.last_updated = datetime.datetime.utcnow()
        db.commit()

        session_state = {
            "valence": session.valence,
            "tension": session.tension,
            "engagement": session.engagement,
            "boundary": session.boundary
        }
        yield f"data: {json.dumps({'type': 'state', 'content': session_state})}\n\n"

        current_mode = get_behavioral_mode(session, {})
        yield f"data: {json.dumps({'type': 'mode', 'content': current_mode})}\n\n"

        yield f"data: {json.dumps({'type': 'done', 'content': ''})}\n\n"
    except Exception as e:
        import traceback
        traceback.print_exc()
        yield f"data: {json.dumps({'type': 'error', 'content': f'Stream crashed: {str(e)}'})}\n\n"
    finally:
        db.close()


@router.post("/api/chat/stream")
async def chat_stream(request: ChatRequest, user_id: int = Depends(get_current_user_id)):
    """Endpoint de streaming de chat.

    Args:
        request (ChatRequest): Texto enviado por el usuario.
        user_id (int): ID del usuario autenticado.

    Returns:
        StreamingResponse: Flujo de eventos SSE con texto, estado y audio.
    """
    return StreamingResponse(generate_response_stream(request.text, user_id), media_type="text/event-stream")