import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, Index
from server_py.memoria.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)  # UUID stored as String
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    valence = Column(String, default="neutra")
    tension = Column(Float, default=0.5)
    engagement = Column(Float, default=0.5)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, index=True)  # UUID stored as String
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    role = Column(String)  # user, assistant, system
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


# Index Message(session_id, timestamp)
Index("idx_messages_session_timestamp", Message.session_id, Message.timestamp)


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(String, primary_key=True, index=True)  # UUID stored as String
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    produced_by = Column(String)  # agent id
    summary = Column(String)
    analytics_pipeline = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class MediaRef(Base):
    __tablename__ = "media_refs"

    id = Column(String, primary_key=True, index=True)  # UUID stored as String
    bucket = Column(String)
    path = Column(String)
    content_type = Column(String)
    length = Column(Integer)
    expires_at = Column(DateTime, nullable=True)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)  # UUID stored as String
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    type = Column(String)  # stt, tts, diagnosis, vision
    input_ref_id = Column(String, ForeignKey("media_refs.id"), nullable=True)
    payload = Column(JSON, nullable=True)
    status = Column(String)  # queued, running, succeeded, failed
    attempts = Column(Integer, default=0)
    result_ref = Column(String, nullable=True)  # pointer to Diagnosis ID or MediaRef ID
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)


# Index Job(status, created_at)
Index("idx_jobs_status_created", Job.status, Job.created_at)
