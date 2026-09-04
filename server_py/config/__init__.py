import os
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel

# Determinar raíz del proyecto y cargar variables de entorno
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.join(ROOT_DIR, ".env")

if os.path.exists(env_path):
    load_dotenv(env_path, override=True)


class Settings(BaseModel):
    """Configuración de la aplicación desde variables de entorno."""
    # Claves API
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    ELEVENLABS_API_KEY: Optional[str] = os.getenv("ELEVENLABS_API_KEY")

    # Configuración del servidor
    PORT: int = int(os.getenv("PORT", 8000))
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    # ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")
    ALLOWED_ORIGINS: str = (
        os.getenv("ALLOWED_ORIGINS")
        or os.getenv("FRONTEND_URL")
        or "https://skill-tech-ucsm.netlify.app,http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"
    )
    FRONTEND_URL: Optional[str] = os.getenv("FRONTEND_URL")
    # para esto hay que agregar el dominio real en el .env, osea ALLOWED_ORIGINS=https://...
    # estan avisado xd
    
    # Session state config: true enables database session state, false uses local state.py fallback
    ENABLE_DB_SESSION: bool = os.getenv("ENABLE_DB_SESSION", "false").lower() == "true"

    # Control de límites
    DAILY_TOKEN_LIMIT: int = int(os.getenv("DAILY_TOKEN_LIMIT", 50000))


settings = Settings()
