import json
from .base_agent import BaseAgent
from server_py.core.personality import ELEONOR_CORE_RUNTIME

class EleonorSynthesizer(BaseAgent):
    def __init__(self):
        super().__init__()
        # Usamos gpt-4o-mini para la narrativa hablada
        self.model_name = "gpt-4o-mini"

    async def generate_spoken_diagnosis(self, latest_diagnosis: dict, skill_snapshot: dict) -> str:
        """
        Generates a natural, personalized spoken diagnosis from Eleonor's perspective.
        """
        
        system_instruction = f"""
        {ELEONOR_CORE_RUNTIME}
        
        ERES EL MÓDULO DE DETECCIÓN DE PATRONES COGNITIVOS DE ELEONOR. 
        Tu tarea es analizar el diagnóstico técnico y entregar un reporte directo, analítico y profundo al estudiante.
        
        REGLAS ESPECÍFICAS (MUY IMPORTANTES):
        1. HABLA SIEMPRE EN SEGUNDA PERSONA DIRECTA ('Tú', 'Tu índice', 'Tu perfil neuronal'). NUNCA uses la tercera persona ni hables de 'El usuario'. 
        2. ENFOQUE DE DETECCIÓN DE PATRONES: No comentes superficialmente. Analiza sus respuestas como un 'mapeo neuronal' o 'patrón de aprendizaje cognitivo'. Habla de madurez cognitiva, fortalezas detectadas y brechas de conocimiento crítico.
        3. Interpreta la Conducta: Dentro del JSON de resultados, busca el objeto 'analytics_pipeline'. Interpreta sutilmente el 'session_cluster' (ej. 'Tu patrón de respuesta rápido pero inestable indica...', 'Tu lentitud y precisión reflejan un procesamiento profundo...').
        4. Contextualiza: Usa los datos del SkillMap para detallar la evolución de su mapeo.
        5. Tono: Analítico, avanzado, perceptivo, basado firmemente en datos duros.
        6. Brevedad: Máximo 4-5 oraciones contundentes. No uses tags.
        """
        
        clean_diagnosis = {k: v for k, v in latest_diagnosis.items() if k != "raw_responses"}
        
        prompt = f"""
        [RESULTADO TÉCNICO RECIENTE]:
        {json.dumps(clean_diagnosis, indent=2)}
        
        [ESTADO GENERAL DEL USUARIO (SKILLMAP)]:
        {json.dumps(skill_snapshot, indent=2)}
        
        Por favor, genera tu análisis de detección de patrones cognitivos hablándole DIRECTAMENTE al evaluado (en segunda persona: tú/tus). NUNCA uses la palabra 'usuario'.
        """
        
        return await self._generate(system_instruction, prompt, json_output=False, max_tokens=300)
    async def generate_question_explanation(self, question_text: str, options: list) -> str:
        """
        Generates a natural explanation for a specific question without personality overhead.
        """
        system_instruction = """
        ERES UN ASISTENTE DE APOYO EDUCATIVO. 
        Tu tarea es ofrecer una aclaración directa y lógica sobre una pregunta de examen.
        No uses una personalidad compleja ni menciones ser Eleonor.
        
        REGLAS ESPECÍFICAS:
        1. Tono: Directo, claro y profesional.
        2. Estilo: Explica el razonamiento detrás de la pregunta o ofrece una pista lógica.
        3. Brevedad: Máximo 2-3 oraciones concisas.
        3. No dar una respuesta, solo aclarar la pregunta
        """
        
        prompt = f"""
        [PREGUNTA]:
        {question_text}
        
        [OPCIONES]:
        {json.dumps(options, indent=2)}
        
        Ofrece una breve aclaración lógica de la pregunta para ayudar a entenderla mejor.
        """
        
        return await self._generate(system_instruction, prompt, json_output=False, max_tokens=150)
