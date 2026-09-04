"""Adaptador preparado para gestionar una caché semántica con Redis.

Actualmente, la caché se encuentra desactivada por compatibilidad. La clase
mantiene la interfaz necesaria para consultar y actualizar una futura caché
de habilidades basada en Redis.
"""

import os
from typing import Any


class RedisSkillCache:
    """Gestiona las operaciones de caché semántica para habilidades.

    La implementación de Redis está desactivada actualmente. Mientras
    self.llm_cache sea None, las operaciones de consulta y actualización
    no realizan ninguna acción.
    """
    def __init__(self) -> None:
        self.redis_url = os.getenv(
            "REDIS_URL",
            "redis://localhost:6379",
        )
        try:
            self.llm_cache = None
            print(
                "[REDIS] Cache semántico desactivado "
                "(Compatibility Fix)."
            )
        except Exception as error:
            print(f"[REDIS] Error inicializando cache: {error}")
            self.llm_cache = None

    def check(self, prompt: str) -> Any | None:
        """Busca una respuesta almacenada para el prompt recibido."""
        if not self.llm_cache:
            return None

        results = self.llm_cache.check(prompt=prompt)
        if results:
            print(
                f"[REDIS CACHE] Hit semántico para: {prompt[:50]}..."
            )
            return results[0]
        return None

    def update(self, prompt: str, response: str) -> None:
        """Actualiza la caché con un prompt y su respuesta asociada."""
        if not self.llm_cache:
            return

        try:
            self.llm_cache.update(
                prompt=prompt,
                response=response,
            )
            print("[REDIS CACHE] Cache actualizado.")
        except Exception as error:
            print(f"[REDIS] Error actualizando cache: {error}")


# Instancia global para reutilizar la caché en el backend.
skill_cache = RedisSkillCache()