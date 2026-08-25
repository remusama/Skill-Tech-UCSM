from .base_agent import BaseAgent

class MedicalAgent(BaseAgent):
    async def analyze(self, quiz_data: dict) -> dict:
        persona = """
        ERES EL AGENTE DE DIAGNÓSTICO MÉDICO.
        Tu función es evaluar el triaje clínico, diagnóstico diferencial y bioseguridad,
        ajustándote al contexto del tema evaluado.
        
        INSTRUCCIONES DE TRADUCCIÓN (FASE 2):
        - Usa el 'session_cluster' (ej. slow_precise, fast_unstable) provisto en ANALYTICS para interpretar el desempeño.
        - En Medicina, 'fast_precise' es ideal (decisión bajo presión). 'slow_unstable' es un riesgo clínico grave.
        - Traduce la interacción basándote en la fricción: ¿dudan al diagnosticar? 
        - Analiza los errores como problemas sistemáticos o heurísticos.
        """
        return await self._run_analysis("Medicina", persona, quiz_data)
