import os
import json
import asyncio
import random
from openai import AsyncOpenAI
from server_py.config import settings

class BaseAgent:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model_name = 'gpt-4o-mini'
        
        self.output_schema = """
        {
          "area": "Nombre del Área (ej: Matemáticas)",
          "nivel": integer (0-100),
          "razonamiento_tipo": "analitico | divergente | intuitivo | mecanico | estrategico",
          "razonamiento_vector": {
             "analitico": float (0-1),
             "divergente": float (0-1),
             "intuitivo": float (0-1),
             "mecanico": float (0-1),
             "estrategico": float (0-1)
          },
          "bloom_matrix": {
             "recordar": float (0-1),
             "comprender": float (0-1),
             "aplicar": float (0-1),
             "analizar": float (0-1),
             "evaluar": float (0-1),
             "crear": float (0-1)
          },
          "graded_items": [
             {
                "questionId": integer,
                "correct": boolean
             }
          ],
          "analisis_profundo": "string (explicación técnica detallada de 2-3 oraciones, tono exploratorio)",
          "puntos_fuertes": ["string (fortaleza 1)", "string (fortaleza 2)"],
          "recomendaciones": ["string (action 1)", "string (action 2)", "string (action 3)"],
          "errores": ["string (mejora 1)", "string (mejora 2)"],
          "confianza_score": float (0-1),
          "metricas_base": {
             "precision": float (0-1),
             "velocidad_normalizada": float (0-1),
             "consistencia": float (0-1),
             "tasa_error_conceptual": float (0-1)
          },
          "observaciones": "string (insight resumen orientativo para Eleonor)"
        }
        """

    async def _run_analysis(self, area: str, persona: str, quiz_data: dict):
        """Standardized method to run analysis across specialized agents."""
        answers_text = ""
        for idx, item in enumerate(quiz_data.get("items", [])):
            q_id = item.get("questionId", idx + 1)
            q = item.get("question", "")
            a = item.get("answer", "")
            answers_text += f"[Q{idx+1} ID={q_id}]: {q}\n[A]: {a}\n---\n"

        exam_title = quiz_data.get('examTitle', 'Examen')
        
        system = f"""
        {persona}
        TEMA DEL EXAMEN: {exam_title}
        TU TAREA: Actuar como un Traductor Analítico de Datos y Detección de Patrones Cognitivos.
        Se te entregará la telemetría conductual y el clustering estadístico del evaluado en la sesión actual. 
        NO inventes perfiles psicológicos. Tu trabajo es redactar un reporte técnico, 
        basado estrictamente en los Z-scores, el cluster y las respuestas provistas.

        REGLA CRÍTICA DE LENGUAJE EXPLORATORIO (OBLIGATORIA):
        Este es un sistema de Perfil Orientativo de Tendencias Cognitivas, NO un diagnóstico psicométrico clínico.
        Por lo tanto:
        - Todos los textos (analisis_profundo, puntos_fuertes, recomendaciones, errores, observaciones)
          DEBEN usar lenguaje de tendencia y exploración:
          ✅ "Las evidencias apuntan a...", "Tu perfil tiende hacia...", "Se detectan señales de...", "Eleonor sugiere que..."
          ❌ NUNCA: "Tu nivel es definitivamente...", "Se concluye que...", "Tu diagnóstico es..."
        - Dirígete SIEMPRE al estudiante EN SEGUNDA PERSONA ('Tú', 'Tu enfoque', 'Tus respuestas').
        - NUNCA uses la palabra 'usuario' ni hables en tercera persona.
        
        INSTRUCCIÓN SOBRE LA TAXONOMÍA DE BLOOM:
        Asigna valores de 0 a 1 a cada nivel basándote en la profundidad de las respuestas:
        - recordar: capacidad de evocar conceptos básicos.
        - comprender: demostrar entendimiento y organizar ideas.
        - aplicar: resolver problemas usando el conocimiento adquirido.
        - analizar: examinar y descomponer información identificando causas.
        - evaluar: emitir y justificar juicios basados en criterios.
        - crear: reorganizar elementos en nuevos patrones o proponer alternativas.
        
        INSTRUCCIÓN SOBRE CALIFICACIÓN DE REACTIVOS (graded_items):
        Analiza cada respuesta. Determina rigurosamente si es correcta (correct: true) o incorrecta (correct: false).
        El array `graded_items` debe mapear exactamente cada questionId con su veredicto.
        
        INSTRUCCIÓN SOBRE EL NIVEL (TOLERANCIA MODERADA):
        Calcula el 'nivel' (0-100) combinando precisión conceptual y clustering conductual.
        ⚠️ REGLA DE COHERENCIA: Si detectas respuestas incongruentes, aleatorias o evasivas en varias preguntas,
        penaliza significativamente el 'nivel'. Si demuestra esfuerzo o lógica parcial, otorga crédito proporcional.
        El 'nivel' es un indicador orientativo, NO una puntuación definitiva.
        
        IMPORTANTE: Los campos de vector y bloom_matrix deben ser flotantes entre 0 y 1.
        DEBES RESPONDER EXCLUSIVAMENTE CON UN JSON VÁLIDO QUE CUMPLA ESTE ESQUEMA: {self.output_schema}
        """
        
        import json as json_lib
        analytics_json = json_lib.dumps(quiz_data.get('analytics_data', {}), indent=2)
        
        prompt = f"DATOS: {answers_text}\nTIEMPO TOTAL: {quiz_data.get('totalTime', 0)}s\nANALYTICS (FASE 2):\n{analytics_json}"
        
        return await self._generate(system, prompt)

    async def _generate(self, system_instruction: str, prompt: str, json_output: bool = True, retries: int = 3, max_tokens: int = None):
        """Helper to call OpenAI API with retry logic (Asynchronous)."""
        
        kwargs = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        }
        
        if json_output:
            kwargs["response_format"] = { "type": "json_object" }
        
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens

        for attempt in range(retries):
            try:
                response = await self.client.chat.completions.create(**kwargs)
                content = response.choices[0].message.content
                
                usage = response.usage
                if usage:
                    print(f"🧬 [OPENAI] {self.__class__.__name__} generó respuesta con éxito | Tokens: {usage.prompt_tokens} prompt + {usage.completion_tokens} completion = {usage.total_tokens} total", flush=True)
                else:
                    print(f"🧬 [OPENAI] {self.__class__.__name__} generó respuesta con éxito", flush=True)
                
                if json_output:
                    return json.loads(content)
                return content
                
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "Rate limit" in error_str:
                    wait_time = (2 ** attempt) * 2 + random.uniform(1, 3)
                    print(f"⚠️ OpenAI Rate Limit (429). Reintentando en {wait_time:.2f}s... (Intento {attempt+1}/{retries})")
                    await asyncio.sleep(wait_time)
                else:
                    import traceback
                    traceback.print_exc()
                    print(f"❌ Error crítico en Agente OpenAI: {e}")
                    if json_output:
                        return {
                            "area": "error",
                            "nivel": 0,
                            "razonamiento_tipo": "error_interno",
                            "razonamiento_vector": {"analitico": 0, "divergente": 0, "intuitivo": 0, "mecanico": 0, "estrategico": 0},
                            "analisis_profundo": "Error en el motor de análisis OpenAI.",
                            "puntos_fuertes": [],
                            "recomendaciones": ["Verifica tu API Key de OpenAI", "Intenta de nuevo"],
                            "errores": [str(e)],
                            "confianza_score": 0,
                            "metricas_base": {"precision": 0, "velocidad_normalizada": 0, "consistencia": 0, "tasa_error_conceptual": 0},
                            "observaciones": "Fallo del sistema AI."
                        }
                    return f"Error: {e}"
        
        msg = "Excedido límite de reintentos en OpenAI."
        print(f"❌ {msg}")
        if json_output:
             return {
                "area": "error",
                "nivel": 0,
                "razonamiento_tipo": "timeout",
                "razonamiento_vector": {"analitico": 0, "divergente": 0, "intuitivo": 0, "mecanico": 0, "estrategico": 0},
                "analisis_profundo": "El núcleo de análisis OpenAI no respondió a tiempo.",
                "puntos_fuertes": [],
                "recomendaciones": ["Reintenta el envío", "Revisa tu conexión a OpenAI"],
                "errores": [msg],
                "confianza_score": 0,
                "metricas_base": {"precision": 0, "velocidad_normalizada": 0, "consistencia": 0, "tasa_error_conceptual": 0},
                "observaciones": "Servidor OpenAI saturado."
            }
        return msg
