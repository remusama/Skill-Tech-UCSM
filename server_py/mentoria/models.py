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
    question_type = Column(String) # e.g. "text", "multiple_choice"
    options = Column(JSON, nullable=True)  # List[str] for multiple_choice options
    order = Column(Integer, default=0)
    
    exam = relationship("MentorExam", back_populates="questions")

class MentorExamAssignment(Base):
    __tablename__ = "mentor_exam_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("mentor_exams.id"))
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("mentor_groups.id"), nullable=True)
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="pending") # pending, completed
    
    exam = relationship("MentorExam", back_populates="assignments")
    student = relationship("User", foreign_keys=[student_id])
    group = relationship("MentorGroup", foreign_keys=[group_id])
