from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
import datetime
from server_py.chambista.database import Base


class Professional(Base):
    __tablename__ = "chambista_professionals"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    apellido = Column(String)
    categoria = Column(String, index=True)
    especialidad = Column(String)
    descripcion = Column(String)
    experiencia_anios = Column(Integer)
    precio_base = Column(Float)
    rating = Column(Float, default=0.0)
    cantidad_servicios = Column(Integer, default=0)
    telefono = Column(String)
    correo = Column(String)
    direccion = Column(String)
    distrito = Column(String)
    ciudad = Column(String)
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)
    disponible = Column(Boolean, default=True)
    foto_url = Column(String, nullable=True)
    activo = Column(Boolean, default=True)


class Skill(Base):
    __tablename__ = "chambista_skills"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True)


class ProfessionalSkill(Base):
    __tablename__ = "chambista_professional_skills"

    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("chambista_professionals.id"))
    skill_id = Column(Integer, ForeignKey("chambista_skills.id"))
    nivel = Column(String)  # Básico, Intermedio, Avanzado


class Review(Base):
    __tablename__ = "chambista_reviews"

    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("chambista_professionals.id"))
    cliente = Column(String)
    comentario = Column(String)
    puntuacion = Column(Float)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)


class Availability(Base):
    __tablename__ = "chambista_availability"

    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("chambista_professionals.id"))
    dia = Column(String)  # Lunes, Martes, etc
    hora_inicio = Column(String)  # 08:00
    hora_fin = Column(String)  # 18:00


class JobHistory(Base):
    __tablename__ = "chambista_jobs_history"

    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("chambista_professionals.id"))
    descripcion = Column(String)
    categoria = Column(String)
    resultado = Column(String)  # Exitoso, Cancelado
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    calificacion = Column(Float, nullable=True)
