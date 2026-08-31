import time
import os
from sqlalchemy.orm import Session
from server_py.memoria.database import User, UserSkill
import openai
from sqlalchemy import func

# Configuración de OpenAI (asumiendo que ya está configurada en el proyecto)
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ANALYSIS_CACHE = {}
CACHE_TTL = 300  # 5 minutes


def get_stats_data(db: Session, classroom: str = None, school: str = None):
    """
    Utility function to aggregate global student statistics.
    If classroom or school is provided, filter students accordingly.
    """
    query = db.query(User.id).filter(User.role == "student")
    if school:
        query = query.filter(User.school == school)
    if classroom:
        query = query.filter(User.classroom == classroom)

    student_ids = [s[0] for s in query.all()]

    global_bloom = {"recordar": 0, "comprender": 0, "aplicar": 0, "analizar": 0, "evaluar": 0, "crear": 0}
    global_vector = {"analitico": 0, "divergente": 0, "intuitivo": 0, "mecanico": 0, "estrategico": 0}
    bloom_count = 0
    vector_count = 0

    if student_ids:
        avg_skills = db.query(UserSkill.area, func.avg(UserSkill.level).label("average")).filter(
            UserSkill.user_id.in_(student_ids)).group_by(UserSkill.area).all()
        total_students = len(student_ids)

        all_skills = db.query(UserSkill).filter(UserSkill.user_id.in_(student_ids)).all()
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

        if bloom_count > 0:
            for k in global_bloom:
                global_bloom[k] = round(global_bloom[k] / bloom_count, 2)
        if vector_count > 0:
            for k in global_vector:
                global_vector[k] = round(global_vector[k] / vector_count, 2)
    else:
        avg_skills = []
        total_students = 0

    return {
        "averages": {area: round(float(avg), 1) for area, avg in avg_skills},
        "total_students": total_students,
        "system_health": "stable",  # Placeholder
        "global_bloom": global_bloom if bloom_count > 0 else None,
        "global_vector": global_vector if vector_count > 0 else None
    }


def get_student_quantum_data(db: Session, student_id: int):
    """
    Retrieves and humanizes student data for the teacher dashboard.
    Translates raw metrics (valence, tension, etc.) into teacher-friendly terms.
    """
    from server_py.memoria.database import EleonorSession, UserSkill, ExamResult

    # Get the Eleonor session for raw metrics
    session = db.query(EleonorSession).filter(EleonorSession.user_id == student_id).first()
    # Get current skills
    skills = db.query(UserSkill).filter(UserSkill.user_id == student_id).all()
    # Get recent exam results - Increased to 50 for more comprehensive multi-line charts
    exams = db.query(ExamResult).filter(ExamResult.user_id == student_id).order_by(
        ExamResult.timestamp.desc()).limit(50).all()

    # 1. Energy & Learning Level (from Recent Performance Trends)
    recent_scores = [e.score for e in exams]
    avg_score = sum(recent_scores) / len(recent_scores) if recent_scores else 50

    # Energy level based on consistency and recent engagement if available
    energy_val = (session.engagement if session else 0.5) * 100
    learning_energy = "Estable"
    if energy_val > 80:
        learning_energy = "Elevada"
    elif energy_val < 40:
        learning_energy = "Baja / Requiere Estímulo"

    # 2. Academic Risk (grounded in actual performance)
    risk_level = "Bajo"
    if avg_score < 45:
        risk_level = "Alto"
    elif avg_score < 70:
        risk_level = "Medio"

    # 3. Actionable Recommendation
    # Determine the weak area
    weak_skill = min(skills, key=lambda x: x.level) if skills else None
    recommendation = "Continuar con el flujo actual de aprendizaje."
    if weak_skill and weak_skill.level < 40:
        recommendation = f"Reforzar el área de {weak_skill.area} con ejercicios prácticos de nivel inicial."
    elif risk_level == "Alto":
        recommendation = "Se sugiere una tutoría individual para revisar conceptos base."

    # 4. History Categorization
    import unicodedata

    def normalize_area(a: str):
        return unicodedata.normalize('NFD', a.lower()).encode('ascii', 'ignore').decode('utf-8')

    academic_areas = ["ciencia", "ciencias", "matematicas", "matematica",
                      "humanidades", "ingenieria", "medicina", "logica", "comprension lectora"]
    # Everything else is personal or as per courseData

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

        normalized_db_area = normalize_area(e.area)

        if normalized_db_area in academic_areas:
            academic_history.append(item)
        else:
            personal_history.append(item)

    return {
        "learning_energy": learning_energy,
        "energy_percentage": round(energy_val),
        "academic_risk": risk_level,
        "recommendation": recommendation,
        "topography": {sk.area: sk.level for sk in skills},
        "performance_avg": round(avg_score),
        "total_exams": len(exams),
        "last_exam_date": exams[0].timestamp.strftime("%Y-%m-%d") if exams else "N/A",
        "top_skill": max(skills, key=lambda x: x.level).area if skills else "N/A",
        "history": {
            "academic": academic_history[::-1],  # Oldest first for chart
            "personal": personal_history[::-1]
        }
    }


async def generate_group_analysis(db: Session, classroom: str = None, school: str = None):
    """
    Genera un análisis narrativo del grupo basado en las estadísticas globales.
    """
    cache_key = f"{school}_{classroom}"
    now = time.time()

    # Check cache first
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
        response = client.chat.completions.create(
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
    except Exception as e:
        print(f"Error generating AI analysis: {e}")
        return "El sistema de análisis de Eleonor está procesando nuevos datos. En breve tendré listo el reporte detallado para tu grupo."
