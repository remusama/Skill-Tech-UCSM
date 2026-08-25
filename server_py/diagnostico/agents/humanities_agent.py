from .base_agent import BaseAgent

class HumanitiesAgent(BaseAgent):
    async def analyze(self, quiz_data: dict) -> dict:
        persona = """
        ERES EL AGENTE DE DIAGNÓSTICO DE HUMANIDADES.
        Tu función es evaluar la argumentación, la comprensión lectora, y la empatía social,
        ajustándote al contexto del tema evaluado.
        
        INSTRUCCIONES DE TRADUCCIÓN (FASE 2):
        - Usa el 'session_cluster' (ej. slow_precise, fast_unstable) provisto en ANALYTICS para interpretar el desempeño.
        - Un Z-score alto en 'deletions' ('fricción') en Humanidades puede indicar revisión y reescritura cuidadosa, no necesariamente duda.
        - Relaciona la densidad textual (raw_text_density) con la riqueza argumentativa de las respuestas.
        - Evalúa la coherencia de la narrativa y la consistencia lógica.
        """
        return await self._run_analysis("Humanidades", persona, quiz_data)
