"""Configuración de base de datos y modelos ORM de la aplicación.

Este módulo configura SQLAlchemy, define las entidades persistentes del
sistema y proporciona las sesiones utilizadas por los endpoints de FastAPI.
"""

import datetime
import os

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


# Rutas base.
MEMORIA_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_PY_DIR = os.path.dirname(MEMORIA_DIR)
BASE_DIR = os.path.dirname(SERVER_PY_DIR)

# Configuración de la base de datos.
# Se prioriza DATABASE_URL para Supabase o PostgreSQL.
# Si no existe, se utiliza SQLite para el desarrollo local.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    db_file = os.path.join(BASE_DIR, "skill_tech_v2.db")
    DATABASE_URL = f"sqlite:///{db_file}"
    print(f"[DB] Modo desarrollo → SQLite: {db_file}")
else:
    # SQLAlchemy requiere el prefijo postgresql://.
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace(
            "postgres://",
            "postgresql://",
            1,
        )
    print("[DB] Modo producción -> Supabase/PostgreSQL [OK]")

connect_args = {}
engine_kwargs = {
    # Comprobar las conexiones antes de utilizarlas.
    "pool_pre_ping": True,
}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine_kwargs["connect_args"] = connect_args
else:
    # Configuración del pool para PostgreSQL y Supabase.
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_recycle"] = 300


engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
Base = declarative_base()

class User(Base):
    """Representa a un usuario de la plataforma."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    has_onboarded = Column(Integer, default=0)

    # Información del perfil.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    full_name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    location = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    specialty = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # Perfil Cognitivo Global
    streak_count = Column(Integer, default=0)
    last_active_at = Column(DateTime, nullable=True)
    global_cognitive_index = Column(Float, default=0.0)
    global_reasoning_vector = Column(JSON, nullable=True)

    # Perfil de orientación vocacional.
    vocational_profile = Column(JSON, nullable=True)

    # Control de acceso
    role = Column(String, default="student")
    school = Column(String, nullable=True)
    classroom = Column(String, nullable=True)
    secure_token = Column(String, unique=True, index=True, nullable=True)

    # Preferencias del usuario.
    preferences = Column(
        JSON,
        default={
            "theme": "dark",
            "email_notifications": True,
            "push_notifications": True,
            "language": "es",
            "data_density": "comfortable",
        },
    )

class UserSkill(Base):
    """Representa el nivel y el diagnóstico de una habilidad del usuario."""
    __tablename__ = "user_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    area = Column(String, index=True)
    level = Column(Float, default=0.0)

    # Parámetros del motor de diagnóstico.
    razonamiento_tipo = Column(String, nullable=True)
    razonamiento_vector = Column(JSON, nullable=True)
    metricas_base = Column(JSON, nullable=True)

    # Datos pedagógicos y del modelo TRI.
    bloom_matrix = Column(JSON, nullable=True)
    score_tri = Column(Float, nullable=True)

    current_diagnosis = Column(JSON, nullable=True)
    analytics_baseline = Column(JSON, nullable=True)
    last_updated = Column(
        DateTime,
        default=datetime.datetime.utcnow,
    )

class ExamResult(Base):
    """Representa el resultado de una evaluación del usuario."""
    __tablename__ = "exam_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    area = Column(String, index=True)
    score = Column(Float)
    data = Column(JSON)
    timestamp = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        index=True,
    )

    # Telemetría y satisfacción del usuario.
    csat_score = Column(Integer, nullable=True)
    rage_clicks = Column(Integer, nullable=True)
    score_tri = Column(Float, nullable=True)


class EleonorHistory(Base):
    """Representa un registro del historial cognitivo de Eleonor."""
    __tablename__ = "eleonor_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    timestamp = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        index=True,
    )
    summary = Column(String)
    signals = Column(JSON)
    confidence = Column(Float)

class ChatMessage(Base):
    """Representa un mensaje enviado o recibido durante una conversación."""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    role = Column(String)
    content = Column(String)
    timestamp = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        index=True,
    )
    session_id = Column(String, default="default", index=True)

class EleonorSession(Base):
    """Representa el estado persistente de una sesión de Eleonor."""
    __tablename__ = "eleonor_sessions"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
    )
    valence = Column(String, default="neutra")
    tension = Column(Float, default=0.5)
    engagement = Column(Float, default=0.5)
    boundary = Column(String, default="none")
    friction_data = Column(
        JSON,
        default={
            "ignored_structure_count": 0,
            "contradiction_count": 0,
            "emotional_volatility": 0.0,
        },
    )
    usage_model = Column(
        JSON,
        default={
            "avg_clarity_score": 0.5,
            "response_density_pref": "medium",
            "structure_adherence": 0.5,
        },
    )
    last_welcome_at = Column(DateTime, nullable=True)
    last_updated = Column(
        DateTime,
        default=datetime.datetime.utcnow,
    )

class LearningJourney(Base):
    """Representa una ruta de aprendizaje personalizada."""
    __tablename__ = "learning_journeys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    area = Column(String)
    objective = Column(String)
    current_session = Column(Integer, default=1)
    total_sessions = Column(Integer, default=5)
    status = Column(String, default="active")
    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
    )
    last_updated = Column(
        DateTime,
        default=datetime.datetime.utcnow,
    )

class JourneySession(Base):
    """Representa una sesión individual dentro de una ruta de aprendizaje."""
    __tablename__ = "journey_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    journey_id = Column(
        Integer,
        ForeignKey("learning_journeys.id"),
        index=True,
    )
    session_number = Column(Integer)
    title = Column(String)
    objective = Column(String)
    type = Column(String)
    content = Column(JSON)
    is_completed = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)

def init_db():
    """Registra los modelos y crea las tablas que aún no existan."""

    # Importa los modelos de mentoría para registrarlos en los metadatos.
    from server_py.mentoria import models as _mentoria_models  # noqa: F401

    Base.metadata.create_all(bind=engine)

def get_db():
    """Proporciona una sesión de base de datos para una dependencia de FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
