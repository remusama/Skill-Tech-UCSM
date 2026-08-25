import os
from redisvl.extensions.llmcache import SemanticCache
from redis import Redis

class RedisSkillCache:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        try:
            # Inicializamos el caché semántico con un umbral de similitud de 0.9
            # self.llm_cache = SemanticCache(
            #     name="skilltech_cache",
            #     prefix="llm_cache",
            #     redis_url=self.redis_url,
            #     distance_threshold=0.1 # Menor distancia = mayor similitud requerida
            # )
            self.llm_cache = None
            print("[REDIS] Cache semántico desactivado (Compatibility Fix).")
        except Exception as e:
            print(f"[REDIS] Error inicializando cache: {e}")
            self.llm_cache = None

    def check(self, prompt: str):
        if not self.llm_cache:
            return None
        
        results = self.llm_cache.check(prompt=prompt)
        if results:
            print(f"[REDIS CACHE] Hit semántico para: {prompt[:50]}...")
            return results[0]
        return None

    def update(self, prompt: str, response: str):
        if not self.llm_cache:
            return
        
        try:
            self.llm_cache.update(prompt=prompt, response=response)
            print(f"[REDIS CACHE] Cache actualizado.")
        except Exception as e:
            print(f"[REDIS] Error actualizando cache: {e}")

# Instancia global
skill_cache = RedisSkillCache()
