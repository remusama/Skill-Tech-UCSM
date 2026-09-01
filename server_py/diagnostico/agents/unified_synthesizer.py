import json
from .base_agent import BaseAgent
from server_py.core.structured_logger import get_logger

logger = get_logger("unified_synthesizer")


class UnifiedSynthesizer(BaseAgent):
    def __init__(self):
        super().__init__()
        # Usamos GPT-4o-mini para mantener coherencia y eficiencia
        self.model_name = "gpt-4o-mini"

    async def synthesize(self, latest_diagnosis: dict, skill_snapshot: dict, trends: dict, history: list = [], session_state: dict = None) -> str:
        """
        Generates a master prompt for Eleonor using compressed state, episodic memory, and local emotional state.
        Avoids raw data to optimize tokens and improve UX.
        """

        system_instruction = """
        ERES EL SINTETIZADOR DE DIAGNÓSTICO UNIFICADO (CAPA DE DATOS MAESTRA).
        Tu trabajo es construir la MEMORIA ACTIVA para ELEONOR. Esta memoria ES la base de datos de Eleonor.

        REGLAS DE ORO (FASE 2):
        1. EVIDENCIA TÉCNICA: Identifica errores específicos, temas fallados y el "Nivel de Dominio" (Score) real.
        2. CONDUCTA: Si el diagnóstico reciente incluye 'analytics_pipeline', extrae cómo se comportó el usuario (Z-scores, fricción, velocidad, cluster) y guárdalo.
        3. AUTORIDAD: Habla con la certeza de quien tiene acceso total a los registros históricos.
        4. CAPAS:
           - [REFLEXIÓN_OMNISCIENTE]: El "sentir" analítico de Eleonor (sin mencionar números, incluye impresiones de su conducta).
           - [EVIDENCIA_DIRECTA]: Datos crudos y observaciones técnicas/conductuales precisas.

        ESTRUCTURA DE SALIDA (Obligatoria):

        [REFLEXIÓN_OMNISCIENTE]
        - (Análisis profundo sobre el proceso cognitivo del usuario).
        - (Recomendación de tono emocional).

        [EVIDENCIA_DIRECTA]
        - ÚLTIMO TEST: {area} | Score: {score}/100 | Detalles: {observaciones_y_errores}.
        - MAPA GENERAL: (Resumen de las otras áreas activas del usuario).
        - Use esto para que Eleonor pueda decir: "Veo en la base de datos que..."
        """

        # Formatear historia para el prompt
        history_text = "\n".join([f"- {h.get('summary', '')}" for h in history]
                                 ) if history else "Sin hitos previos registrados."

        prompt = f"""
        [ESTADO EMOCIONAL ACTUAL (LIVE)]:
        {json.dumps(session_state, indent=2) if session_state else "No disponible"}

        [SKILLMAP COMPLETO (BASE DE DATOS)]:
        {json.dumps(skill_snapshot, indent=2)}

        [TENDENCIAS DE RENDIMIENTO]:
        {json.dumps(trends, indent=2)}

        [HISTORIAL EPISÓDICO]:
        {history_text}

        [DETALLES DEL ÚLTIMO DIAGNÓSTICO]:
        {json.dumps(latest_diagnosis, indent=2)}
        """

        # We want text output, not JSON
        return await self._generate(system_instruction, prompt, json_output=False)

    def receive_gemini(self, data: dict) -> dict:
        """
        Parses Gemini signals and returns them as a local dict.
        DEPRECATED global state mutation removed: callers should store this dict
        in DB-backed session or pass it through the adapter layer.
        """
        signals = {
            "transcript": data.get("transcript", ""),
            "intent": data.get("intent", "none"),
            "emotion": data.get("emotion", "neutral"),
            "clarity": data.get("clarity", 1.0),
        }
        logger.info(f"Gemini signals received: intent={signals['intent']} | emotion={signals['emotion']}")
        return signals
