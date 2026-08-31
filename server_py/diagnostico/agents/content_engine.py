import json
from .base_agent import BaseAgent


class InterpreteAgent(BaseAgent):
    """
    Agente Interprete: Analiza el diagnóstico y diseña la estructura de la ruta.
    """

    def __init__(self):
        super().__init__()
        self.output_schema = """
        {
          "objetivo_general": "string",
          "habilidad_concreta": "string",
          "sesiones": [
            {
              "numero": 1,
              "titulo": "string",
              "objetivo_especifico": "string",
              "tipo_trabajo": "string",
              "nivel_dificultad": "string",
              "criterio_adaptacion": "string"
            }
          ],
          "resultado_esperado": "string"
        }
        """

    async def disenar_ruta(self, skills_diagnostico: dict, area: str, detailed_diagnosis: dict = None) -> dict:
        system = """
        ERES EL AGENTE INTERPRETE DE SKILLTECH.
        Analizas el mapa de habilidades y el DIAGNÓSTICO DETALLADO del usuario para diseñar una ruta de 5 sesiones de ALTO IMPACTO.
        REGLAS CRÍTICAS DE ESTRUCTURA:
        1. DIVERSIDAD OBLIGATORIA: Cada sesión DEBE tener un propósito distinto. Ejemplo:
           - Sesión 1: Nivelación y Conceptos Base.
           - Sesión 2: Aplicación Práctica Intermedia.
           - Sesión 3: Resolución de Errores Comunes (basado en diagnóstico).
           - Sesión 4: Profundización Avanzada.
           - Sesión 5: Integración y Micro-reto Final.
        2. FLUJO PEDAGÓGICO: Diseña sesiones que no sean solo "lectura". Prioriza la aplicación de conocimientos.
        3. USA EL DIAGNÓSTICO JSON: Si el diagnóstico menciona "errores en X", las sesiones deben atacar X directamente. No ignores el razonamiento de la IA previa.
        4. ADAPTACIÓN: Nivel <40 = "Principiante", Nivel >70 = "Avanzado".
        5. Idioma: Español. Salida: JSON estricto.
        """

        prompt = f"""
        ÁREA OBJETIVO: {area}
        MAPA DE NIVELES: {json.dumps(skills_diagnostico)}
        DIAGNÓSTICO DETALLADO: {json.dumps(detailed_diagnosis) if detailed_diagnosis else "No disponible"}

        DISEÑA LA ESTRUCTURA DE 5 SESIONES DINÁMICAS.
        Asegúrate de que cada sesión tenga un 'objetivo_especifico' que resuelva un problema detectado en el diagnóstico.
        ESQUEMA: {self.output_schema}
        """

        # Override BaseAgent's _generate to change logging style
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ]

        response = await self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.3
        )

        content = response.choices[0].message.content
        if response.usage:
            u = response.usage
            print(
                f"TOKENS SKILLTECH - Interprete: Prompt: {u.prompt_tokens} | Completion: {u.completion_tokens} | Total: {u.total_tokens}", flush=True)

        return json.loads(content)


class ArquitectoAgent(BaseAgent):
    """
    Agente Arquitecto: Construye el contenido exacto basado en la ruta del Interprete.
    """

    def __init__(self):
        super().__init__()
        self.output_schema = """
        {
          "sesion_numero": integer,
          "ejercicios": [
            {
              "id": "string",
              "tipo": "practica_guiada" | "ejercicio_basico" | "micro_reto",
              "enunciado": "string",
              "explicacion_breve": "string",
              "pasos": ["string"],
              "opciones": ["string"],
              "respuesta_correcta": "string"
            }
          ]
        }
        """

    async def construir_sesion(self, plan_sesion: dict, contexto_ruta: str) -> dict:
        system = """
        ERES EL AGENTE ARQUITECTO DE SKILLTECH.
        Construyes el contenido exacto basado estrictamente en la estructura del Agente Interprete.

        REGLAS DE ORO PARA LA GENERACIÓN (IA ARQUITECTA):
        1. SIEMPRE PLANTEA UNA SITUACIÓN: El `enunciado` NO puede ser una pregunta teórica fría (ej: "¿Qué es X?"). Debe ser SIEMPRE un escenario, caso de uso o situación narrativa (ej: "Estás en una reunión y el cliente te pide X, pero notas que Y...").
        2. ANÁLISIS DE REACCIÓN OBLIGATORIO: El campo `explicacion_breve` es CRÍTICO. Debe contener un "Análisis de Reacción" (feedback) sobre por qué la respuesta es correcta o qué implica el error cometido. NUNCA lo dejes vacío.
        3. ESTABILIZACIÓN EN 3 FORMATOS:
           - FORMATO 1: EXPLICATIVO / PRÁCTICA GUIADA (`tipo: "practica_guiada"`). Propósito: Enseñar el "cómo". DEBE tener `pasos` (mínimo 3) detallando la acción. NO lleva `opciones`.
           - FORMATO 2: PRÁCTICA DE ELECCIÓN (`tipo: "ejercicio_basico"`). Propósito: Validar criterio. DEBE tener `opciones` (exactamente 3) y una `respuesta_correcta`. NO lleva `pasos`.
           - FORMATO 3: MICRO RETO / ACCIÓN (`tipo: "micro_reto"`). Propósito: Aplicación crítica. Puede ser de elección o requerir una acción que el usuario debe validar. DEBE tener `opciones` claras.
        4. NO TARDES EN IR AL GRANO: Las explicaciones deben ser cortas y potentes.
        5. COHERENCIA TÉCNICA: La `respuesta_correcta` debe coincidir exactamente con una de las `opciones`.
        6. Idioma: Español. Salida: JSON estricto.
        """

        prompt = f"""
        PLAN DE SESIÓN (INTERPRETE): {json.dumps(plan_sesion)}
        CONTEXTO DE LA RUTA: {contexto_ruta}

        GENERA EL CONTENIDO DE LA SESIÓN SIGUIENDO ESTE ESQUEMA: {self.output_schema}
        """

        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ]

        response = await self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.4
        )

        content = response.choices[0].message.content
        if response.usage:
            u = response.usage
            print(
                f"TOKENS SKILLTECH - Arquitecto: Prompt: {u.prompt_tokens} | Completion: {u.completion_tokens} | Total: {u.total_tokens}", flush=True)

        return json.loads(content)


INTERPRETE = InterpreteAgent()
ARQUITECTO = ArquitectoAgent()
