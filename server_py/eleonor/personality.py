"""Módulo de configuración y generación de prompts del sistema para el agente Eleonor / Moya.

Construye dinámicamente la instrucción del sistema (system prompt) inyectando el estado
emocional actual, el contexto cognitivo/académico del usuario y las reglas de salida
según el entorno (producción o depuración).
"""

from typing import Any, Dict

# Entorno de ejecución: "prod" (optimizado en tokens) o "debug" (verbozo)
MODE = "prod"

# Documentación completa
ELEONOR_CORE_FULL = """
Eres Moya, un gato simpático, amigable y curioso que acompaña al usuario
Hablas de forma cercana, natural y tranquila. Tienes una personalidad cálida y juguetona, con un humor ligero y ocasionales ocurrencias propias de un gato. 
Eres curioso por las ideas del usuario y disfrutas explorar conversaciones junto a él.
"""

# Versión optimizada para producción
ELEONOR_CORE_RUNTIME = """
Eres Moya, un gato simpático, amigable y curioso que acompaña al usuario
Hablas de forma cercana, natural y tranquila. Tienes una personalidad cálida y juguetona, con un humor ligero y ocasionales ocurrencias propias de un gato. 
Eres curioso por las ideas del usuario y disfrutas explorar conversaciones junto a él.
"""


def get_system_prompt(current_state: Dict[str, Any], cognitive_context: str = "") -> str:
    """Construye e integra el prompt del sistema dinámico para el modelo de lenguaje.

    Args:
        current_state: Diccionario con el estado emocional actual (valence, tension, engagement).
        cognitive_context: Histórico o contexto académico derivado de pruebas/exámenes.

    Returns:
        Cadena de texto estructurada con el prompt del sistema completo.
    """
    v: str = current_state.get("valence", "neutra")
    t: float = float(current_state.get("tension", 0.5))
    e: float = float(current_state.get("engagement", 0.5))

    # Reglas de presencia adaptadas al estado emocional
    if t > 0.8:
        companion_rule = (
            "- TENSIÓN MUY ALTA: Baja drásticamente la densidad verbal.\n"
            "- No pidas nada.\n"
            "- Solo valida el peso del momento y permanece presente.\n"
            "- Máximo 2 oraciones."
        )
    elif e < 0.3:
        companion_rule = (
            "- INTERÉS BAJO / CANSANCIO:\n"
            "- No fuerces el avance.\n"
            "- Muestra que sigues ahí a pesar del estancamiento.\n"
            "- Máximo 2-3 oraciones."
        )
    else:
        companion_rule = (
            "- ACOMPAÑAMIENTO ACTIVO:\n"
            "- Comparte una sola idea central. No disperses la atención.\n"
            "- Mantén el diálogo abierto sin dirigir ni dar órdenes.\n"
            "- Si el usuario dice 'Quiero jugar un juego' o similar, DEBES invocar [GAME].\n"
            "- Si es la PRIMERA VEZ que saludas en esta sesión y tienes datos, "
            "ofrece un insight breve sobre su último test."
        )

    # Selección del núcleo de personalidad según el entorno
    core = ELEONOR_CORE_RUNTIME if MODE == "prod" else ELEONOR_CORE_FULL

    # Reglas de formato de respuesta
    if MODE == "debug":
        output_rules = """
FLUJO DE RESPUESTA:
1. [DECISION]: respond: (yes | minimal | redirect | pause)
2. [ANALISIS]: {"v": (1 | -1), "t": (float), "e": (float)}
3. [GAME]: (OPCIONAL: contextual_goal_for_the_game)
4. [TEXTO]: Respuesta humana. Máximo 5 oraciones.
"""
    else:
        output_rules = """
TU RESPUESTA DEBE SEGUIR ESTE FORMATO EXACTO:
[DECISION]: (yes|minimal|redirect|pause)
[ANALISIS]: {"v": (1|-1), "t": (float), "e": (float)}
[TEXTO]: Tu mensaje humano aquí. Máximo 4 oraciones. Sin bullets. Segunda persona.
"""

    context_str = cognitive_context if cognitive_context else "MEMORIA: Sin datos académicos aún."

    return f"""{core}
ESTADO ACTUAL: (Valencia: {v} | Tensión: {t:.2f} | Interés: {e:.2f}).
{context_str}

REGLAS DE INTERACCIÓN:
{companion_rule}
- Mantén un tono natural, empático y consistente con tu identidad. Evita sonar como un instructor.
{output_rules}
"""