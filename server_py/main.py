import sys
import os

# Add project root to sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT_DIR)

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from server_py.config import settings  # noqa: E402

# Modular imports
<<<<<<< HEAD
from server_py.chat import router as chat_router  # noqa: E402
from server_py.chat import ws_router as ws_chat_router  # noqa: E402
from server_py.diagnostico import router as diagnosis_router  # noqa: E402
from server_py.diagnostico import journey_router, leadership_router, neo_router  # noqa: E402
from server_py.eleonor import api_client as gemini_router  # noqa: E402
from server_py.auth import router as auth_router  # noqa: E402
from server_py.user import router as user_router  # noqa: E402
from server_py.funciones import tts_router, stt_router  # noqa: E402
from server_py.diagnostico import gamification_router, voice_router  # noqa: E402
from server_py.routers import mentor  # noqa: E402
from server_py.routers import mentor_agents  # noqa: E402
from server_py.routers import mentor_exams  # noqa: E402
from server_py.routers import attendance  # noqa: E402
from server_py.memoria.database import init_db  # noqa: E402
from server_py.scripts.auto_migrate import run_auto_migrations  # noqa: E402

# Initialize Database (Create tables if they do not exist)
init_db()

# Run automatic migrations (safely adds missing columns without dropping data)
run_auto_migrations()

app = FastAPI(title="Eleonor Backend Modular")

# CORS configuration restricted to ALLOWED_ORIGINS
allowed_origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(chat_router.router)
app.include_router(ws_chat_router.router)
app.include_router(diagnosis_router.router)
app.include_router(journey_router.router)
app.include_router(leadership_router.router)
app.include_router(neo_router.router)
app.include_router(gemini_router.router)
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(tts_router.router)
app.include_router(stt_router.router)
app.include_router(gamification_router.router)
app.include_router(voice_router.router)
app.include_router(mentor.router)
app.include_router(mentor_agents.router)
app.include_router(mentor_exams.router)
app.include_router(attendance.router)


# Simple Health check
@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0-modular"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
