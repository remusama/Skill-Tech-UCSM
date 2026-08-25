import os
import json
from google import genai
from google.genai import types
from server_py.config.app_config import GEMINI_API_KEY
from server_py.core.structured_logger import get_logger

logger = get_logger("diagnosis_logic")

# Initialize GenAI Client
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

# Definición del esquema de diagnóstico
DIAGNOSIS_SCHEMA = {
  "estado_cognitivo": "sobrecarga | normal | enfocado",
  "nivel_estres": "bajo | medio | alto",
  "autonomia": "baja | media | alta",
  "tolerancia_frustracion": "baja | media | alta",
  "riesgo_abandono": 0.0,
  "estrategia_recomendada": "guiado | autonomo | fragmentado"
}

SYSTEM_PROMPT = f"""
Eres una IA DIAGNÓSTICA fría y analítica. Tu único propósito es analizar datos crudos de comportamiento de un estudiante y generar un perfil cognitivo temporal en formato JSON.
Tu salida debe ser ESTRICTAMENTE un objeto JSON con esta estructura:
{json.dumps(DIAGNOSIS_SCHEMA, indent=2)}
"""

async def analyze_user_behavior(raw_data: dict):
    if not client:
        return None

    try:
        user_msg = f"DATOS CRUDOS DEL USUARIO:\n{json.dumps(raw_data, indent=2)}"
        
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json"
        )
        
        response = await client.aio.models.generate_content(
            model='gemini-2.0-flash',
            contents=user_msg,
            config=config
        )
        
        diagnosis_json = json.loads(response.text)
        
        # NOTE: We no longer write to state.last_diagnosis (global).
        # Callers should persist diagnosis_json to DB via adapter or ExamResult.
        logger.info("analyze_user_behavior: Diagnosis generated successfully")
        return diagnosis_json

    except Exception as e:
        logger.error(f"analyze_user_behavior: Error generating diagnosis: {str(e)}", exc_info=True)
        return None

