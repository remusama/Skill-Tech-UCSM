import os
from sqlalchemy import create_engine, Column, Integer, String, Float, JSON, DateTime, ForeignKey, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

# Base path for the database
# Get the absolute path to the project root (one level above server_py)
# Base path for the database
# Get the absolute path to the project root (two levels above server_py/memoria)
MEMORIA_DIR = os.path.dirname(os.path.abspath(__file__)) # server_py/memoria
SERVER_PY_DIR = os.path.dirname(MEMORIA_DIR) # server_py
BASE_DIR = os.path.dirname(SERVER_PY_DIR) # project root

# ─────────────────────────────────────────────────────────────────────────────
# Database Configuration
# ─────────────────────────────────────────────────────────────────────────────
# Prioridad: DATABASE_URL (Supabase en producción) → SQLite (desarrollo local)
# En Render: configurar DATABASE_URL en el dashboard como env var
# IMPORTANTE: Supabase usa IPv6 por defecto. Render puede fallar con "Network is unreachable".
# Debes usar la URL del "Connection Pooler" de Supabase (puerto 6543) que soporta IPv4.
# Formato: postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    db_file = os.path.join(BASE_DIR, "skill_tech_v2.db")
    DATABASE_URL = f"sqlite:///{db_file}"
    print(f"[DB] Modo desarrollo → SQLite: {db_file}")
else:
    # Supabase a veces entrega URLs con "postgres://" (sin ql), SQLAlchemy requiere "postgresql://"
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    print(f"[DB] Modo producción → Supabase/PostgreSQL ✅")

connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,  # Valida conexiones antes de usarlas (crítico con Supabase)
}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine_kwargs["connect_args"] = connect_args
else:
    # PostgreSQL / Supabase: configuración de pool para producción
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_recycle"] = 300  # Recicla conexiones cada 5 min

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    has_onboarded = Column(Integer, default=0) # 0 = No, 1 = Yes
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Profile Fields
    full_name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    location = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    specialty = Column(String, nullable=True) # e.g. "Software Dev"
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # Perfil Cognitivo Global
    streak_count = Column(Integer, default=0)
    last_active_at = Column(DateTime, nullable=True)
    global_cognitive_index = Column(Float, default=0.0) # Sustituye al 'xp' para sumar/restar puntos reales
    global_reasoning_vector = Column(JSON, nullable=True) # Perfil consolidado del usuario
    
    # Nodo de Orientación Vocacional (Capa Vocacional)
    # Almacena el último perfil RIASEC + top carrera + timestamp del test
    # {"riasec_vector": {...}, "dominant_code": "RI", "dominant_labels": "...", "top_career": {...}, "last_test_at": "..."}
    vocational_profile = Column(JSON, nullable=True)
    
    # Access Control
    role = Column(String, default="student") # student, teacher, admin
    school = Column(String, nullable=True) # E.g. "Francisco Mostajo"
    classroom = Column(String, nullable=True) # E.g. "5º B"
    
    # Settings / Preferences
    preferences = Column(JSON, default={
        "theme": "dark",
        "email_notifications": True,
        "push_notifications": True,
        "language": "es",
        "data_density": "comfortable"
    })

class UserSkill(Base):
    __tablename__ = "user_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    area = Column(String, index=True) # e.g., "matematicas", "razonamiento"
    level = Column(Float, default=0.0) # 0-100 (Ahora es Float para cálculo preciso)
    
    # Nuevos parámetros del Motor de Diagnóstico (IA)
    razonamiento_tipo = Column(String, nullable=True) # analitico, divergente, etc.
    razonamiento_vector = Column(JSON, nullable=True) # Dimensiones de razonamiento
    metricas_base = Column(JSON, nullable=True) # precision, consistencia, velocidad
    
    # Pedagogía & TRI (Fase 3)
    bloom_matrix = Column(JSON, nullable=True) # Niveles de Bloom
    score_tri = Column(Float, nullable=True) # Habilidad latente estimada (0-100)

    current_diagnosis = Column(JSON, nullable=True) # Store latest detailed diagnosis
    analytics_baseline = Column(JSON, nullable=True) # Store EWMA baseline for Phase 2
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

class ExamResult(Base):
    __tablename__ = "exam_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    area = Column(String, index=True)
    score = Column(Float) # Puede contener decimales ahora
    data = Column(JSON) # Store raw AI diagnosis JSON
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    # Telemetría extendida y CSAT (Fase 3)
    csat_score = Column(Integer, nullable=True) # Puntuación de emojis (1-5)
    rage_clicks = Column(Integer, nullable=True) # Clics erráticos de frustración
    score_tri = Column(Float, nullable=True) # Puntaje TRI de esta prueba

class EleonorHistory(Base):
    __tablename__ = "eleonor_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    summary = Column(String) # "Mejora sostenida en razonamiento estructural..."
    signals = Column(JSON) # ["razonamiento_up", "adaptabilidad_tension"]
    confidence = Column(Float)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    role = Column(String) # "user" or "assistant"
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    session_id = Column(String, default="default", index=True)

class EleonorSession(Base):
    __tablename__ = "eleonor_sessions"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    valence = Column(String, default="neutra")
    tension = Column(Float, default=0.5)
    engagement = Column(Float, default=0.5)
    boundary = Column(String, default="none")
    friction_data = Column(JSON, default={
        "ignored_structure_count": 0,
        "contradiction_count": 0,
        "emotional_volatility": 0.0
    })
    usage_model = Column(JSON, default={
        "avg_clarity_score": 0.5,
        "response_density_pref": "medium",
        "structure_adherence": 0.5
    })
    last_welcome_at = Column(DateTime, nullable=True)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

class LearningJourney(Base):
    __tablename__ = "learning_journeys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    area = Column(String)
    objective = Column(String)
    current_session = Column(Integer, default=1) # 1 to 5
    total_sessions = Column(Integer, default=5)
    status = Column(String, default="active") # active, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

class JourneySession(Base):
    __tablename__ = "journey_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    journey_id = Column(Integer, ForeignKey("learning_journeys.id"), index=True)
    session_number = Column(Integer)
    title = Column(String)
    objective = Column(String)
    type = Column(String)
    content = Column(JSON) # Detailed exercises, explanations, micro-reto
    is_completed = Column(Integer, default=0) # 0 = No, 1 = Yes
    completed_at = Column(DateTime, nullable=True)

def init_db():
    # Import mentoria models to ensure they are registered with metadata before create_all
    from server_py.mentoria import models as _mentoria_models  # noqa: F401
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
