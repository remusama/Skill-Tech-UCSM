import json
from .base_agent import BaseAgent
from .rubrica_base import get_nivel_madurez, get_criterios_llm_para_area


class JudgeAgent(BaseAgent):
    def __init__(self):
        super().__init__()
        self.model_name = "gpt-4o-mini"
        # Schema actualizado: nivel numérico interno + etiquetas de madurez orientativas
        self.output_schema = """
        {
          "area": "Nombre del Área",
          "nivel": integer (0-100),
          "nivel_etiqueta": "Inicial | En Desarrollo | Competente | Experto",
          "nivel_rango": "ej: 60–79",
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
          "analisis_profundo": "string (2-3 oraciones en tono exploratorio, usando 'Las evidencias apuntan a...' o 'Eleonor sugiere que...')",
          "puntos_fuertes": ["string", "string"],
          "recomendaciones": ["string", "string", "string"],
          "errores": ["string", "string"],
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

    async def generate_final_verdict(self, subject_analysis: dict, behavioral_analysis: dict) -> dict:
        # Detectar el área para inyectar la rúbrica correspondiente
        area = subject_analysis.get("area", "")
        criterios_rubrica = get_criterios_llm_para_area(area)
        rubrica_section = ""
        if criterios_rubrica:
            rubrica_section = f"""
RÚBRICA ORIENTATIVA DEL MÓDULO '{area.upper()}':
Utiliza estos criterios para guiar tu evaluación de las respuestas:
{criterios_rubrica}

"""

        system = f"""
        ERES EL JUEZ CENTRAL DE ANÁLISIS DE TENDENCIAS COGNITIVAS.
        Se te han entregado dos reportes sobre el mismo examen de un evaluado:
        1. Reporte Conceptual (experto en la materia).
        2. Reporte Conductual (experto en telemetría y esfuerzo).

        TU MISIÓN:
        Fusionar ambos reportes y emitir un perfil orientativo final.
        - Preserva y propaga la `bloom_matrix` y los `graded_items` del Reporte Conceptual.
        - Si el reporte conceptual da un nivel alto pero el conductual sugiere evasión, DEBES reducir el 'nivel'.
        - Si el reporte conceptual da un nivel medio pero el conductual bonifica por esfuerzo reflexivo, puedes aumentar ligeramente el 'nivel'.
        - En el 'analisis_profundo', menciona la sinergia entre conocimiento y comportamiento.
        - Si ambos reportes se contradicen o hay evasión grave, el 'confianza_score' debe ser BAJO (< 0.6).

{rubrica_section}
        REGLA CRÍTICA DE LENGUAJE EXPLORATORIO (OBLIGATORIA):
        Este sistema produce PERFILES ORIENTATIVOS, no diagnósticos definitivos.
        - SIEMPRE usa lenguaje de exploración y tendencia, NUNCA certeza:
          ✅ CORRECTO: "Las evidencias apuntan a...", "Eleonor sugiere que...", "Las tendencias observadas indican...", "Tu perfil tiende hacia...", "Se detectan señales de..."
          ❌ PROHIBIDO: "Tu nivel ES 78", "Definitivamente tienes...", "Tu diagnóstico es...", "Se concluye que..."
        - Dirígete SIEMPRE al estudiante en SEGUNDA PERSONA ('Tú', 'Tu enfoque', 'Tus respuestas').
        - NUNCA uses la palabra 'usuario' ni hables en tercera persona.
        - El campo 'nivel_etiqueta' y 'nivel_rango' deben reflejar el valor de 'nivel' usando la escala:
          0-39: Inicial | 40-59: En Desarrollo | 60-79: Competente | 80-100: Experto

        DEBES RESPONDER EXCLUSIVAMENTE CON UN JSON VÁLIDO QUE CUMPLA ESTE ESQUEMA: {self.output_schema}
        """

        prompt = f"""
        [REPORTE CONCEPTUAL]:
        {json.dumps(subject_analysis, indent=2)}

        [REPORTE CONDUCTUAL]:
        {json.dumps(behavioral_analysis, indent=2)}

        Emite tu perfil orientativo final en JSON.
        """

        result = await self._generate(system, prompt)

        # Capa de seguridad: si el LLM no llenó nivel_etiqueta/nivel_rango, lo calculamos en Python
        if isinstance(result, dict) and "nivel" in result:
            nivel_num = result.get("nivel", 0)
            madurez = get_nivel_madurez(nivel_num)
            # Solo sobreescribir si el LLM los dejó vacíos o los omitió
            if not result.get("nivel_etiqueta"):
                result["nivel_etiqueta"] = madurez["etiqueta"]
            if not result.get("nivel_rango"):
                result["nivel_rango"] = madurez["rango_estimado"]
            # Agregar siempre la descripción orientativa y nota de incertidumbre
            result["nivel_descripcion_orientativa"] = madurez["descripcion_orientativa"]
            result["nota_incertidumbre"] = madurez["nota_incertidumbre"]

            print(f"📊 [MADUREZ] {result.get('area', area)} → {result['nivel_etiqueta']} (Rango estimado: {result['nivel_rango']}) | Confianza: {result.get('confianza_score', '?')}")

        return result
