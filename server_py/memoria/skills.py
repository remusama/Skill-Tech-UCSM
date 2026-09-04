"""Gestión de habilidades, diagnósticos y tendencias del usuario.

Este módulo traduce resultados de diagnóstico en actualizaciones de
habilidades, conserva el historial de evaluaciones y genera resúmenes
para el contexto conversacional de Eleonor.
"""

import datetime

from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from .database import EleonorHistory, ExamResult, UserSkill

# Mapeo de áreas identificadas por la IA a categorías del SkillMap.
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
    "cognitivo-academico": "Cognitivo-Académico",
    "liderazgo": "Liderazgo",
    "personalidad_neo": "Personalidad",
    "personalidad": "Personalidad",
}


def update_user_skills(
    db: Session,
    area: str,
    ai_diagnosis: dict,
    user_id: int,
) -> None:
    """Actualiza la habilidad de un usuario a partir de un diagnóstico.

    Traduce el área recibida, crea o actualiza la habilidad
    correspondiente, registra el resultado del examen y genera una
    entrada resumida para el historial de Eleonor.
    """
    skill_name = AREA_MAPPING.get(area.lower(), area)
    new_level = ai_diagnosis.get("nivel", 0)

    bloom = ai_diagnosis.get("bloom_matrix")
    tri = ai_diagnosis.get("score_tri")
    csat = ai_diagnosis.get("csat_score")
    clicks = ai_diagnosis.get("rage_clicks")

    # Reservado para futuras métricas de comportamiento.
    behavioral_metrics = ai_diagnosis.get("behavioral_metrics")
    if behavioral_metrics:
        pass

    skill = (
        db.query(UserSkill)
        .filter(
            UserSkill.area == skill_name,
            UserSkill.user_id == user_id,
        )
        .first()
    )

    # Conserva cada diagnóstico como una etapa del historial.
    new_diagnosis = ai_diagnosis

    if not skill:
        skill = UserSkill(
            area=skill_name,
            level=new_level,
            user_id=user_id,
            current_diagnosis=[new_diagnosis],  # Initialize as a list
            bloom_matrix=bloom,
            score_tri=tri
        )
        db.add(skill)
    else:
        # Suaviza las transiciones mediante un promedio ponderado.
        skill.level = int((skill.level * 0.7) + (new_level * 0.3))
        skill.bloom_matrix = bloom
        skill.score_tri = tri

        history = skill.current_diagnosis or []
        if isinstance(history, dict):
            history = [history]

        history.append(new_diagnosis)
        skill.current_diagnosis = history
        flag_modified(skill, "current_diagnosis")
        skill.last_updated = datetime.datetime.utcnow()

    # Guarda el resultado original del examen.
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

    # Resume el diagnóstico como una señal cognitiva para Eleonor.
    _update_eleonor_history(
        db,
        area,
        ai_diagnosis,
        skill.level,
        user_id,
    )

    db.commit()


def _update_eleonor_history(
    db: Session,
    area: str,
    diagnosis: dict,
    current_level: int,
    user_id: int,
) -> None:
    """Resume un diagnóstico técnico en una señal para Eleonor."""
    observaciones = diagnosis.get("observaciones", "")

    signal = (
        f"{area}_up"
        if diagnosis.get("nivel", 0) > 60
        else f"{area}_needs_work"
    )

    history_entry = EleonorHistory(
        user_id=user_id,
        summary=f"Evaluación de {area}: {observaciones}",
        signals=[signal],
        confidence=0.8
    )
    db.add(history_entry)


def get_skill_snapshot(db: Session, user_id: int):
    """Obtiene un resumen de las habilidades del usuario."""
    skills = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == user_id)
        .all()
    )
    snapshot = {}
    for skill in skills:
        history = skill.current_diagnosis or []

        if isinstance(history, list) and history:
            diagnosis = history[-1]
        elif isinstance(history, dict):
            diagnosis = history
        else:
            diagnosis = {}

        if skill.level > 70:
            level_label = "alto"
        elif skill.level > 40:
            level_label = "medio"
        else:
            level_label = "bajo"

        snapshot[skill.area.lower()] = {
            "nivel_label": level_label,
            "score": skill.level,
            "razonamiento": diagnosis.get(
                "razonamiento",
                "No detectado",
            ),
            "observaciones": diagnosis.get(
                "observaciones",
                "Sin detalles técnicos",
            ),
        }

    return snapshot


def get_trends(db: Session, user_id: int):
    """Calcula tendencias a partir de las evaluaciones recientes."""
    trends = {}

    last_areas = (
        db.query(ExamResult.area)
        .filter(ExamResult.user_id == user_id)
        .order_by(ExamResult.timestamp.desc())
        .limit(3)
        .all()
    )
    unique_areas = list(set([a[0] for a in last_areas]))

    for area in unique_areas:
        results = (
            db.query(ExamResult.score)
            .filter(
                ExamResult.area == area,
                ExamResult.user_id == user_id,
            )
            .order_by(ExamResult.timestamp.desc())
            .limit(7)
            .all()
        )
        scores = [r[0] for r in results]

        if len(scores) >= 3:
            recent_average = sum(scores[:2]) / 2
            previous_average = sum(scores[2:]) / len(scores[2:])
            difference = recent_average - previous_average

            if difference > 5:
                trends[area] = "up"
            elif difference < -5:
                trends[area] = "down"
            else:
                trends[area] = "stable"

    return trends if trends else {"general": "estático"}