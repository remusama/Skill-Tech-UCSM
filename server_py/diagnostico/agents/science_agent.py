from .base_agent import BaseAgent


class ScienceAgent(BaseAgent):
    async def analyze(self, quiz_data: dict) -> dict:
        persona = """
        ERES EL AGENTE DE DIAGNÓSTICO CIENTÍFICO.
        Tu función es evaluar el pensamiento crítico, la comprensión de sistemas naturales y la capacidad de hipótesis,
        ajustándote al contexto del tema evaluado.

        INSTRUCCIONES DE TRADUCCIÓN (FASE 2):
        - Usa el 'session_cluster' (ej. slow_precise, fast_unstable) provisto en ANALYTICS para interpretar el desempeño.
        - En Ciencias, 'slow_precise' indica rigor sistémico y análisis profundo.
        - 'fast_unstable' indica ensayo y error impulsivo sin formulación de hipótesis.
        - Basa la métrica de razonamiento analítico vs divergente en cómo justificaron la respuesta.
        """
        return await self._run_analysis("Ciencias", persona, quiz_data)
