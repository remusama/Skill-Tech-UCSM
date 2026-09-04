"""Estado global heredado utilizado por los componentes de Eleonor.

Este módulo conserva el estado en memoria utilizado por la implementación
heredada. El adaptador de memoria puede leer y actualizar estos valores
cuando la persistencia en base de datos está desactivada.
"""

# Estado emocional actual de Eleonor.
eleonor_state = {
    "valence": "neutra",
    "tension": 0.5,
    "engagement": 0.5
}


# Memoria de fricción y límites de interacción.
eleonor_friction = {
    "ignored_structure_count": 0,
    "contradiction_count": 0,
    "emotional_volatility": 0.0
}


# Límite actual de la interacción:
# none, warning, hold o close.
eleonor_boundary = "none"


# Último diagnóstico recibido desde Gemini Flash.
last_diagnosis = None


# Señales de Gemini para el módulo de personalidad.
gemini_signals = {
    "transcript": "",
    "intent": "none",
    "emotion": "neutral",
    "clarity": 1.0
}


# Modelo estadístico de uso y preferencias del usuario.
user_usage_model = {
    "avg_clarity_score": 0.5,
    "response_density_pref": "medium",
    "structure_adherence": 0.5
}


# Historial utilizado para calcular inercia y promedios.
eleonor_history = []
