import json
from .base_agent import BaseAgent

class BehavioralAgent(BaseAgent):
    def __init__(self):
        super().__init__()
        self.model_name = "gpt-4o-mini"
        self.output_schema = """
        {
          "analisis_friccion": "string (explicación del esfuerzo y tiempo invertido)",
          "integridad_prueba": "string (evaluación de si el evaluado intentó genuinamente resolver la prueba o evadió/hizo random clics)",
          "penalizacion_sugerida": float (0-1, ej. 0.5 si hubo trampas o evasivas evidentes, 0 si todo fue normal),
          "bonificacion_sugerida": float (0-1, ej. 0.1 si demostró un esfuerzo sobresaliente en fricción),
          "notas_para_juez": "string (resumen directo para el juez)"
        }
        """

    async def analyze_behavior(self, quiz_data: dict) -> dict:
        system = f"""
        ERES EL EXPERTO EN TELEMETRÍA Y CONDUCTA COGNITIVA.
        Tu trabajo es analizar EXCLUSIVAMENTE los datos de comportamiento (tiempos, fricción, clustering) de una sesión de evaluación.
        NO evalúas si la respuesta es conceptualmente correcta o incorrecta; evalúas la INTEGRIDAD y el ESFUERZO del evaluado.
        
        REGLAS:
        1. Analiza el 'session_cluster' y los 'z_scores'.
        2. Si notas respuestas extremadamente rápidas ('fast_unstable') o nula fricción, sugiere una penalización.
        3. Si notas alta fricción y tiempo ('slow_precise' o 'struggling'), sugiere que hubo esfuerzo real.
        
        DEBES RESPONDER EXCLUSIVAMENTE CON UN JSON VÁLIDO QUE CUMPLA ESTE ESQUEMA: {self.output_schema}
        """
        
        analytics_json = json.dumps(quiz_data.get('analytics_data', {}), indent=2)
        
        prompt = f"TIEMPO TOTAL: {quiz_data.get('totalTime', 0)}s\nANALYTICS (FASE 2):\n{analytics_json}"
        
        return await self._generate(system, prompt)
