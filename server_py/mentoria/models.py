from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
import datetime
from server_py.memoria.database import Base

class MentorGroup(Base):
    __tablename__ = "mentor_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    students = relationship("GroupStudent", back_populates="group")
    mentor = relationship("User", foreign_keys=[mentor_id])

class GroupStudent(Base):
    __tablename__ = "mentor_group_students"
    
    group_id = Column(Integer, ForeignKey("mentor_groups.id"), primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    
    group = relationship("MentorGroup", back_populates="students")
    student = relationship("User", foreign_keys=[student_id])

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    system_prompt = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True) # null for system templates
    is_template = Column(Boolean, default=False)
    competencies = Column(JSON, nullable=True) # List of competencies (e.g. ["Liderazgo", "Autonomía"])
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    creator = relationship("User", foreign_keys=[creator_id])

class MentorExam(Base):
    __tablename__ = "mentor_exams"
    
    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"))
    agent_id = Column(Integer, ForeignKey("agents.id"))
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    status = Column(String, default="draft") # draft, published
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mentor = relationship("User", foreign_keys=[mentor_id])
    agent = relationship("Agent")
    questions = relationship("MentorExamQuestion", back_populates="exam")
    assignments = relationship("MentorExamAssignment", back_populates="exam")

class MentorExamQuestion(Base):
    __tablename__ = "mentor_exam_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("mentor_exams.id"))
    question = Column(Text)
    question_type = Column(String) # e.g. "text", "multiple_choice", "likert_5"
    options = Column(JSON, nullable=True)  # List[str] for multiple_choice options
    order = Column(Integer, default=0)
    correct_answer = Column(String, nullable=True)
    dimension = Column(String, nullable=True)

    exam = relationship("MentorExam", back_populates="questions")
    answers = relationship("MentorExamAnswer", back_populates="question")

class MentorExamAssignment(Base):
    __tablename__ = "mentor_exam_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("mentor_exams.id"))
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("mentor_groups.id"), nullable=True)
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="pending") # pending, completed
    demographics = Column(JSON, nullable=True)

    exam = relationship("MentorExam", back_populates="assignments")
    student = relationship("User", foreign_keys=[student_id])
    group = relationship("MentorGroup", foreign_keys=[group_id])
    answers = relationship("MentorExamAnswer", back_populates="assignment")


class MentorExamAnswer(Base):
    __tablename__ = "mentor_exam_answers"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("mentor_exam_assignments.id"))
    question_id = Column(Integer, ForeignKey("mentor_exam_questions.id"))
    value_numeric = Column(Integer, nullable=True)
    value_text = Column(Text, nullable=True)
    answered_at = Column(DateTime, default=datetime.datetime.utcnow)

    assignment = relationship("MentorExamAssignment", back_populates="answers")
    question = relationship("MentorExamQuestion", back_populates="answers")


class AttendanceClass(Base):
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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    mentor = relationship("User", foreign_keys=[mentor_id])
    group = relationship("MentorGroup")
    records = relationship("AttendanceRecord", back_populates="attendance_class")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("attendance_classes.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="falta")
    registered_at = Column(DateTime, nullable=True)
    scan_type = Column(String, nullable=True)

    attendance_class = relationship("AttendanceClass", back_populates="records")
    student = relationship("User", foreign_keys=[student_id])
