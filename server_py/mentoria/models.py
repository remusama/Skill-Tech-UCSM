"""Modelos ORM de SQLAlchemy para el módulo de Mentoría, Exámenes, Asistencia y Agentes.
"""
from datetime import datetime, timezone
from typing import Any, List, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, relationship

from server_py.memoria.database import Base

def _utc_now() -> datetime:
    """Genera la fecha y hora UTC actual consciente de la zona horaria."""
    return datetime.now(timezone.utc)

# ============================================================================
# MÓDULO: GRUPOS DE MENTORÍA
# ============================================================================

class MentorGroup(Base):
    """Representa un grupo de estudiantes administrado por un mentor."""
    __tablename__ = "mentor_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=_utc_now)
    
    # Relaciones
    students = relationship("GroupStudent", back_populates="group")
    mentor = relationship("User", foreign_keys=[mentor_id])


class GroupStudent(Base):
    """Tabla de asociación entre grupos de mentoría y estudiantes."""
    __tablename__ = "mentor_group_students"
    
    group_id = Column(Integer, ForeignKey("mentor_groups.id"), primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"), primary_key=True)

    # Relaciones
    group = relationship("MentorGroup", back_populates="students")
    student = relationship("User", foreign_keys=[student_id])

# ============================================================================
# MÓDULO: AGENTES E IA
# ============================================================================

class Agent(Base):
    """Representa una configuración o plantilla de Agente IA."""
    __tablename__ = "agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    system_prompt = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_template = Column(Boolean, default=False)
    competencies = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=_utc_now)

    # Relaciones
    creator = relationship("User", foreign_keys=[creator_id])

# ============================================================================
# MÓDULO: EXÁMENES Y EVALUACIONES DE MENTORÍA
# ============================================================================

class MentorExam(Base):
    """Evaluación o examen diseñado por un mentor apoyado por un agente."""
    __tablename__ = "mentor_exams"
    
    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"))
    agent_id = Column(Integer, ForeignKey("agents.id"))
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=_utc_now)

    # Relaciones
    mentor = relationship("User", foreign_keys=[mentor_id])
    agent = relationship("Agent")
    questions = relationship("MentorExamQuestion", back_populates="exam")
    assignments = relationship("MentorExamAssignment", back_populates="exam")

class MentorExamQuestion(Base):
    """Pregunta individual perteneciente a un examen de mentoría."""
    __tablename__ = "mentor_exam_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("mentor_exams.id"))
    question = Column(Text)
    question_type = Column(String)
    options = Column(JSON, nullable=True)
    order = Column(Integer, default=0)
    correct_answer = Column(String, nullable=True)
    dimension = Column(String, nullable=True)

    # Relaciones
    exam = relationship("MentorExam", back_populates="questions")
    answers = relationship("MentorExamAnswer", back_populates="question")

class MentorExamAssignment(Base):
    """Asignación de un examen a un estudiante individual o a un grupo."""
    __tablename__ = "mentor_exam_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("mentor_exams.id"))
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("mentor_groups.id"), nullable=True)
    assigned_at = Column(DateTime, default=_utc_now)
    status = Column(String, default="pending")
    demographics = Column(JSON, nullable=True)

    # Relaciones
    exam = relationship("MentorExam", back_populates="assignments")
    student = relationship("User", foreign_keys=[student_id])
    group = relationship("MentorGroup", foreign_keys=[group_id])
    answers = relationship("MentorExamAnswer", back_populates="assignment")


class MentorExamAnswer(Base):
    """Respuesta registrada de un estudiante para una pregunta específica."""
    __tablename__ = "mentor_exam_answers"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("mentor_exam_assignments.id"))
    question_id = Column(Integer, ForeignKey("mentor_exam_questions.id"))
    value_numeric = Column(Integer, nullable=True)
    value_text = Column(Text, nullable=True)
    answered_at = Column(DateTime, default=_utc_now)

    # Relaciones
    assignment = relationship("MentorExamAssignment", back_populates="answers")
    question = relationship("MentorExamQuestion", back_populates="answers")

# ============================================================================
# MÓDULO: CONTROL DE ASISTENCIA
# ============================================================================

class AttendanceClass(Base):
    """Sesión o clase creada para el registro de asistencia."""
    __tablename__ = "attendance_classes"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"))
    group_id = Column(Integer, ForeignKey("mentor_groups.id"), nullable=True)
    name = Column(String)
    code = Column(String, unique=True, index=True)
    date = Column(String)
    start_time = Column(String)
    late_time = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utc_now)

    # Relaciones
    mentor = relationship("User", foreign_keys=[mentor_id])
    group = relationship("MentorGroup")
    records = relationship("AttendanceRecord", back_populates="attendance_class")


class AttendanceRecord(Base):
    """Registro individual de asistencia de un estudiante a una clase."""
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("attendance_classes.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="falta")
    registered_at = Column(DateTime, nullable=True)
    scan_type = Column(String, nullable=True)

    # Relaciones
    attendance_class = relationship("AttendanceClass", back_populates="records")
    student = relationship("User", foreign_keys=[student_id])