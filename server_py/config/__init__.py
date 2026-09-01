import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional

# Get the absolute path to the project root (one level above server_py)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.join(ROOT_DIR, ".env")

# Single point of load_dotenv in the backend
if os.path.exists(env_path):
    load_dotenv(env_path, override=True)


class Settings(BaseModel):
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    ELEVENLABS_API_KEY: Optional[str] = os.getenv("ELEVENLABS_API_KEY")

    PORT: int = int(os.getenv("PORT", 8000))
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")
    # ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000") # <- testeo
    # para esto hay que agregar el dominio real en el .env, osea ALLOWED_ORIGINS=https://...
    # estan avisado xd

    # Session state config: true enables database session state, false uses local state.py fallback
    ENABLE_DB_SESSION: bool = os.getenv("ENABLE_DB_SESSION", "false").lower() == "true"

    # LLM cost control: max tokens per user per day (default 50k)
    DAILY_TOKEN_LIMIT: int = int(os.getenv("DAILY_TOKEN_LIMIT", 50000))


settings = Settings()
