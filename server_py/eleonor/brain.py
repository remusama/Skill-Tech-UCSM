# Definición de Lógica de Negocio y Gestión de Estado Scoped
import tiktoken


def count_tokens(text: str, model="gpt-4o-mini"):
    """Cuenta el número de tokens en una cadena de texto."""
    try:
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except Exception:
        return len(text) // 4  # Fallback aproximado


def clamp(value, min_v=0.0, max_v=1.0):
    return max(min_v, min(max_v, value))


def update_eleonor_state(analysis, session):
    """
    Updates the session object (DB) based on LLM analysis.
    """
    deltas = analysis.get("impacto_en_estado_de_eleonor", {})
    v_d = deltas.get("valence_delta", analysis.get("v", 0))
    t_d = deltas.get("tension_delta", analysis.get("t", 0))
    e_d = deltas.get("engagement_delta", analysis.get("e", 0))

    if v_d > 0:
        session.valence = "positiva"
    elif v_d < 0:
        session.valence = "negativa"

    session.tension = clamp(session.tension + (t_d * 1.5))
    session.engagement = clamp(session.engagement + (e_d * 1.5))

    # Gestión de Boundary
    if session.tension > 0.9:
        session.boundary = "hold"
    elif session.tension > 0.75:
        session.boundary = "warning"
    else:
        session.boundary = "none"


def map_expression(session):
    boundary = session.boundary
    if boundary == "hold":
        return "Mentira"

    v, t, e = session.valence, session.tension, session.engagement

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


def get_behavioral_mode(session, analysis):
    boundary = session.boundary

    if boundary == "hold":
        return "Baja Interferencia"
    if analysis.get("contradicciones_detectadas") or session.tension > 0.65:
        return "Soporte Estructurado"
    if session.valence == "negativa" or session.tension > 0.4:
        return "Empatía Técnica"
    return "Normal"


def get_ssml_voice_mode(session):
    v = session.valence
    t = session.tension
    e = session.engagement

    if v == "positiva" and t < 0.4:
        return "calma_acompañante"
    if e > 0.75 and v == "positiva":
        return "energia_contenida"
    if t > 0.7:
        return "directiva_suave"
    if v == "negativa" or t > 0.6:
        return "reflexiva"

    return "neutral_atenta"
