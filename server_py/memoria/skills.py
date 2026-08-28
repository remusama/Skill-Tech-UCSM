from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from .database import UserSkill, ExamResult, EleonorHistory
import datetime
import json

# Mapping AI Areas to SkillMap Categories
AREA_MAPPING = {
    "matematicas": "Matemáticas",
    "matemática": "Matemáticas",
    "ciencias": "Ciencias",
    "ciencía": "Ciencias",
    "humanidades": "Humanidades",
    "ingenieria": "Ingeniería",
    "ingeniería": "Ingeniería",
    "medicina": "Medicina",
    "razonamiento": "Razonamiento",
    "aprendizaje": "Aprendizaje",
    "criterio": "Criterio",
    "adaptabilidad": "Adaptabilidad",
    "autonomia": "Autonomía",
    "autonomía": "Autonomía",
    "liderazgo": "Liderazgo",
    "comunicacion": "Comunicación",
    "comunicación": "Comunicación",
    "cognitivo-academico": "Cognitivo-Académico"
}


def update_user_skills(db: Session, area: str, ai_diagnosis: dict, user_id: int):
    """
    Translates AI JSON output into a numerical skill update.
    """
    skill_name = AREA_MAPPING.get(area.lower(), area)
    new_level = ai_diagnosis.get("nivel", 0)
    
    bloom = ai_diagnosis.get("bloom_matrix")
    tri = ai_diagnosis.get("score_tri")
    csat = ai_diagnosis.get("csat_score")
    clicks = ai_diagnosis.get("rage_clicks")
    
    # --- BEHAVIORAL SCORING MODIFIER (Phase 1) ---
    b_metrics = ai_diagnosis.get("behavioral_metrics")
    if b_metrics:
        pass
        
    # Update or Create UserSkill
    skill = db.query(UserSkill).filter(UserSkill.area == skill_name, UserSkill.user_id == user_id).first()
    
    # Handle incremental diagnosis (store as a list of stages)
    new_diagnosis = ai_diagnosis
    
    if not skill:
        skill = UserSkill(
            area=skill_name, 
            level=new_level, 
            user_id=user_id, 
            current_diagnosis=[new_diagnosis], # Initialize as a list
            bloom_matrix=bloom,
            score_tri=tri
        )
        db.add(skill)
    else:
        # Weighted average to smooth transitions
        skill.level = int((skill.level * 0.7) + (new_level * 0.3))
        skill.bloom_matrix = bloom
        skill.score_tri = tri
        
        # Incremental history
        history = skill.current_diagnosis or []
        if isinstance(history, dict):
            history = [history] # Migrate legacy single object
            
        history.append(new_diagnosis)
        skill.current_diagnosis = history
        flag_modified(skill, "current_diagnosis")
        skill.last_updated = datetime.datetime.utcnow()
    
    # Save raw exam result for history
    exam_record = ExamResult(
        user_id=user_id,
        area=area,
        score=new_level,
        data=ai_diagnosis,
        csat_score=csat,
        rage_clicks=clicks,
        score_tri=tri
    )
    db.add(exam_record)
    
    # Logic for EleonorHistory (State Compression)
    _update_eleonor_history(db, area, ai_diagnosis, skill.level, user_id)
    
    db.commit()

def _update_eleonor_history(db: Session, area: str, diagnosis: dict, current_level: int, user_id: int):
    """
    Compresses technical diagnosis into a cognitive signal for Eleonor.
    """
    observaciones = diagnosis.get("observaciones", "")
    
    # Determine signal
    signal = f"{area}_up" if diagnosis.get("nivel", 0) > 60 else f"{area}_needs_work"
    
    history_entry = EleonorHistory(
        user_id=user_id,
        summary=f"Evaluación de {area}: {observaciones}",
        signals=[signal],
        confidence=0.8 # Static for now, could be dynamic from AI
    )
    db.add(history_entry)

def get_skill_snapshot(db: Session, user_id: int):
    """
    Returns a high-density snapshot of all skills for unified_synthesizer.
    Includes technical observations to allow Eleonor to 'see' the database.
    """
    skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()
    snapshot = {}
    for s in skills:
        history = s.current_diagnosis or []
        # Support both single object (legacy) and list of diagnoses
        diag = history[-1] if isinstance(history, list) and len(history) > 0 else (history if isinstance(history, dict) else {})
        
        snapshot[s.area.lower()] = {
            "nivel_label": "alto" if s.level > 70 else "medio" if s.level > 40 else "bajo",
            "score": s.level,
            "razonamiento": diag.get("razonamiento", "No detectado"),
            "observaciones": diag.get("observaciones", "Sin detalles técnicos")
        }
    
    return snapshot

def get_trends(db: Session, user_id: int):
    """
    Calculates trends based on last 5 exams vs previous state.
    """
    from sqlalchemy import func
    
    trends = {}
    
    # Get last 3 areas evaluated
    last_areas = db.query(ExamResult.area).filter(ExamResult.user_id == user_id).order_by(ExamResult.timestamp.desc()).limit(3).all()
    unique_areas = list(set([a[0] for a in last_areas]))
    
    for area in unique_areas:
        # Average of last 2 vs average of previous 5
        results = db.query(ExamResult.score).filter(ExamResult.area == area, ExamResult.user_id == user_id).order_by(ExamResult.timestamp.desc()).limit(7).all()
        scores = [r[0] for r in results]
        
        if len(scores) >= 3:
            recent_avg = sum(scores[:2]) / 2
            past_avg = sum(scores[2:]) / len(scores[2:])
            
            diff = recent_avg - past_avg
            if diff > 5: trends[area] = "up"
            elif diff < -5: trends[area] = "down"
            else: trends[area] = "stable"
            
    return trends if trends else {"general": "estático"}
