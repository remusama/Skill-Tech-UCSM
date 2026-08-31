"""
rubrica_base.py
---------------
Rúbricas orientativas para los 5 módulos de evaluación personal de Eleonor.
Traducen el 'nivel' numérico (0-100) generado por el LLM en un Rango de Madurez
honesto con su incertidumbre inherente.

IMPORTANTE: Este sistema NO es un instrumento psicométrico validado clínicamente.
Es un perfil orientativo probabilístico basado en LLMs. Los rangos son estimaciones,
no diagnósticos definitivos. Ver IRT en irt.py para la capa matemática escalable.
"""

from typing import TypedDict


class NivelMadurez(TypedDict):
    etiqueta: str          # Ej: "Competente"
    rango_min: int         # Ej: 60
    rango_max: int         # Ej: 79
    descripcion_breve: str  # Para el frontend


# ──────────────────────────────────────────────────────────────────────────────
# ESCALA UNIVERSAL DE MADUREZ (aplica a todos los módulos personales)
# ──────────────────────────────────────────────────────────────────────────────
ESCALA_MADUREZ: list[NivelMadurez] = [
    {
        "etiqueta": "Inicial",
        "rango_min": 0,
        "rango_max": 39,
        "descripcion_breve": "Las evidencias apuntan a un punto de partida donde las bases aún están en construcción."
    },
    {
        "etiqueta": "En Desarrollo",
        "rango_min": 40,
        "rango_max": 59,
        "descripcion_breve": "Eleonor sugiere que hay comprensión emergente, aunque aún con áreas clave sin consolidar."
    },
    {
        "etiqueta": "Competente",
        "rango_min": 60,
        "rango_max": 79,
        "descripcion_breve": "Las tendencias observadas apuntan a un manejo sólido y funcional de la habilidad."
    },
    {
        "etiqueta": "Experto",
        "rango_min": 80,
        "rango_max": 100,
        "descripcion_breve": "Las evidencias sugieren dominio profundo, con capacidad de transferencia y síntesis."
    }
]

# ──────────────────────────────────────────────────────────────────────────────
# RÚBRICAS POR MÓDULO — Criterios orientativos para el JudgeAgent
# Cada módulo define sus dimensiones y los criterios LLM que guían el análisis.
# Inspirados directamente en rubricas_eleonor.jsx
# ──────────────────────────────────────────────────────────────────────────────

RUBRICAS_PERSONALES = {
    "razonamiento": {
        "descripcion_modulo": "Evalúa la capacidad de razonamiento lógico, abstracción de patrones y operación bajo incertidumbre.",
        "dimensiones": [
            {
                "nombre": "Identificación de premisas",
                "skill": "razonamiento-deductivo",
                "criterios_llm": "Evalúa si: (1) el evaluado distingue premisas de conclusiones, (2) identifica premisas implícitas, (3) reconoce jerarquía argumentativa, (4) detecta ambigüedades en los enunciados."
            },
            {
                "nombre": "Abstracción de patrones",
                "skill": "abstraccion-inductiva",
                "criterios_llm": "Evalúa si: (1) detecta regularidades más allá de secuencias simples, (2) generaliza con conciencia de sus límites, (3) discrimina ruido de señal, (4) formula hipótesis con parsimonia."
            },
            {
                "nombre": "Tolerancia a la ambigüedad",
                "skill": "tolerancia-ambiguedad",
                "criterios_llm": "Evalúa si: (1) opera bajo incertidumbre sin paralizarse, (2) formula hipótesis de trabajo explícitas, (3) aplica marcos de decisión estructurados, (4) cuantifica la incertidumbre en su razonamiento."
            }
        ],
        "nota_incertidumbre": "El razonamiento lógico es difícil de medir solo con texto. Eleonor sugiere tendencias, no diagnósticos."
    },
    "aprendizaje": {
        "descripcion_modulo": "Evalúa metacognición, diversidad estratégica y capacidad de transferencia del conocimiento adquirido.",
        "dimensiones": [
            {
                "nombre": "Conciencia metacognitiva",
                "skill": "metacognicion",
                "criterios_llm": "Evalúa si: (1) identifica sus propias brechas de conocimiento, (2) monitorea su comprensión durante la tarea, (3) planifica estratégicamente según su perfil, (4) muestra calibración entre confianza y precisión real."
            },
            {
                "nombre": "Diversidad y profundidad estratégica",
                "skill": "estrategias-cognitivas",
                "criterios_llm": "Evalúa si: (1) usa más de una estrategia de aprendizaje, (2) selecciona estrategias según el tipo de material, (3) elabora y conecta conceptos en lugar de memorizarlos, (4) transfiere conocimiento a contextos nuevos."
            },
            {
                "nombre": "Transferencia interdisciplinar",
                "skill": "transferencia-aprendizaje",
                "criterios_llm": "Evalúa si: (1) aplica conocimiento en contextos distintos al original, (2) identifica la estructura profunda de los problemas más allá de su superficie, (3) establece conexiones entre dominios distintos, (4) construye marcos unificadores."
            }
        ],
        "nota_incertidumbre": "La metacognición es especialmente difícil de evaluar con respuestas de texto. Las tendencias observadas son orientativas."
    },
    "criterio": {
        "descripcion_modulo": "Evalúa el razonamiento ético, el análisis crítico de fuentes y la calidad del proceso decisional.",
        "dimensiones": [
            {
                "nombre": "Juicio ético",
                "skill": "juicio-etico",
                "criterios_llm": "Evalúa si: (1) identifica las partes afectadas y sus intereses, (2) menciona al menos 2 marcos éticos en tensión, (3) justifica su posición con argumentos y no preferencias personales, (4) reconoce la legitimidad de posiciones contrarias."
            },
            {
                "nombre": "Análisis crítico",
                "skill": "autocritica-cognitiva",
                "criterios_llm": "Evalúa si: (1) cuestiona la fuente o validez de la afirmación, (2) distingue hecho de opinión, (3) identifica al menos un sesgo potencial (confirmación, disponibilidad, autoridad), (4) propone criterios de verificación."
            },
            {
                "nombre": "Criterio decisional",
                "skill": "decision-estructurada",
                "criterios_llm": "Evalúa si: (1) define el problema antes de buscar soluciones, (2) considera al menos 3 alternativas, (3) evalúa consecuencias de segundo orden, (4) es coherente con criterios declarados anteriormente en sus respuestas."
            }
        ],
        "nota_incertidumbre": "El juicio ético es profundamente contextual. Eleonor observa tendencias argumentativas, no valores absolutos."
    },
    "adaptabilidad": {
        "descripcion_modulo": "Evalúa la flexibilidad cognitiva, la gestión emocional ante el cambio y la capacidad de rediseño estratégico.",
        "dimensiones": [
            {
                "nombre": "Flexibilidad cognitiva",
                "skill": "flexibilidad-cognitiva",
                "criterios_llm": "Evalúa si: (1) busca activamente perspectivas contrarias a la propia, (2) actualiza modelos mentales ante evidencia moderada, (3) mantiene simultáneamente perspectivas contradictorias, (4) no insiste en su posición inicial ante evidencia contraria."
            },
            {
                "nombre": "Gestión emocional ante el cambio",
                "skill": "respuesta-cambio",
                "criterios_llm": "Evalúa si: (1) reconoce la emoción asociada al cambio, (2) no confunde reacción emocional con evaluación racional, (3) identifica oportunidades en el nuevo escenario, (4) propone acciones concretas de adaptación."
            },
            {
                "nombre": "Replanteo estratégico",
                "skill": "adaptacion-estrategica",
                "criterios_llm": "Evalúa si: (1) modifica la estrategia completa cuando las condiciones lo requieren, (2) no solo ajusta tácticas sino el marco general, (3) diseña salidas alternativas (pivots) desde el inicio, (4) distingue qué conservar de un plan invalidado."
            }
        ],
        "nota_incertidumbre": "La adaptabilidad real se mide en acción, no solo en texto. Las respuestas pueden reflejar conocimiento declarativo, no conductual."
    },
    "autonomia": {
        "descripcion_modulo": "Evalúa la autogestión del aprendizaje, la iniciativa operativa y la claridad de valores e identidad personal.",
        "dimensiones": [
            {
                "nombre": "Autogestión e iniciativa de aprendizaje",
                "skill": "autogestion-aprendizaje",
                "criterios_llm": "Evalúa si: (1) define objetivos de aprendizaje propios y no impuestos, (2) identifica recursos y estrategias por iniciativa propia, (3) establece criterios de éxito medibles, (4) prevé cómo evaluará su propio progreso."
            },
            {
                "nombre": "Iniciativa operativa y proactividad",
                "skill": "iniciativa-accion",
                "criterios_llm": "Evalúa si: (1) propone acciones concretas sin que se le soliciten, (2) asume responsabilidad del resultado, (3) no transfiere la carga de decisión a terceros, (4) persiste ante los primeros obstáculos."
            },
            {
                "nombre": "Claridad de valores y consistencia identitaria",
                "skill": "autodireccion-identidad",
                "criterios_llm": "Evalúa si: (1) hace referencia a valores propios y no solo socialmente impuestos, (2) sus elecciones son coherentes entre sí a lo largo del examen, (3) puede justificar sus prioridades con argumentos personales, (4) no se contradice con posiciones anteriores en la sesión."
            }
        ],
        "nota_incertidumbre": "Los valores y la identidad son construcciones complejas. Eleonor detecta patrones de coherencia, no la 'verdad' del sujeto."
    }
}

# ──────────────────────────────────────────────────────────────────────────────
# FUNCIONES DE UTILIDAD
# ──────────────────────────────────────────────────────────────────────────────


def get_nivel_madurez(nivel_numerico: int) -> dict:
    """
    Convierte un nivel numérico (0-100) en una etiqueta de madurez
    con su rango estimado, siendo honesto sobre la incertidumbre.
    """
    for escala in ESCALA_MADUREZ:
        if escala["rango_min"] <= nivel_numerico <= escala["rango_max"]:
            return {
                "etiqueta": escala["etiqueta"],
                "rango_estimado": f"{escala['rango_min']}–{escala['rango_max']}",
                "descripcion_orientativa": escala["descripcion_breve"],
                "nota_incertidumbre": "Este rango es una estimación orientativa basada en LLMs, no un diagnóstico psicométrico validado."
            }
    # Fallback
    return {
        "etiqueta": "No determinado",
        "rango_estimado": "0–100",
        "descripcion_orientativa": "No se pudo clasificar la tendencia con los datos disponibles.",
        "nota_incertidumbre": "Datos insuficientes para la clasificación."
    }


def get_rubrica_para_area(area: str) -> dict | None:
    """
    Devuelve la rúbrica completa para un área de evaluación personal.
    Retorna None si el área no tiene rúbrica definida (ej. académicas).
    """
    return RUBRICAS_PERSONALES.get(area.lower().replace("ó", "o").replace("í", "i"))


def get_criterios_llm_para_area(area: str) -> str:
    """
    Retorna un texto consolidado de todos los criterios LLM de un área
    para inyectar en el prompt del SpecialistAgent o JudgeAgent.
    """
    rubrica = get_rubrica_para_area(area)
    if not rubrica:
        return ""

    criterios = []
    for dim in rubrica.get("dimensiones", []):
        criterios.append(f"• [{dim['nombre']}]: {dim['criterios_llm']}")

    return "\n".join(criterios)
