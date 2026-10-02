"""Módulo de lógica de negocio y gestión de estado scoped para Eleonor.

Proporciona utilidades para el conteo de tokens, actualización de métricas emocionales
y mapeo de modos conductuales, expresiones faciales y síntesis de voz (SSML).
"""

from typing import Any, Dict
import tiktoken


def count_tokens(text: str, model: str ="gpt-4o-mini")-> int:
    """Cuenta el número de tokens en una cadena de texto según el modelo especificado.

    Args:
        text: Cadena de texto a evaluar.
        model: Identificador del modelo de lenguaje para el codificador tiktoken.

    Returns:
        Número total de tokens estimados o calculados.
    """
    try:
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except Exception:
        # Fallback aproximado: ~4 caracteres por token
        return max(1, len(text) // 4) if text else 0


def clamp(value: float, min_v: float = 0.0, max_v: float = 1.0) -> float:
    """Restringe un valor numérico dentro de un rango determinado."""
    return max(min_v, min(max_v, value))


def update_eleonor_state(analysis: Dict[str, Any], session: Any) -> None:
    """Actualiza el estado dinámico de la sesión en base al análisis devuelto por el LLM.

    Args:
        analysis: Diccionario con los deltas o métricas extraídas de la interacción.
        session: Instancia del modelo de sesión (persistencia en base de datos).
    """
    deltas = analysis.get("impacto_en_estado_de_eleonor", {})
    v_d = deltas.get("valence_delta", analysis.get("v", 0))
    t_d = deltas.get("tension_delta", analysis.get("t", 0))
    e_d = deltas.get("engagement_delta", analysis.get("e", 0))

    if v_d > 0:
        session.valence = "positiva"
    elif v_d < 0:
        session.valence = "negativa"

    # Inicialización de respaldo en caso de valores nulos
    current_tension = getattr(session, "tension", 0.0) or 0.0
    current_engagement = getattr(session, "engagement", 0.0) or 0.0

    session.tension = clamp(current_tension + (t_d * 1.5))
    session.engagement = clamp(current_engagement + (e_d * 1.5))

    # Gestión del límite/frontera de seguridad (Boundary)
    if session.tension > 0.9:
        session.boundary = "hold"
    elif session.tension > 0.75:
        session.boundary = "warning"
    else:
        session.boundary = "none"


def map_expression(session: Any) -> str:
    """Mapea el estado actual de la sesión a una expresión o emoción visible.

    Args:
        session: Objeto de sesión que contiene valence, tension, engagement y boundary.

    Returns:
        Etiqueta de la expresión visual resultante.
    """
    boundary = getattr(session, "boundary", "none")
    if boundary == "hold":
        return "Mentira"

    v = getattr(session, "valence", "neutral")
    t = getattr(session, "tension", 0.0)
    e = getattr(session, "engagement", 0.0)

    if t > 0.8:
        return "Enojo"

    if v == "positiva":
        if e > 0.8:
            return "coqueta"
        if t < 0.4:
            return "Feliz"
        return "Neutro"

    if v == "negativa":
        if t > 0.6:
            return "Enojo"
        if t < 0.4:
            return "Tristeza"
        return "Tristeza2"

    return "Neutro"


def get_behavioral_mode(session: Any, analysis: Dict[str, Any]) -> str:
    """Determina el modo de comportamiento de la respuesta según la tensión y el análisis.

    Args:
        session: Objeto de sesión del usuario.
        analysis: Análisis estructurado emitido por la IA.

    Returns:
        El modo conductual aplicable para la generación de respuesta.
    """
    boundary = getattr(session, "boundary", "none")

    if boundary == "hold":
        return "Baja Interferencia"
    if analysis.get("contradicciones_detectadas") or getattr(session, "tension", 0.0) > 0.65:
        return "Soporte Estructurado"
    if getattr(session, "valence", "") == "negativa" or getattr(session, "tension", 0.0) > 0.4:
        return "Empatía Técnica"

    return "Normal"


def get_ssml_voice_mode(session: Any) -> str:
    """Determina la configuración del modo de voz SSML acorde al estado emocional.

    Args:
        session: Objeto de sesión que contiene la información de estado.

    Returns:
        Nombre de la configuración o perfil de voz SSML.
    """
    v = getattr(session, "valence", "neutral")
    t = getattr(session, "tension", 0.0)
    e = getattr(session, "engagement", 0.0)

    if v == "positiva" and t < 0.4:
        return "calma_acompañante"
    if e > 0.75 and v == "positiva":
        return "energia_contenida"
    if t > 0.7:
        return "directiva_suave"
    if v == "negativa" or t > 0.6:
        return "reflexiva"

    return "neutral_atenta"