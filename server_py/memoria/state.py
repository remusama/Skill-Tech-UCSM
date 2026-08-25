# Definición del Estado del Agente

eleonor_state = {
    "valence": "neutra", 
    "tension": 0.5,      
    "engagement": 0.5    
}

# Memoria de Fricción y Límites
eleonor_friction = {
    "ignored_structure_count": 0,
    "contradiction_count": 0,
    "emotional_volatility": 0.0
}

eleonor_boundary = "none" # none | warning | hold | close
last_diagnosis = None # Almacena el último JSON de diagnóstico de Gemini Flash

# Señales de Gemini (Capa 1) para uso en Personalidad (Capa 2)
gemini_signals = {
    "transcript": "",
    "intent": "none",
    "emotion": "neutral",
    "clarity": 1.0
}

# Modelo de Uso (Estadístico y Frío)
user_usage_model = {
    "avg_clarity_score": 0.5,
    "response_density_pref": "medium", # short | medium | detailed
    "structure_adherence": 0.5
}

# Historial para Inercia y Promedios (últimos 10 mensajes)
eleonor_history = []
