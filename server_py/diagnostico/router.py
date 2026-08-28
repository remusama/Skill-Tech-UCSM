from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import json

# Updated import to point to the new modular package
# Updated imports to point to the new modular package
from server_py.diagnostico.agents import analyze_exam, generate_unified_prompt, ELEONOR_SYNTH
from server_py.memoria.database import get_db, UserSkill, ExamResult, EleonorHistory
from server_py.mentoria.models import Agent
from server_py.memoria.skills import update_user_skills, get_skill_snapshot, get_trends, AREA_MAPPING
from server_py.diagnostico.agents.game_generator import GAME_GENERATOR
from server_py.auth.router import get_current_user_id

router = APIRouter(prefix="/api/diagnosis", tags=["Diagnosis"])

class ItemTelemetry(BaseModel):
    time_spent_ms: int = 0
    keystrokes: int = 0
    deletions: int = 0
    focus_lost_count: int = 0

class ExamItem(BaseModel):
    questionId: int
    question: str
    answer: str 
    type: str
    telemetry: Optional[ItemTelemetry] = None

class ExamSubmission(BaseModel):
    examTitle: str
    area: str
    items: List[ExamItem]
    totalTime: float
    technicalSummary: Optional[str] = None
    csat_score: Optional[int] = None
    rage_clicks: Optional[int] = 0
    agent_id: Optional[int] = None

class GameTelemetry(BaseModel):
    game_id: str
    game_type: str
    reaction_time_ms: float
    rule_adaptation_delay: float
    accuracy: float
    frustration_level: float  # Scale 0-1
    abandoned: bool

class ExplanationRequest(BaseModel):
    question: str
    options: List[Any]

async def process_exam_background(submission_area: str, submission_data: dict, user_id: int):
    # Create a fresh DB session for the background task
    from server_py.memoria.database import SessionLocal
    db = SessionLocal()
    try:
        # 1. Analyze with AI
        ai_result = await analyze_exam(submission_area, submission_data)
        
        # 2. Store result and update skills in DB
        update_user_skills(db, submission_area, ai_result, user_id)
        
        # 3. Handle Eleonor History / Context update if needed in background
        print(f"Background analysis complete for User {user_id} in {submission_area}")
    except Exception as e:
        print(f"Error in background exam processing: {e}")
    finally:
        db.close()

@router.post("/")
async def submit_exam(submission: ExamSubmission, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    try:
        # --- ANALYTICS PIPELINE (Phase 2) ---
        from server_py.diagnostico.analytics import process_telemetry_pipeline
        from server_py.memoria.database import UserSkill
        from server_py.memoria.skills import AREA_MAPPING
        
        # Get baseline from UserSkill
        skill_name = AREA_MAPPING.get(submission.area.lower(), submission.area)
        user_skill = db.query(UserSkill).filter(UserSkill.area == skill_name, UserSkill.user_id == user_id).first()
        previous_baseline = user_skill.analytics_baseline if user_skill else None
        
        analytics_result = process_telemetry_pipeline(submission.items, submission.area, previous_baseline)
        
        # --- LOG MATEMÁTICO (ANALYTICS) ---
        print("\n" + "="*50)
        print("📊 [ANALYTICS LOG FINAL] Resultados Matemáticos Fase 2")
        print("="*50)
        print(f"Area: {submission.area} | Status: {analytics_result.get('status')}")
        cluster_info = analytics_result.get("clustering", {})
        print(f"Cluster Asignado: {cluster_info.get('session_cluster', 'N/A')}")
        if 'z_scores' in analytics_result:
            zs = analytics_result['z_scores']
            print(f"Z-Scores -> Tiempo: {zs.get('z_time', 0):.2f} | Fricción: {zs.get('z_friction', 0):.2f} | Densidad: {zs.get('z_density', 0):.2f}")
        if 'filtered_data' in analytics_result:
            fd = analytics_result['filtered_data']
            print(f"Filtrados (IQR) -> Tiempos atípicos: {fd.get('outlier_times_count', 0)}")
        print("="*50 + "\n")
        
        # Construimos un dict que pasaremos al LLM, inyectándole la analítica
        payload_for_ai = submission.dict()
        payload_for_ai["analytics_data"] = analytics_result
        
        # 1. Connect mentor-created agents to the diagnostic engine when present.
        mentor_agent = None
        if submission.agent_id is not None:
            agent = db.query(Agent).filter(Agent.id == submission.agent_id).first()
            if not agent:
                raise HTTPException(status_code=422, detail="El agente de mentoría seleccionado no existe.")
            mentor_agent = {
                "id": agent.id,
                "name": agent.name,
                "system_prompt": agent.system_prompt,
                "competencies": agent.competencies or [],
            }
            payload_for_ai["mentor_agent"] = mentor_agent

        # 2. Analyze with AI (Synchronous for immediate feedback)
        ai_result = await analyze_exam(submission.area, payload_for_ai, mentor_agent=mentor_agent)
        
        # --- ITEM RESPONSE THEORY (TRI) CALCULATION (Phase 3) ---
        try:
            from server_py.diagnostico.analytics.irt import estimate_latent_ability
            
            # Map graded items from AI result. If the agent failed to output graded_items, fallback to comparing strings or using all correct
            graded_items = ai_result.get("graded_items", [])
            
            # If graded_items is empty or not in the right format, fallback or construct it based on items
            if not graded_items:
                precision = ai_result.get("metricas_base", {}).get("precision", 0.7)
                graded_items = []
                for idx, item in enumerate(submission.items):
                    is_correct = (idx / max(1, len(submission.items))) < precision
                    graded_items.append({
                        "questionId": item.questionId,
                        "question": item.question,
                        "correct": is_correct
                    })
            else:
                id_to_item = {item.questionId: item for item in submission.items}
                for item in graded_items:
                    q_id = item.get("questionId")
                    if q_id in id_to_item:
                        item["question"] = id_to_item[q_id].question
            
            tri_result = estimate_latent_ability(graded_items)
            ai_result["score_tri"] = tri_result["score_tri"]
            ai_result["theta"] = tri_result["theta"]
            print(f"📊 [TRI DIAGNOSTIC ENGINE] Theta: {tri_result['theta']} | Score TRI: {tri_result['score_tri']}")
        except Exception as e:
            print(f"⚠️ Error running TRI mathematical model: {e}")
            ai_result["score_tri"] = ai_result.get("nivel", 50.0)
            ai_result["theta"] = 0.0
            
        # Attach satisfaction metrics from submission payload
        ai_result["csat_score"] = submission.csat_score
        ai_result["rage_clicks"] = submission.rage_clicks
        
        # Include raw items (answers) and telemetry for the diagnostics view
        ai_result["raw_responses"] = [item.dict() for item in submission.items]
        
        # Save the new baseline back to DB before committing
        if user_skill and analytics_result.get("status") == "success":
            user_skill.analytics_baseline = analytics_result.get("new_baseline")
            
        ai_result["analytics_pipeline"] = analytics_result
        
        # 2. Store result and update skills in DB
        update_user_skills(db, submission.area, ai_result, user_id)
        
        # 2.5 Motor de Patrones Globales
        from server_py.diagnostico.agents.profile_agent import GlobalProfileAgent
        profile_agent = GlobalProfileAgent()
        profile_analysis = await profile_agent.analyze_patterns(db, user_id)
        if profile_analysis:
            ai_result["global_profile_update"] = profile_analysis
        
        # 3. Calculate snapshot and trends for the session state response
        snapshot = get_skill_snapshot(db, user_id)
        trends = get_trends(db, user_id)
        
        # 4. Generate Eleonor spoken analysis (Personalized)
        try:
            # Pequeño delay para evitar ráfagas (429) en el tier gratuito
            import asyncio
            await asyncio.sleep(1.5)
            spoken_analysis = await ELEONOR_SYNTH.generate_spoken_diagnosis(ai_result, snapshot)
            ai_result["spoken_analysis"] = spoken_analysis
        except Exception as e:
            print(f"⚠️ Error generando síntesis de Eleonor: {e}")
            ai_result["spoken_analysis"] = None
        
        # Add metadata for tracking
        ai_result["exam_title"] = submission.examTitle
        ai_result["timestamp"] = datetime.utcnow().isoformat()
        
        return {
            "analysis": ai_result,
            "session_state": {
                "skill_snapshot": snapshot,
                "trends": trends
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error processing exam: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/skills")
async def get_all_skills(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()
    return skills


@router.get("/progress-history")
async def get_progress_history(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """
    Returns data for the 'Evolución de Aprendizaje' chart.
    Groups exam results by month and area.
    """
    results = db.query(ExamResult).filter(ExamResult.user_id == user_id).order_by(ExamResult.timestamp.asc()).all()
    
    # Simple grouping by month (Ene, Feb, etc.)
    months_map = {1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr", 5: "May", 6: "Jun", 
                  7: "Jul", 8: "Ago", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic"}
    
    history = {}
    for r in results:
        month_name = months_map.get(r.timestamp.month, "Unknown")
        if month_name not in history:
            history[month_name] = {"name": month_name}
        
        # Skill name from mapping
        skill_name = AREA_MAPPING.get(r.area.lower(), r.area)
        # Store latest score for that month/area
        history[month_name][skill_name] = r.score / 10 # Scale to 0-10 for chart
        
    # Convert to list and ensure chronological order (simple list for now)
    return list(history.values())


@router.get("/benchmarking")
async def get_benchmarking(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """
    Returns data for the 'Análisis Comparativo' chart.
    Compares current user levels with global averages.
    """
    from sqlalchemy import func
    skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()
    comparison = []
    
    # Calculate real global averages from DB
    avg_results = db.query(UserSkill.area, func.avg(UserSkill.level).label('average_level')).group_by(UserSkill.area).all()
    global_averages = {area: float(avg) / 10 for area, avg in avg_results}
    
    for s in skills:
        comparison.append({
            "name": s.area,
            "Nivel": s.level / 10,
            "Promedio": global_averages.get(s.area, 0.0)
        })
    
    return comparison


@router.get("/unified-prompt")
async def get_unified_prompt():
    return {"prompt": "Contexto unificado no disponible mediante este endpoint."}

@router.post("/game-result")
async def save_game_result(telemetry: GameTelemetry, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """
    Recibe los datos del mini-juego y los procesa para actualizar 
    la métrica de Adaptabilidad.
    """
    try:
        # 1. Crear un reporte para el Agente de Adaptabilidad
        # En una versión futura, esto podría ser un ExamResult especial o un log
        print(f"DEBUG: Telemetría recibida | User: {user_id} | Game: {telemetry.game_id} | Accuracy: {telemetry.accuracy}")
        
        # 2. Actualizar el "Hito" en EleonorHistory para que ella lo sepa en el próximo mensaje
        h_summary = f"Realizó un desafío de {telemetry.game_type}. Adaptabilidad: {telemetry.accuracy*100}%."
        if telemetry.rule_adaptation_delay > 2000:
             h_summary += " Se detectó resistencia al cambio de reglas."
        
        new_hito = EleonorHistory(
            user_id=user_id,
            timestamp=datetime.utcnow(),
            summary=h_summary,
            signals=json.dumps({
                "type": "game_telemetry",
                "game_id": telemetry.game_id,
                "adaptation_delay": telemetry.rule_adaptation_delay,
                "frustration": telemetry.frustration_level
            })
        )
        db.add(new_hito)
        
        # 3. Actualizar la Skill de Adaptabilidad directamente si existe
        adapt_skill = db.query(UserSkill).filter(UserSkill.user_id == user_id, UserSkill.area == "Adaptabilidad").first()
        if adapt_skill:
            # Lógica simple de actualización
            delta = (telemetry.accuracy * 5) - (telemetry.rule_adaptation_delay / 1000)
            adapt_skill.level = max(0, min(100, adapt_skill.level + delta))
            adapt_skill.last_updated = datetime.utcnow()
        
        db.commit()
        return {"status": "success", "summary": h_summary}
    except Exception as e:
        print(f"❌ Error guardando resultado de juego: {e}")
        raise HTTPException(status_code=500, detail="Error interno")

@router.get("/debug-game")
async def generate_debug_game(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """
    Genera un juego de prueba inmediatamente.
    """
    try:
        # Perfil ficticio o basado en DB
        user_profile = {
            "state": {"valence": "neutra", "tension": 0.5, "engagement": 0.5},
            "cognitive": "Usuario en modo debug."
        }
        game_data = await GAME_GENERATOR.generate_game(user_profile, "Prueba manual de sistema")
        return game_data
    except Exception as e:
        print(f"❌ Error generando debug game: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/explain")
async def explain_question(request: ExplanationRequest, user_id: int = Depends(get_current_user_id)):
    """
    Generates a spoken explanation for a specific question.
    """
    try:
        explanation = await ELEONOR_SYNTH.generate_question_explanation(request.question, request.options)
        return {"explanation": explanation}
    except Exception as e:
        print(f"❌ Error generando explicación: {e}")
        raise HTTPException(status_code=500, detail=str(e))
