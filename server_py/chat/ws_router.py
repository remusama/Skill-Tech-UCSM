import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from server_py.memoria.database import SessionLocal, EleonorSession, ChatMessage, ExamResult, EleonorHistory
from server_py.eleonor.brain import update_eleonor_state, get_behavioral_mode, map_expression, get_ssml_voice_mode
from server_py.eleonor.personality import get_system_prompt
from server_py.funciones.tts import generate_ssml_tts_base64
from server_py.memoria.skills import get_skill_snapshot, get_trends
from server_py.diagnostico.agents import generate_unified_prompt
from server_py.config.app_config import client
from server_py.auth.router import SECRET_KEY, ALGORITHM
import jwt
import datetime
import re

router = APIRouter()


async def get_user_id_from_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("user_id")
    except Exception:
        return None


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    user_id = None
    db = SessionLocal()

    try:
        # 1. Wait for authentication message
        print("WS: Waiting for auth message...", flush=True)
        auth_msg = await websocket.receive_text()
        print(f"WS: Auth received: {auth_msg[:50]}...", flush=True)
        auth_data = json.loads(auth_msg)
        token = auth_data.get("token")

        user_id = await get_user_id_from_token(token)
        if not user_id:
            await websocket.send_json({"type": "error", "content": "No autorizado"})
            await websocket.close()
            return

        await websocket.send_json({"type": "status", "content": "connected", "user_id": user_id})

        # 1.5 Send Welcome Message
        from server_py.chat.welcome import generate_welcome_message
        welcome_data = await generate_welcome_message(db, user_id)
        if welcome_data.get("text"):
            # Send text
            await websocket.send_json({"type": "text", "content": welcome_data["text"]})
            print(f"✨ [WELCOME] > {welcome_data['text']}", flush=True)

            try:
                # Need session for TTS params
                session = db.query(EleonorSession).filter(EleonorSession.user_id == user_id).first()
                if not session:
                    session = EleonorSession(id=f"sess_{user_id}", user_id=user_id)
                    db.add(session)
                    db.commit()

                ssml_mode = get_ssml_voice_mode(session)
                audio_b64 = await generate_ssml_tts_base64(welcome_data["text"], ssml_mode, {
                    "valence": session.valence,
                    "tension": session.tension,
                    "engagement": session.engagement
                })
                if audio_b64:
                    await websocket.send_json({"type": "audio", "content": audio_b64})
            except Exception as e:
                print(f"⚠️ Error generating welcome audio: {e}")

        # 2. Main loop
        print(f"WS: Starting main loop for user {user_id}", flush=True)
        while True:
            data = await websocket.receive_text()
            print(f"WS: Message received: {data[:100]}", flush=True)
            message_data = json.loads(data)
            user_text = message_data.get("text", "")
            snapshot = message_data.get("snapshot")  # Base64 string if vision is active
            if snapshot:
                print(f"📸 [VISION] Instantánea recibida: {len(snapshot)} bytes")

            if not user_text and message_data.get("type") not in ["analyze_node", "explain_errors"]:
                continue

            # Special Handling for Node Analysis
            if message_data.get("type") == "analyze_node":
                node_name = message_data.get("node")
                print(f"🧠 [ANALYSIS] Request for node: {node_name}", flush=True)

                # Fetch skill data
                from server_py.memoria.database import UserSkill
                skill = db.query(UserSkill).filter(
                    UserSkill.user_id == user_id,  # <- esta seria la validacion extra
                    UserSkill.area.ilike(f"%{node_name}%")
                ).first()

                if not skill or not skill.current_diagnosis:
                    print(f"⚠️ [ANALYSIS] No data found for {node_name}. Ignoring.")
                    continue

                diag_context = json.dumps(skill.current_diagnosis, ensure_ascii=False)
                user_text = f"Analiza mi desempeño en {node_name}. [SYSTEM_INJECTED_DATA: {diag_context}]"

            # Special Handling for Error Explanation
            is_explain_errors = message_data.get("type") == "explain_errors"
            if is_explain_errors:
                print(f"🧩 [EXPLAIN_ERRORS] Request received from user {user_id}", flush=True)
                user_text = "Explícame los errores de mi último examen de manera constructiva y empática."

            # 3. Session and History Logic
            session = db.query(EleonorSession).filter(EleonorSession.user_id == user_id).first()
            if not session:
                session = EleonorSession(id=f"sess_{user_id}", user_id=user_id)
                db.add(session)
                db.commit()

            # Save user message
            new_user_msg = ChatMessage(role="user", content=user_text, session_id=session.id, user_id=user_id)
            db.add(new_user_msg)
            db.commit()

            # Load context
            past_messages = db.query(ChatMessage).filter(ChatMessage.user_id == user_id).order_by(ChatMessage.timestamp.desc()).limit(4).all()
            past_messages.reverse()

            last_hito = db.query(EleonorHistory).filter(EleonorHistory.user_id == user_id).order_by(EleonorHistory.timestamp.desc()).first()
            hilo_context = f"HILO: {last_hito.summary}" if last_hito else ""

            formatted_history = [{"role": msg.role, "content": msg.content} for msg in past_messages]
            if hilo_context:
                formatted_history.insert(0, {"role": "system", "content": hilo_context})

            cognitive_context = ""
            if is_explain_errors:
                # Query DB for the latest exam and extract incorrect answers
                latest_exam = db.query(ExamResult).filter(ExamResult.user_id == user_id).order_by(ExamResult.timestamp.desc()).first()

                incorrect_details = []
                if latest_exam and latest_exam.data:
                    exam_data = latest_exam.data
                    graded_items = exam_data.get("graded_items", [])
                    raw_responses = exam_data.get("raw_responses", [])

                    responses_by_id = {r.get("questionId"): r for r in raw_responses}

                    for gi in graded_items:
                        q_id = gi.get("questionId")
                        if not gi.get("correct", False):
                            resp = responses_by_id.get(q_id, {})
                            q_text = resp.get("question") or gi.get("question") or f"Pregunta {q_id}"
                            user_ans = resp.get("answer") or "Sin responder"
                            telemetry = resp.get("telemetry") or {}

                            incorrect_details.append({
                                "question_id": q_id,
                                "question": q_text,
                                "user_answer": user_ans,
                                "telemetry": telemetry
                            })

                if incorrect_details:
                    error_context = "El usuario ha solicitado una explicación de los errores cometidos en su último examen.\n"
                    error_context += f"Área del examen: {latest_exam.area}\n"
                    error_context += f"Puntaje obtenido: {latest_exam.score}/100\n\n"
                    error_context += "Aquí está la lista de preguntas incorrectas con su respectiva telemetría:\n"
                    for idx, err in enumerate(incorrect_details):
                        telemetry_str = ""
                        tel = err["telemetry"]
                        if tel:
                            time_spent = tel.get("time_spent_ms", 0) / 1000.0
                            deletions = tel.get("deletions", 0)
                            focus_lost = tel.get("focus_lost_count", 0)
                            telemetry_str = f" (Tiempo dedicado: {time_spent:.1f}s, Borrados de texto: {deletions}, Pérdidas de foco: {focus_lost})"

                        error_context += f"Pregunta {idx+1}: {err['question']}\n"
                        error_context += f"- Respuesta del usuario: \"{err['user_answer']}\"\n"
                        if telemetry_str:
                            error_context += f"- Telemetría de fricción:{telemetry_str}\n"
                        error_context += "---\n"

                    error_context += "\nINSTRUCCIONES PARA ELEONOR:\n"
                    error_context += "- DEBES actuar como Eleonor, la tutora de IA empática y mística del usuario.\n"
                    error_context += "- Explica al usuario en qué consistió cada error de forma amena, pedagógica y constructiva, sin desmotivarlo.\n"
                    error_context += "- Haz alusión a la telemetría si muestra que dudó mucho (mucho tiempo o borrados) o si perdió el foco.\n"
                    error_context += "- Dale la respuesta o razonamiento correcto paso a paso, asegurándote de que comprenda el concepto subyacente de cada pregunta fallada.\n"
                    error_context += "- Mantén tu respuesta amigable, cálida y motivadora.\n"
                else:
                    error_context = "El usuario ha solicitado una explicación de sus errores, pero en su último examen obtuvo un puntaje perfecto o no tiene errores registrados. Felicítalo cálidamente y aliéntalo a seguir así."

                cognitive_context = error_context
            elif snapshot:
                print("⚡ [VISION] Memoria cognitiva desactivada para ahorrar tokens.")
            else:
                latest_exam = db.query(ExamResult).filter(ExamResult.user_id == user_id).order_by(ExamResult.timestamp.desc()).first()
                if latest_exam:
                    print(f"📊 [DB] Datos de examen encontrados para el usuario {user_id}", flush=True)
                    snapshot_data = get_skill_snapshot(db, user_id)
                    trends = get_trends(db, user_id)
                    history_milestones = db.query(EleonorHistory).filter(EleonorHistory.user_id == user_id).order_by(EleonorHistory.timestamp.desc()).limit(5).all()
                    history_list = [{"summary": h.summary, "signals": h.signals} for h in history_milestones]
                    cognitive_context = await generate_unified_prompt(latest_exam.data, snapshot_data, trends, history_list, session_state={
                        "valence": session.valence,
                        "tension": session.tension,
                        "engagement": session.engagement
                    })
                else:
                    print(f"ℹ️ [DB] Sin datos de examen previo para el usuario {user_id}", flush=True)

            system_prompt = get_system_prompt({
                "valence": session.valence,
                "tension": session.tension,
                "engagement": session.engagement
            }, cognitive_context)

            # --- VISION INSTRUCTIONS ---
            if snapshot:
                vision_instruction = """
                [VISION_MODE ACTIVE]
                - Estás viendo una captura de la cámara del usuario.
                - DEBES responder basándote en lo que ves.
                - OBLIGATORIO: Usa [DECISION]: yes. No uses 'pause'.
                - RESPUESTA CORTA: Máximo 25 palabras.
                - Tono: Directo, tech-mystical y observador.
                """
                system_prompt += vision_instruction

            print(f"DEBUG: Cognitive Context applied: {cognitive_context[:100]}...")

            # --- CONSTRUCT MULTI-MODAL CONTENT IF NEEDED ---
            user_msg_content = user_text
            if snapshot:
                user_msg_content = [
                    {"type": "text", "text": user_text},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{snapshot}",
                            "detail": "low"  # "low" para ahorrar tokens y latencia
                        }
                    }
                ]

            llm_messages = [{"role": "system", "content": system_prompt}]

            for msg in formatted_history[:-1]:
                llm_messages.append(msg)

            # Current message
            llm_messages.append({"role": "user", "content": user_msg_content})

            # 4. LLM Streaming
            stream = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=llm_messages,
                stream=True,
                stream_options={"include_usage": True}
            )

            full_content = ""
            is_resp = False
            interaction_decision = "yes"
            text_buffer = ""

            print(f"WS: Requesting LLM for: {user_text[:20]}...", flush=True)

            async for chunk in stream:
                delta = ""
                if chunk.choices:
                    delta = chunk.choices[0].delta.content or ""
                    full_content += delta

                # Decision Parsing (Flexible keyword search)
                if not is_resp and "[DECISION]" in full_content:
                    try:
                        decision_part = full_content.split("[DECISION]")[1].split("[")[0].lower()
                        for keyword in ["yes", "minimal", "redirect", "pause"]:
                            if keyword in decision_part and interaction_decision != keyword:
                                interaction_decision = keyword
                                print(f"DEBUG: Modelo decidió (flexible): {interaction_decision}")
                                await websocket.send_json({"type": "decision", "content": interaction_decision})
                                break
                    except Exception:
                        pass

                # Text/Analysis Parsing
                if "[TEXTO]" in full_content and not is_resp:
                    is_resp = True
                    try:
                        ana_tag = "[ANALISIS]" if "[ANALISIS]" in full_content else "[ANALYSIS]"
                        if ana_tag in full_content:
                            ana_blob = full_content.split(ana_tag)[1].split("[TEXTO]")[0].strip()
                            json_match = re.search(r'\{.*\}', ana_blob, re.DOTALL)
                            if json_match:
                                ana_json = json.loads(json_match.group(0))
                                mapped_ana = {
                                    "valence_delta": ana_json.get("v", 0),
                                    "tension_delta": ana_json.get("t", 0),
                                    "engagement_delta": ana_json.get("e", 0)
                                }
                                update_eleonor_state(mapped_ana, session)

                        await websocket.send_json({"type": "mode", "content": get_behavioral_mode(session, {})})

                        # Send first text chunk
                        rem_text = full_content.split("[TEXTO]")[-1]
                        if rem_text and interaction_decision != "pause":
                            text_buffer += rem_text
                            await websocket.send_json({"type": "text", "content": rem_text})
                    except Exception:
                        pass
                    continue

                if is_resp and interaction_decision != "pause" and chunk.choices:
                    text_buffer += delta
                    await websocket.send_json({"type": "text", "content": delta})

                # Capture usage data at the end of the stream
                if chunk.usage:
                    u = chunk.usage
                    print(f"📊 [TOKENS] Prompt: {u.prompt_tokens} | Completion: {u.completion_tokens} | Total: {u.total_tokens}", flush=True)

            # 5. Fallback if tags were missing
            if not is_resp and full_content.strip():
                print("⚠️ Tag [TEXTO] no encontrado o incompleto. Aplicando limpieza Regex intensiva.")
                cleaned_text = re.sub(r'\[(DECISION|ANALISIS|ANALYSIS|GAME|TEXTO)\].*?(\[|$)', '', full_content, flags=re.DOTALL).strip()
                cleaned_text = re.sub(r'\[.*?\]', '', cleaned_text).strip()

                if cleaned_text:
                    text_buffer = cleaned_text
                    await websocket.send_json({"type": "text", "content": cleaned_text})
                    is_resp = True
                else:
                    print("⚠️ Limpieza resultó en texto vacío.")

            # 6. Finalize Session and Audio (After LLM ends)
            if text_buffer and interaction_decision != "pause":
                print(f"✨ [ELEONOR] > {text_buffer}", flush=True)
                await websocket.send_json({"type": "status", "content": "synthesizing_audio"})
                ssml_mode = get_ssml_voice_mode(session)
                audio_b64 = await generate_ssml_tts_base64(text_buffer, ssml_mode, {
                    "valence": session.valence,
                    "tension": session.tension,
                    "engagement": session.engagement
                })
                if audio_b64:
                    await websocket.send_json({"type": "audio", "content": audio_b64})

            # Persist state
            session.last_updated = datetime.datetime.utcnow()
            db.commit()

            await websocket.send_json({
                "type": "state",
                "content": {
                    "valence": session.valence,
                    "tension": session.tension,
                    "engagement": session.engagement,
                    "boundary": session.boundary
                }
            })
            await websocket.send_json({"type": "expression", "content": map_expression(session)})
            await websocket.send_json({"type": "done", "content": ""})

    except WebSocketDisconnect:
        print(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        print(f"WS Error: {e}")
        try:
            await websocket.send_json({"type": "error", "content": str(e)})
        except Exception:
            pass
    finally:
        db.close()
