import json
from .base_agent import BaseAgent


class GameGenerator(BaseAgent):
    """
    Agente encargado de generar mecánicas de juego dinámicas basadas en el
    perfil del usuario para observar su comportamiento cognitivo.
    """

    def __init__(self):
        super().__init__()
        self.output_schema = """
        {
          "game_id": "string (identificador único)",
          "title": "string",
          "type": "swapped_logic" | "pattern_break" | "moral_friction",
          "rules": {
            "initial": "string (regla inicial)",
            "trigger": "string (qué dispara el cambio)",
            "new_rule": "string (regla tras el cambio)"
          },
          "items": [
            {
              "id": integer,
              "content": "any",
              "correct_action": "string",
              "metadata": {}
            }
          ],
          "config": {
            "max_duration": 45,
            "difficulty": 1-10
          }
        }
        """

    def _get_fallback_game(self):
        """Devuelve un juego predefinido si falla la IA."""
        return {
            "game_id": "fallback_swapped_001",
            "title": "Sincronización de Emergencia",
            "type": "swapped_logic",
            "rules": {
                "initial": "Clica el color de la palabra, ignorando el texto.",
                "trigger": "A mitad de camino, la regla se invierte.",
                "new_rule": "Ahora clica el significado de la palabra, ignorando el color."
            },
            "items": [],  # El frontend genera items dinámicos si está vacío
            "config": {"max_duration": 45, "difficulty": 5}
        }

    async def generate_game(self, user_profile: dict, specific_goal: str = None) -> dict:
        """
        Genera un mini-juego personalizado.
        """
        system = f"""
        ERES EL ARQUITECTO DE INTERVENCIONES META-COGNITIVAS DE ELEONOR.
        Tu objetivo no es entretener, sino crear un entorno breve (máx 45s) donde el usuario sea forzado a:
        1. Seguir una lógica simple.
        2. Adaptarse a un cambio brusco o sutil en las reglas.
        3. Revelar su velocidad de procesamiento y tolerancia a la frustración.

        ESTILO: Minimalista, abstracto, inocente pero psicológicamente revelador.
        SALIDA: JSON estricto siguiendo este esquema: {self.output_schema}
        """

        prompt = f"""
        PERFIL DEL USUARIO: {json.dumps(user_profile)}
        OBJETIVO ESPECÍFICO: {specific_goal or "Medir flexibilidad cognitiva general"}

        Diseña un juego corto. Si el perfil indica que el usuario es muy estructurado, enfócate en 'pattern_break'.
        Si indica que es impulsivo, enfócate en 'swapped_logic'.
        """

        # Reducimos retries a 1 para que el fallback sea casi instantáneo si hay saturación
        result = await self._generate(system, prompt, retries=1)

        # Si el resultado es el dict de error de BaseAgent, usamos el fallback
        if isinstance(result, dict) and (result.get("area") == "error" or "rules" not in result):
            print("⚠️ Usando juego de respaldo (Fallback) debido a error en IA.")
            return self._get_fallback_game()

        return result


# Singleton instance
GAME_GENERATOR = GameGenerator()
