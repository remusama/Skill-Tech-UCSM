"""
Script de siembra: CEPV-20
Cuestionario de Expectativas de Programas Vivenciales
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from server_py.memoria.database import SessionLocal, Base, engine  # noqa: E402
from server_py.mentoria.models import MentorExam, MentorExamQuestion  # noqa: E402

DIM_APRENDIZAJE = "aprendizaje_aplicabilidad"
DIM_METODOLOGIA = "metodologia_vivencial"
DIM_FACILITACION = "facilitacion_conduccion"
DIM_INTERACCION = "interaccion_social_networking"

DIMENSION_LABELS = {
    DIM_APRENDIZAJE: "Expectativas de Aprendizaje y Aplicabilidad Práctica (Instrumentalidad)",
    DIM_METODOLOGIA: "Metodología Vivencial, Dinámica e Inmersión",
    DIM_FACILITACION: "Facilitación y Conducción Experta",
    DIM_INTERACCION: "Interacción Social, Cohesión y Networking",
}

LIKERT_ITEMS = [
    (1, DIM_APRENDIZAJE, "Espero adquirir herramientas concretas que pueda implementar de inmediato en mi actividad profesional o personal."),
    (2, DIM_APRENDIZAJE, "Confío en que los contenidos abordados superarán la teoría convencional y se enfocarán en la resolución de problemas reales."),
    (3, DIM_APRENDIZAJE, "Espero que este programa me permita identificar áreas de mejora personal que antes no había reconocido."),
    (4, DIM_APRENDIZAJE, "Considero que el valor de los aprendizajes justificará plenamente el tiempo invertido en participar."),
    (5, DIM_APRENDIZAJE, "Espero desarrollar una comprensión más estratégica y crítica respecto al tema central del programa."),
    (6, DIM_METODOLOGIA, "Espero participar en actividades y ejercicios prácticos desafiantes que estimulen la participación activa."),
    (7, DIM_METODOLOGIA, "Espero que la metodología fomente el aprendizaje a través de la reflexión y la experiencia directa."),
    (8, DIM_METODOLOGIA, "Confío en que el ritmo y la secuencia de las sesiones mantendrán un nivel alto de motivación y energía."),
    (9, DIM_METODOLOGIA, "Espero contar con un ambiente de seguridad psicológica para expresar dudas, errores y puntos de vista."),
    (10, DIM_METODOLOGIA, "Espero que los materiales, dinámicas y recursos utilizados sean innovadores y pertinentes."),
    (11, DIM_FACILITACION, "Espero que los facilitadores demuestren un sólido dominio temático y experiencia de campo demostrada."),
    (12, DIM_FACILITACION, "Confío en que los facilitadores sabrán guiar adecuadamente el debriefing (análisis reflexivo) tras cada actividad."),
    (13, DIM_FACILITACION, "Espero recibir retroalimentación constructiva y personalizada por parte de los líderes del programa."),
    (14, DIM_FACILITACION, "Espero que los facilitadores atiendan de forma ágil y empática las inquietudes individuales del grupo."),
    (15, DIM_FACILITACION, "Confío en que el equipo organizador mantendrá un estricto cumplimiento del programa y de la logística pautada."),
    (16, DIM_INTERACCION, "Espero generar contactos profesionales valiosos y relaciones de colaboración con otros asistentes."),
    (17, DIM_INTERACCION, "Espero que las dinámicas grupales faciliten la confianza rápida y el trabajo en equipo auténtico."),
    (18, DIM_INTERACCION, "Confío en que los demás compañeros estarán comprometidos activamente con las actividades propuestas."),
    (19, DIM_INTERACCION, "Espero intercambiar experiencias y perspectivas diversas que enriquezcan mi propia visión."),
    (20, DIM_INTERACCION, "Espero que se consolide un sentido de comunidad que continúe tras finalizar el evento."),
]

OPEN_QUESTIONS = [
    "Expectativa prioritaria: ¿Cuál es el objetivo o resultado personal número uno que espera alcanzar al término de esta experiencia?",
    "Preocupaciones o barreras anticipadas: ¿Existe algún aspecto técnico, físico o personal que le preocupe de cara al desarrollo del programa?",
    "Criterio de éxito: ¿Qué debería suceder durante el evento para que usted considere que la experiencia fue extraordinaria?",
]

LIKERT_SCALE_OPTIONS = [
    {"value": 1, "label": "Totalmente en desacuerdo (TD)"},
    {"value": 2, "label": "En desacuerdo (D)"},
    {"value": 3, "label": "Neutral (N)"},
    {"value": 4, "label": "De acuerdo (A)"},
    {"value": 5, "label": "Totalmente de acuerdo (TA)"},
]


def seed_cepv20(mentor_id: int | None = None):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(MentorExam).filter(MentorExam.title == "CEPV-20: Expectativas de Programas Vivenciales").first()
        if existing:
            print(f"[seed_cepv20] La plantilla ya existe (id={existing.id}). No se crea de nuevo.")
            return existing
        exam = MentorExam(
            mentor_id=mentor_id,
            agent_id=None,
            title="CEPV-20: Expectativas de Programas Vivenciales",
            description="Cuestionario de Expectativas de Programas Vivenciales (CEPV-20). Adaptación psicométrica del Modelo de Expectativas de Noe & Schmitt (1986) y el Cuestionario de Expectativas de Formación de Martínez-Bocanegra et al. Aplíquese ANTES de iniciar el programa.",
            status="published",
        )
        db.add(exam)
        db.flush()
        order = 0
        for _, dimension, text in LIKERT_ITEMS:
            db.add(MentorExamQuestion(exam_id=exam.id, question=text, question_type="likert_5", options=LIKERT_SCALE_OPTIONS, order=order, dimension=dimension))
            order += 1
        for text in OPEN_QUESTIONS:
            db.add(MentorExamQuestion(exam_id=exam.id, question=text, question_type="text", options=None, order=order, dimension=None))
            order += 1
        db.commit()
        print(f"[seed_cepv20] Plantilla creada con id={exam.id} (23 preguntas: 20 Likert + 3 abiertas).")
        return exam
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_cepv20()
