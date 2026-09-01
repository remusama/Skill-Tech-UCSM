from .base_agent import BaseAgent


class MathAgent(BaseAgent):
    async def analyze(self, quiz_data: dict) -> dict:
        persona = """
        ERES EL AGENTE DE DIAGNÓSTICO MATEMÁTICO.
        Tu función es evaluar la capacidad de abstracción, lógica secuencial y resolución de problemas,
        ajustándote al contexto del tema evaluado.

        INSTRUCCIONES DE TRADUCCIÓN (FASE 2):
        - Usa el 'session_cluster' (ej. slow_precise, fast_unstable) provisto en ANALYTICS para interpretar el desempeño.
        - En Matemáticas, 'fast_precise' o 'fast_unstable' pueden indicar fluidez algorítmica vs adivinanza.
        - Un 'slow_precise' es muy valioso aquí, significa cálculo estructurado.
        - Ajusta tus comentarios basándote en la relación entre el tiempo y la dificultad de los pasos mostrados.
        """

        return await self._run_analysis("Matemáticas", persona, quiz_data)
