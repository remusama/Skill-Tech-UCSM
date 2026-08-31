import json
from .base_agent import BaseAgent
from sqlalchemy.orm import Session
from server_py.memoria.database import User, ExamResult


class GlobalProfileAgent(BaseAgent):
    def __init__(self):
        super().__init__()
        self.model_name = "gpt-4o-mini"
        self.output_schema = """
        {
          "global_cognitive_index": float (0-100),
          "global_reasoning_vector": {
             "analitico": float (0-1),
             "divergente": float (0-1),
             "intuitivo": float (0-1),
             "mecanico": float (0-1),
             "estrategico": float (0-1)
          },
          "habilidades_base_globales": ["string", "string"],
          "debilidades_recurrentes": ["string", "string"],
          "errores_especificos_por_area": {
              "area1": ["string"],
              "area2": ["string"]
          },
          "patron_dominante": "string (resumen del estilo cognitivo global)"
        }
        """

    async def analyze_patterns(self, db: Session, user_id: int):
        """
        Analiza el historial de exámenes para encontrar patrones globales y actualizar el perfil del usuario.
        """
        # Obtener los últimos 10 exámenes para encontrar patrones
        exams = db.query(ExamResult).filter(ExamResult.user_id == user_id).order_by(
            ExamResult.timestamp.desc()).limit(10).all()

        if not exams:
            return None

        history_data = []
        for ex in exams:
            # Parse the JSON string to a dict
            try:
                data_dict = json.loads(ex.data) if isinstance(ex.data, str) else (ex.data or {})
            except Exception:
                data_dict = {}

            # Filter out massive payload fields like 'raw_responses' and 'analytics_pipeline' to save tokens
            filtered_data = {
                "nivel": data_dict.get("nivel"),
                "razonamiento_tipo": data_dict.get("razonamiento_tipo"),
                "puntos_fuertes": data_dict.get("puntos_fuertes"),
                "errores": data_dict.get("errores"),
                "observaciones": data_dict.get("observaciones")
            }

            history_data.append({
                "area": ex.area,
                "score": ex.score,
                "data": filtered_data
            })

        system = f"""
        ERES EL MOTOR DE PATRONES COGNITIVOS GLOBALES.
        Tu objetivo es analizar el historial de evaluaciones de un usuario en múltiples áreas para:
        1. Separar las habilidades o errores que son ESPECÍFICOS de una materia (ej. no saber una fórmula de física).
        2. Identificar las habilidades o debilidades BASE que se repiten transversalmente (ej. mala comprensión lectora, razonamiento estructurado fuerte).
        3. Calcular un índice cognitivo global (0-100) y un vector de razonamiento global basado en la tendencia histórica.

        DEBES RESPONDER EXCLUSIVAMENTE CON UN JSON VÁLIDO QUE CUMPLA ESTE ESQUEMA: {self.output_schema}
        """

        prompt = f"HISTORIAL DE EXÁMENES (MÁS RECIENTE A MÁS ANTIGUO):\n{json.dumps(history_data, indent=2)}"

        analysis = await self._generate(system, prompt)

        if analysis and "error" not in analysis:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.global_cognitive_index = analysis.get("global_cognitive_index", user.global_cognitive_index)
                user.global_reasoning_vector = analysis.get("global_reasoning_vector", user.global_reasoning_vector)

                # Podemos guardar las fortalezas/debilidades en un nuevo campo o en el vector de razonamiento
                if not isinstance(user.global_reasoning_vector, dict):
                    user.global_reasoning_vector = {}

                user.global_reasoning_vector["patrones"] = {
                    "habilidades_base": analysis.get("habilidades_base_globales", []),
                    "debilidades_recurrentes": analysis.get("debilidades_recurrentes", []),
                    "patron_dominante": analysis.get("patron_dominante", "")
                }
                db.commit()

        return analysis
