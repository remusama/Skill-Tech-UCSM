"""Módulo de análisis y agregación de métricas educativas para Eleonor AI (Skill-Tech).
Proporciona estadísticas globales y perfiles individuales para docentes.
"""

import logging
import os
import time
import unicodedata
from typing import Any, Dict, List, Optional, Tuple

import openai
from sqlalchemy import func
from sqlalchemy.orm import Session

from server_py.memoria.database import (
    EleonorSession,
    ExamResult,
    User,
    UserSkill,
)

# Configuración de Logging
logger = logging.getLogger(__name__)

# Configuración del Cliente OpenAI (Versión Asíncrona)
async_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Cache simple en memoria para análisis grupales
ANALYSIS_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL: int = 300

ACADEMIC_AREAS: set[str] = {
    "ciencia",
    "ciencias",
    "matematicas",
    "matematica",
    "humanidades",
    "ingenieria",
    "medicina",
    "logica",
    "comprension lectora",
}


def _normalize_text(text: str) -> str:
    """Normaliza texto removiendo acentos y convirtiéndolo a minúsculas."""
    return unicodedata.normalize("NFD", text.lower()).encode("ascii", "ignore").decode("utf-8")


def get_stats_data(
    db: Session, classroom: Optional[str] = None, school: Optional[str] = None
) -> Dict[str, Any]:
    """Agrega las estadísticas globales de los estudiantes.
    Soporta filtrado por escuela y/o aula.
    """
    query = db.query(User.id).filter(User.role == "student")
    if school:
        query = query.filter(User.school == school)
    if classroom:
        query = query.filter(User.classroom == classroom)

    student_ids = [s[0] for s in query.all()]

    student_ids: List[int] = [user_id for (user_id,) in query.all()]

    global_bloom = {
        "recordar": 0.0,
        "comprender": 0.0,
        "aplicar": 0.0,
        "analizar": 0.0,
        "evaluar": 0.0,
        "crear": 0.0,
    }
    global_vector = {
        "analitico": 0.0,
        "divergente": 0.0,
        "intuitivo": 0.0,
        "mecanico": 0.0,
        "estrategico": 0.0,
    }

    if not student_ids:
        return {
            "averages": {},
            "total_students": 0,
            "system_health": "stable",
            "global_bloom": None,
            "global_vector": None,
        }

    # Obtener promedios generales por área
    avg_skills = (
        db.query(UserSkill.area, func.avg(UserSkill.level).label("average"))
        .filter(UserSkill.user_id.in_(student_ids))
        .group_by(UserSkill.area)
        .all()
    )

    # Cargar habilidades para matrices específicas
    all_skills = db.query(UserSkill).filter(UserSkill.user_id.in_(student_ids)).all()
    bloom_count = 0
    vector_count = 0

    for sk in all_skills:
        if sk.bloom_matrix and isinstance(sk.bloom_matrix, dict):
            bloom_count += 1
            for k, v in sk.bloom_matrix.items():
                if k in global_bloom and v is not None:
                    global_bloom[k] += float(v)

        if sk.razonamiento_vector and isinstance(sk.razonamiento_vector, dict):
            vector_count += 1
            for k, v in sk.razonamiento_vector.items():
                if k in global_vector and v is not None:
                    global_vector[k] += float(v)

    # Promediar matrices
    if bloom_count > 0:
        global_bloom = {k: round(v / bloom_count, 2) for k, v in global_bloom.items()}
    if vector_count > 0:
        global_vector = {k: round(v / vector_count, 2) for k, v in global_vector.items()}

    return {
        "averages": {area: round(float(avg), 1) for area, avg in avg_skills},
        "total_students": total_students,
        "system_health": "stable",  # Placeholder
        "global_bloom": global_bloom if bloom_count > 0 else None,
        "global_vector": global_vector if vector_count > 0 else None
    }


def get_student_quantum_data(db: Session, student_id: int):
    """
    Recupera y traduce las métricas cuantitativas de un estudiante en 
    indicadores pedagógicos para el panel del docente.
    """
    session = db.query(EleonorSession).filter(EleonorSession.user_id == student_id).first()
    skills = db.query(UserSkill).filter(UserSkill.user_id == student_id).all()
    exams = (
        db.query(ExamResult)
        .filter(ExamResult.user_id == student_id)
        .order_by(ExamResult.timestamp.desc())
        .limit(50)
        .all()
    )

    # 1. Energía y Nivel de Aprendizaje
    recent_scores = [e.score for e in exams]
    avg_score = sum(recent_scores) / len(recent_scores) if recent_scores else 50.0

    energy_val = (session.engagement if session else 0.5) * 100
    if energy_val > 80:
        learning_energy = "Elevada"
    elif energy_val < 40:
        learning_energy = "Baja / Requiere Estímulo"
    else:
        learning_energy = "Estable"

    # 2. Riesgo Académico
    if avg_score < 45:
        risk_level = "Alto"
    elif avg_score < 70:
        risk_level = "Medio"
    else:
        risk_level = "Bajo"

    # 3. Recomendación Pedagógica
    weak_skill = min(skills, key=lambda x: x.level) if skills else None
    if weak_skill and weak_skill.level < 40:
        recommendation = f"Reforzar el área de {weak_skill.area} con ejercicios prácticos de nivel inicial."
    elif risk_level == "Alto":
        recommendation = "Se sugiere una tutoría individual para revisar conceptos base."
    else:
        recommendation = "Continuar con el flujo actual de aprendizaje."

    academic_history = []
    personal_history = []

    for e in exams:
        item = {
            "id": e.id,
            "score": e.score,
            "area": e.area,
            "date": e.timestamp.strftime("%Y-%m-%d %H:%M"),
            "data": e.data
        }

        if _normalize_text(e.area) in ACADEMIC_AREAS:
            academic_history.append(item)
        else:
            personal_history.append(item)

    top_skill_name = max(skills, key=lambda x: x.level).area if skills else "N/A"
    last_exam_date = exams[0].timestamp.strftime("%Y-%m-%d") if exams else "N/A"

    return {
        "learning_energy": learning_energy,
        "energy_percentage": round(energy_val),
        "academic_risk": risk_level,
        "recommendation": recommendation,
        "topography": {sk.area: sk.level for sk in skills},
        "performance_avg": round(avg_score),
        "total_exams": len(exams),
        "last_exam_date": last_exam_date,
        "top_skill": top_skill_name,
        "history": {
            "academic": academic_history[::-1],
            "personal": personal_history[::-1]
        }
    }


async def generate_group_analysis(
    db: Session, classroom: Optional[str] = None, school: Optional[str] = None
) -> str:
    """Genera o recupera del caché un análisis narrativo ejecutivo del grupo
    utilizando el modelo de lenguaje de OpenAI.
    """
    cache_key = f"{school}_{classroom}"
    now = time.time()

    # Verificar caché
    if cache_key in ANALYSIS_CACHE:
        cached_data = ANALYSIS_CACHE[cache_key]
        if now - cached_data["timestamp"] < CACHE_TTL:
            return cached_data["text"]

    stats = get_stats_data(db, classroom, school)

    # Obtener tendencias recientes (opcional, por ahora usaremos los promedios)
    prompt = f"""
    Actúa como Eleonor, una IA analista educativa de Skill-Tech.
    Tu objetivo es proporcionar un informe ejecutivo y motivador para un docente sobre el estado de su grupo.

    Estadísticas actuales:
    - Estudiantes totales: {stats['total_students']}
    - Promedios por área: {stats['averages']}
    - Salud del sistema: {stats['system_health']}

    Genera un párrafo (máximo 60 palabras) que:
    1. Identifique la mayor fortaleza del grupo.
    2. Señale un área de oportunidad o tendencia preocupante.
    3. Dé un consejo pedagógico accionable.

    Mantén un tono profesional, empático y ligeramente futurista. Responde en español.
    """

    try:
        response = await async_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres Eleonor, la analista de Skill-Tech."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.7
        )
        analysis_text = response.choices[0].message.content.strip()
        # Save to cache
        ANALYSIS_CACHE[cache_key] = {"timestamp": now, "text": analysis_text}
        return analysis_text

    except Exception as error:
        logger.error("Error al generar análisis de IA con OpenAI: %s", error)
        return (
            "El sistema de análisis de Eleonor está procesando nuevos datos. "
            "En breve tendré listo el reporte detallado para tu grupo."
        )