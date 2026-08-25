import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

# Si no hay variable, usamos una DB local distinta de la de Skill-Tech
if not DATABASE_URL:
    # Ruta a chambista.db en el mismo directorio
    db_file = os.path.join(os.path.dirname(__file__), "chambista.db")
    DATABASE_URL = f"sqlite:///{db_file}"
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
engine_kwargs = {"pool_pre_ping": True}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine_kwargs["connect_args"] = connect_args
else:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_chambista_db():
    Base.metadata.create_all(bind=engine)

def get_chambista_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
