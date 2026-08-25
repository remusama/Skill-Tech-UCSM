import json
from .base_agent import BaseAgent

class Condenser(BaseAgent):
    def __init__(self):
        super().__init__()
        self.model_name = "gpt-3.5-turbo"

    async def condense_history(self, history: list) -> str:
        """
        Toma una lista de interacciones y genera un resumen técnico compacto (hitos).
        """
        if not history:
            return "Sin historial previo."

        system_instruction = """
        ERES EL CONDENSADOR DE MEMORIA DE SKILL-TECH.
        Tu misión es reducir el historial de chat a una lista de HITOS COGNITIVOS.
        
        REGLAS:
        1. Sé extremadamente breve.
        2. Identifica: Temas dominados, Errores recurrentes, Tono emocional predominante.
        3. Formato: Una sola cadena de texto técnica.
        """
        
        prompt = f"Condensa este historial eliminando paja y manteniendo datos duros:\n{json.dumps(history)}"
        
        return await self._generate(system_instruction, prompt, json_output=False)

    async def filter_data(self, data: dict) -> dict:
        """
        Filtra un JSON de diagnóstico para mantener solo lo relevante.
        """
        if data is None:
            return {}
            
        relevant_keys = ["area", "nivel", "analisis_profundo", "puntos_fuertes", "errores"]
        filtered = {k: data[k] for k in relevant_keys if k in data}
        return filtered
