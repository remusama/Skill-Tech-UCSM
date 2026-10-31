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
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, ".env"), override=False)

# Configuración de la base de datos.
# Se prioriza DATABASE_URL para Supabase o PostgreSQL.
# Si no existe, se utiliza SQLite para el desarrollo local.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    db_file = os.path.join(BASE_DIR, "skill_tech_v2.db")
    DATABASE_URL = f"sqlite:///{db_file}"
    print(f"[DB] Modo desarrollo → SQLite: {db_file}")
else:
    # SQLAlchemy requiere el dialecto explícito postgresql+psycopg2:// cuando se usa psycopg2.
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
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

    # Economía MYL & Solana Token-2022
    solana_wallet_address = Column(String(64), nullable=True, index=True)
    house = Column(String(32), nullable=True, index=True) # APEX, IGNIS, NEXUS, VISIO
    myl_balance_cash = Column(Integer, default=0) # Efectivo en Mano (fichas físicas en MDF / QR)
    myl_balance_digital = Column(Integer, default=0) # Saldo Digital conciliado en cuenta
    myl_house_points_session = Column(Integer, default=0) # Puntos de Casa individuales sesión (tope 3)

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


class PracticalTimelineSnapshot(Base):
    """Representa un snapshot de la línea de tiempo y evaluación práctica del estudiante."""
    __tablename__ = "practical_timeline_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    snapshot_id = Column(String, index=True, nullable=False)
    date = Column(String, nullable=False)
    average = Column(Float, nullable=False)
    scores = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class MylLedgerEntry(Base):
    """Libro Mayor Contable en Enteros Estrictos para transacciones de MYL y Solana."""
    __tablename__ = "myl_ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    house = Column(String(32), nullable=True, index=True)
    amount = Column(Integer, nullable=False) # STRICT 0 decimales
    entry_type = Column(String(64), nullable=False) # 'mint_bono', 'mint_merito', 'burn_material', 'burn_impulso', 'p2p_transfer', 'p2p_fee_burned'
    status = Column(String(32), default="confirmed", index=True) # 'confirmed', 'pending_solana', 'settled_solana'
    solana_tx_signature = Column(String(128), nullable=True)
    description = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class MylMaterial(Base):
    """Catálogo de Insumos a la Carta para la Mesa de Control de Casa (Módulo B)."""
    __tablename__ = "myl_materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    category = Column(String(64), default="basico") # 'basico', 'avanzado', 'especial'
    cost_myl = Column(Integer, nullable=False) # Entero estricto
    stock = Column(Integer, default=50)
    description = Column(String(255), nullable=True)


class MylHouseOrder(Base):
    """Hoja de Pedido Digital / Carrito Grupal de Casa (Módulo B)."""
    __tablename__ = "myl_house_orders"

    id = Column(Integer, primary_key=True, index=True)
    house = Column(String(32), nullable=False, index=True) # 'APEX', 'IGNIS', 'NEXUS', 'VISIO'
    session_number = Column(Integer, default=1, index=True)
    total_cost_myl = Column(Integer, default=0)
    total_collected_myl = Column(Integer, default=0)
    items_json = Column(JSON, default=[]) # [{material_id, name, qty, subtotal}]
    status = Column(String(32), default="draft") # 'draft', 'paid', 'delivered'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)


class MylOrderContribution(Base):
    """Aportes individuales en tiempo real de los 12 miembros de casa para la orden grupal."""
    __tablename__ = "myl_order_contributions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("myl_house_orders.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    amount_myl = Column(Integer, default=0) # Entero
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


class MylStoreItem(Base):
    """Tienda Oficial e Impulsos (Módulo C) con motor de precios dinámicos."""
    __tablename__ = "myl_store_items"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(128), nullable=False)
    item_type = Column(String(32), default="impulso") # 'impulso_fichas', 'impulso_bono', 'impulso_apoyo', 'nft', 'voto'
    target_scope = Column(String(32), default="individual") # 'individual' o 'grupal'
    base_price_myl = Column(Integer, nullable=False)
    current_price_myl = Column(Integer, nullable=False)
    units_sold_session = Column(Integer, default=0)
    high_demand = Column(Integer, default=0) # 1 si supera rotación
    description = Column(String(255), nullable=True)


class MylActiveImpulse(Base):
    """Registro de impulsos activos adquiridos por alumnos o mesas de casa."""
    __tablename__ = "myl_active_impulses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    house = Column(String(32), nullable=True)
    item_code = Column(String(64), nullable=False)
    session_number = Column(Integer, default=1)
    status = Column(String(32), default="active") # 'active', 'consumed', 'settled'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class MylP2POrder(Base):
    """Mercado Secundario P2P entre Alumnos (Módulo D)."""
    __tablename__ = "myl_p2p_orders"

    id = Column(Integer, primary_key=True, index=True)
    seller_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    seller_house = Column(String(32), nullable=False)
    buyer_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    buyer_house = Column(String(32), nullable=True)
    asset_name = Column(String(128), nullable=False)
    price_myl = Column(Integer, nullable=False) # Entero
    burn_fee_myl = Column(Integer, default=0) # Cuota 0, 1 o 2 quemada en Solana
    is_unequal_trade = Column(Integer, default=0) # 1 si difiere > 30% del histórico
    status = Column(String(32), default="open", index=True) # 'open', 'completed', 'cancelled'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class MylMacroeconomicState(Base):
    """Consola del Gestor Pestaña 1: Agregados macroeconómicos y fases."""
    __tablename__ = "myl_macroeconomic_state"

    id = Column(Integer, primary_key=True, index=True)
    edition_total_cap_myl = Column(Integer, default=7000)
    edition_emitted_myl = Column(Integer, default=1840)
    session_number = Column(Integer, default=1)
    session_cap_myl = Column(Integer, default=500)
    session_emitted_myl = Column(Integer, default=384)
    session_burned_myl = Column(Integer, default=312)
    active_phase = Column(String(64), default="Apertura") # 'Apertura', 'Bloque Individual', 'Ventana de Mercado', 'Actividad Grupal', 'Cierre'
    reference_rate_text = Column(String(64), default="1 Punto de Casa = 2 MYL")
    alert_status = Column(String(32), default="green") # 'green', 'yellow', 'red'
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


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