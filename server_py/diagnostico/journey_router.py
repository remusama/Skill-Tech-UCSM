from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from server_py.memoria.database import get_db, UserSkill, LearningJourney, JourneySession, User
from server_py.auth.router import get_current_user_id
from server_py.diagnostico.agents.content_engine import INTERPRETE, ARQUITECTO
from server_py.diagnostico.gamification_router import update_user_streak

router = APIRouter(prefix="/api/journey", tags=["Learning Journey"])

@router.post("/generate")
async def generate_journey(area: str, force: bool = False, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """
    Orquesta la generación de una ruta de aprendizaje de 5 sesiones para un área específica.
    Insiste en que exista un diagnóstico previo para dicha área.
    """
    # Normalización extendida para asegurar coincidencia
    mapping = {
        "matematicas": "Matemáticas",
        "matemáticas": "Matemáticas",
        "matemática": "Matemáticas",
        "ciencias": "Ciencias",
        "humanidades": "Humanidades",
        "razonamiento": "Razonamiento",
        "autonomia": "Autonomía",
        "autonomía": "Autonomía",
        "aprendizaje": "Aprendizaje"
    }
    
    norm_area = mapping.get(area.lower(), area)
    
    # 2. Validar diagnóstico específico para esta área
    target_skill = db.query(UserSkill).filter(
        UserSkill.user_id == user_id, 
        UserSkill.area == norm_area
    ).first()
    
    # REGLA ESTRICTA: Debe existir el registro Y tener un diagnóstico JSON (lo que indica que hizo el examen)
    if not target_skill or target_skill.current_diagnosis is None:
        raise HTTPException(
            status_code=400, 
            detail=f"No detectamos un diagnóstico real para '{area}'. Por favor, completa la evaluación de esta área antes de que la IA genere tu ruta. Un nivel 0 no es suficiente sin datos previos."
        )

    # 3. Check if an active journey already exists for THIS area
    existing = db.query(LearningJourney).filter(
        LearningJourney.user_id == user_id,
        LearningJourney.area == area,
        LearningJourney.status == "active"
    ).all()
    
    if existing and not force:
        return {"status": "exists", "journey_id": existing[0].id}
    
    if force:
        # Desactivar rutas previas
        for old_j in existing:
            old_j.status = "replaced"
        db.flush()

    # Obtener todas las skills para dar contexto al agente, pero resaltar la actual
    all_skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()
    skills_map = {s.area: s.level for s in all_skills}
    
    # Extraer el diagnóstico detallado del área objetivo
    detailed_diag = target_skill.current_diagnosis
    
    try:
        # 4. Paso 1: Agente Interprete diseña la estructura usando niveles y diagnóstico detallado
        plan_estructural = await INTERPRETE.disenar_ruta(skills_map, area, detailed_diag)
        
        # 4. Crear cabecera de la jornada en DB
        new_journey = LearningJourney(
            user_id=user_id,
            area=area,
            objective=plan_estructural["objetivo_general"],
            current_session=1,
            total_sessions=5,
            status="active"
        )
        db.add(new_journey)
        db.flush() 

        # 5. Paso 2: Agente Arquitecto construye el contenido de cada sesión
        obj_ruta = plan_estructural["objetivo_general"]
        for s_plan in plan_estructural["sesiones"]:
            contenido = await ARQUITECTO.construir_sesion(s_plan, obj_ruta)
            
            new_session = JourneySession(
                journey_id=new_journey.id,
                session_number=s_plan["numero"],
                title=s_plan["titulo"],
                objective=s_plan["objetivo_especifico"],
                type=s_plan["tipo_trabajo"],
                content=contenido,
                is_completed=0
            )
            db.add(new_session)
        
        db.commit()
        return {"status": "success", "journey_id": new_journey.id, "plan": plan_estructural}
        
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        print(f"Error generando journey para {area}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/current")
async def get_current_journey(area: str, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """
    Retorna la ruta activa del usuario para un área específica.
    """
    journey = db.query(LearningJourney).filter(
        LearningJourney.user_id == user_id, 
        LearningJourney.area == area,
        LearningJourney.status == "active"
    ).order_by(LearningJourney.created_at.desc()).first()
    
    if not journey:
        return {"status": "none", "message": f"No hay ruta activa para {area}."}
    
    sessions = db.query(JourneySession).filter(
        JourneySession.journey_id == journey.id
    ).order_by(JourneySession.session_number.asc()).all()
    
    return {
        "status": "success",
        "journey": journey,
        "sessions": sessions
    }

@router.patch("/progress")
async def update_progress(session_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """
    Marca una sesión como completada y avanza el puntero de la ruta.
    """
    session = db.query(JourneySession).filter(JourneySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    journey = db.query(LearningJourney).filter(LearningJourney.id == session.journey_id).first()
    if journey.user_id != user_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    session.is_completed = 1
    session.completed_at = datetime.utcnow()
    
    # Avanzar current_session si es necesario
    if journey.current_session == session.session_number and journey.current_session < 5:
        journey.current_session += 1
    elif journey.current_session == 5 and session.session_number == 5:
        journey.status = "completed"
    
    # Gamification: Update streak and award XP
    user = db.query(User).filter(User.id == user_id).first()
    update_user_streak(db, user)
    
    # Extra XP for completing a session
    user.xp += 50
    
    # Award area-specific XP
    target_skill = db.query(UserSkill).filter(
        UserSkill.user_id == user_id,
        UserSkill.area == journey.area
    ).first()
    if target_skill:
        target_skill.skill_xp += 50
    
    db.commit()
    return {"status": "success", "current_session": journey.current_session}
