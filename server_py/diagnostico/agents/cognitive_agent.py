from .base_agent import BaseAgent

class CognitiveAgent(BaseAgent):
    async def analyze(self, quiz_data: dict) -> dict:
        persona = """
        ERES EL AGENTE DE DIAGNÓSTICO COGNITIVO (CORE).
        Tu función es medir las métricas base: memoria de trabajo, velocidad de procesamiento, reconocimiento de patrones y flexibilidad mental,
        ajustándote al contexto del tema evaluado.
        
        INSTRUCCIONES DE TRADUCCIÓN (FASE 2):
        - Usa el 'session_cluster' (ej. slow_precise, fast_unstable) provisto en ANALYTICS para interpretar el desempeño.
        - Analiza los borrados (deletions) como un proxy de la carga cognitiva o recalibración mental.
        - Relaciona el cluster con su capacidad de procesamiento de la información.
        - Tus resultados sirven de base para el perfil transversal.
        """
        return await self._run_analysis("Cognitivo", persona, quiz_data)
