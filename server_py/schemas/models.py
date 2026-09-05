from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any
from datetime import datetime
from uuid import UUID

class PydanticConfig:
    """Configuración estándar para todos los schemas Pydantic."""
    from_attributes = True


class UserSummary(BaseModel):
    """Schema para resumen de usuario en sesiones."""
    id: int
    email: str
    display_name: Optional[str] = None

    model_config = {"from_attributes": True}


class SessionSchema(BaseModel):
    """Schema para sesión de usuario con estado emocional."""
    id: UUID
    user_id: int
    valence: Literal["positiva", "negativa", "neutra"]
    tension: float = Field(..., ge=0.0, le=1.0, description="Tensión [0-1]")
    engagement: float = Field(..., ge=0.0, le=1.0, description="Engagement [0-1]")
    created_at: datetime
    last_active_at: datetime

    model_config = {"from_attributes": True}


class MessageSchema(BaseModel):
    """Schema para mensaje en una sesión."""
    id: UUID
    session_id: UUID
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime

    model_config = {"from_attributes": True}


class DiagnosisSchema(BaseModel):
    """Schema para resultado de diagnóstico."""
    id: UUID
    session_id: UUID
    produced_by: str
    summary: str
    analytics_pipeline: Dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class MediaRefSchema(BaseModel):
    """Schema para referencia a archivo multimedia (audio, video, imagen)."""
    id: UUID
    bucket: str
    path: str
    content_type: str
    length: int
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class JobSchema(BaseModel):
    """Schema para job asincrónico (STT, TTS, Diagnosis, Vision)."""
    id: UUID
    user_id: int
    type: Literal["stt", "tts", "diagnosis", "vision"]
    input_ref: Optional[MediaRefSchema] = None
    payload: Optional[Dict[str, Any]] = None
    status: Literal["queued", "running", "succeeded", "failed"]
    attempts: int = 0
    result_ref: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
