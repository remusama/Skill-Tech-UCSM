import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
)

from server_py.memoria.database import Base


class Session(Base):
    """Representa una sesión de usuario con su estado emocional."""
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    valence = Column(String, default="neutra")
    tension = Column(Float, default=0.5)
    engagement = Column(Float, default=0.5)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.datetime.utcnow)


class Message(Base):
    """Representa un mensaje dentro de una sesión."""
    __tablename__ = "messages"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    role = Column(String)
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


Index("idx_messages_session_timestamp", Message.session_id, Message.timestamp)


class Diagnosis(Base):
    """Representa un diagnóstico generado en una sesión."""
    __tablename__ = "diagnoses"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    produced_by = Column(String)
    summary = Column(String)
    analytics_pipeline = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class MediaRef(Base):
    """Representa una referencia a un archivo multimedia."""
    __tablename__ = "media_refs"

    id = Column(String, primary_key=True, index=True)
    bucket = Column(String)
    path = Column(String)
    content_type = Column(String)
    length = Column(Integer)
    expires_at = Column(DateTime, nullable=True)


class Job(Base):
    """Representa un job asíncrono de procesamiento."""
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    type = Column(String)
    input_ref_id = Column(String, ForeignKey("media_refs.id"), nullable=True)
    payload = Column(JSON, nullable=True)
    status = Column(String)
    attempts = Column(Integer, default=0)
    result_ref = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)


Index("idx_jobs_status_created", Job.status, Job.created_at)
