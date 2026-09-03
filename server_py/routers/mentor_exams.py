from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from server_py.memoria.database import get_db, User
from server_py.mentoria.models import Agent, MentorExam, MentorExamQuestion, MentorExamAssignment, MentorExamAnswer, MentorGroup, GroupStudent
from server_py.auth.router import get_current_user_id
from server_py.logic import informante_logic
import datetime
from collections import defaultdict

router = APIRouter(tags=["Mentor Exams"])

def check_is_mentor(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["teacher", "admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de mentor.")
    return user

class QuestionRequest(BaseModel):
    question: str
    question_type: str = "text"  # "text" | "multiple_choice" | "likert_5"
    options: List[str] = []  # Only used when question_type == "multiple_choice"
    order: int = 0
    correct_answer: Optional[str] = None
    dimension: Optional[str] = None

class CreateExamRequest(BaseModel):
    agent_id: int
    title: str
    description: Optional[str] = None
    questions: List[QuestionRequest] = []

class AssignExamRequest(BaseModel):
    student_ids: List[int] = []
    group_ids: List[int] = []

@router.post("/api/mentor/exams")
async def create_exam(req: CreateExamRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Creates a new mentor exam. Agent must be selected first.
    """
    mentor = check_is_mentor(current_user_id, db)
    
    # Validate agent exists
    agent = db.query(Agent).filter(Agent.id == req.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agente no encontrado. Debes seleccionar un Agente antes de crear el examen.")
    
    exam = MentorExam(
        mentor_id=current_user_id,
        agent_id=req.agent_id,
        title=req.title,
        description=req.description,
        status="draft"
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    
    # Add questions
    for q in req.questions:
        opts = None
        if q.question_type == "multiple_choice":
            opts = q.options
        elif q.question_type == "likert_5":
            opts = q.options if isinstance(q.options, list) and q.options and isinstance(q.options[0], dict) else [{"value": 1, "label": "Totalmente en desacuerdo"}, {"value": 2, "label": "En desacuerdo"}, {"value": 3, "label": "Neutral"}, {"value": 4, "label": "De acuerdo"}, {"value": 5, "label": "Totalmente de acuerdo"}]
        question = MentorExamQuestion(
            exam_id=exam.id,
            question=q.question,
            question_type=q.question_type,
            options=opts,
            order=q.order,
            correct_answer=q.correct_answer if q.question_type == "multiple_choice" else None,
            dimension=q.dimension,
        )
        db.add(question)
    
    db.commit()
    
    return {
        "id": exam.id,
        "title": exam.title,
        "status": exam.status,
        "agent_id": exam.agent_id,
        "competencies": agent.competencies or []
    }

@router.post("/api/mentor/exams/{exam_id}/assign")
async def assign_exam(exam_id: int, req: AssignExamRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Assigns a mentor exam to specific students or groups.
    """
    check_is_mentor(current_user_id, db)
    
    exam = db.query(MentorExam).filter(MentorExam.id == exam_id, MentorExam.mentor_id == current_user_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examen no encontrado o no tienes permiso.")
    
    # Assign to individual students
    for student_id in req.student_ids:
        student = db.query(User).filter(User.id == student_id, User.role == "student").first()
        if student:
            existing = db.query(MentorExamAssignment).filter(
                MentorExamAssignment.exam_id == exam_id,
                MentorExamAssignment.student_id == student_id,
                MentorExamAssignment.group_id == None
            ).first()
            if not existing:
                db.add(MentorExamAssignment(
                    exam_id=exam_id,
                    student_id=student_id,
                    group_id=None,
                    status="pending"
                ))
    
    # Assign to groups (which expands to all students in the group)
    for group_id in req.group_ids:
        group = db.query(MentorGroup).filter(MentorGroup.id == group_id).first()
        if group:
            existing = db.query(MentorExamAssignment).filter(
                MentorExamAssignment.exam_id == exam_id,
                MentorExamAssignment.group_id == group_id
            ).first()
            if not existing:
                db.add(MentorExamAssignment(
                    exam_id=exam_id,
                    student_id=None,
                    group_id=group_id,
                    status="pending"
                ))
    
    # Publish exam when assigned
    exam.status = "published"
    db.commit()
    
    return {"message": "Examen asignado correctamente", "exam_id": exam_id, "status": exam.status}

@router.get("/api/student/mentor-exams")
async def get_student_mentor_exams(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Returns all mentor exams assigned to the current student.
    Includes exams assigned directly or via groups.
    """
    student = db.query(User).filter(User.id == current_user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Direct assignments
    direct = db.query(MentorExamAssignment).filter(
        MentorExamAssignment.student_id == current_user_id,
        MentorExamAssignment.group_id == None
    ).all()
    
    # Group-based assignments
    student_groups = db.query(GroupStudent).filter(GroupStudent.student_id == current_user_id).all()
    group_ids = [gs.group_id for gs in student_groups]
    
    group_assignments = db.query(MentorExamAssignment).filter(
        MentorExamAssignment.group_id.in_(group_ids)
    ).all() if group_ids else []
    
    all_exam_ids = set()
    result = []
    
    for assignment in direct + group_assignments:
        if assignment.exam_id not in all_exam_ids:
            all_exam_ids.add(assignment.exam_id)
            exam = db.query(MentorExam).filter(MentorExam.id == assignment.exam_id).first()
            if exam and exam.status == "published":
                agent = db.query(Agent).filter(Agent.id == exam.agent_id).first()
                questions = db.query(MentorExamQuestion).filter(MentorExamQuestion.exam_id == exam.id).order_by(MentorExamQuestion.order).all()
                result.append({
                    "id": exam.id,
                    "title": exam.title,
                    "description": exam.description,
                    "agent_name": agent.name if agent else "Desconocido",
                    "competencies": agent.competencies if agent else [],
                    "status": assignment.status,
                    "assigned_at": assignment.assigned_at.isoformat() if assignment.assigned_at else None,
                    "questions": [{"id": q.id, "question": q.question, "question_type": q.question_type, "options": q.options or [], "correct_answer": q.correct_answer, "order": q.order, "dimension": q.dimension} for q in questions]
                })
    
    return result

@router.get("/api/mentor/exams/{exam_id}/detail")
async def get_exam_detail(exam_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Returns full detail of a mentor exam including questions and assignments."""
    check_is_mentor(current_user_id, db)
    
    exam = db.query(MentorExam).filter(MentorExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examen no encontrado")
    
    agent = db.query(Agent).filter(Agent.id == exam.agent_id).first()
    questions = db.query(MentorExamQuestion).filter(MentorExamQuestion.exam_id == exam_id).order_by(MentorExamQuestion.order).all()
    assignments = db.query(MentorExamAssignment).filter(MentorExamAssignment.exam_id == exam_id).all()
    
    return {
        "id": exam.id,
        "title": exam.title,
        "description": exam.description,
        "status": exam.status,
        "agent": {"id": agent.id, "name": agent.name, "competencies": agent.competencies} if agent else None,
        "questions": [{"id": q.id, "question": q.question, "question_type": q.question_type, "options": q.options or [], "correct_answer": q.correct_answer, "order": q.order, "dimension": q.dimension} for q in questions],
        "assignment_count": len(assignments)
    }


@router.get("/api/mentor/students/{student_id}/quantum")
async def get_student_quantum_mentor(
    student_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Returns quantum skills data for a student — accessible by mentors."""
    from server_py.routers.mentor import check_is_mentor
    check_is_mentor(current_user_id, db)
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    data = informante_logic.get_student_quantum_data(db, student_id)
    return data


@router.get("/api/mentor/archives/exams")
async def get_all_mentor_exams(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Returns all exams created by the mentor with full details for the archives view."""
    check_is_mentor(current_user_id, db)
    exams = db.query(MentorExam).filter(MentorExam.mentor_id == current_user_id).all()
    result = []
    for e in exams:
        agent = db.query(Agent).filter(Agent.id == e.agent_id).first()
        questions = db.query(MentorExamQuestion).filter(MentorExamQuestion.exam_id == e.id).all()
        assignments = db.query(MentorExamAssignment).filter(MentorExamAssignment.exam_id == e.id).all()
        result.append({
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "status": e.status,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "agent_id": e.agent_id,
            "agent_name": agent.name if agent else "Desconocido",
            "competencies": agent.competencies if agent else [],
            "question_count": len(questions),
            "assignment_count": len(assignments),
        })
    return result


@router.post("/api/mentor/exams/{exam_id}/duplicate")
async def duplicate_exam(exam_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Duplicates an existing exam as a new draft for editing/reuse."""
    check_is_mentor(current_user_id, db)
    original = db.query(MentorExam).filter(MentorExam.id == exam_id, MentorExam.mentor_id == current_user_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Examen no encontrado")

    new_exam = MentorExam(
        mentor_id=current_user_id,
        agent_id=original.agent_id,
        title=f"[COPIA] {original.title}",
        description=original.description,
        status="draft"
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    original_questions = db.query(MentorExamQuestion).filter(MentorExamQuestion.exam_id == exam_id).all()
    for q in original_questions:
        db.add(MentorExamQuestion(
            exam_id=new_exam.id,
            question=q.question,
            question_type=q.question_type,
            options=q.options,
            correct_answer=q.correct_answer,
            order=q.order,
            dimension=q.dimension,
        ))
    db.commit()

    return {"id": new_exam.id, "title": new_exam.title, "status": new_exam.status}


class AnswerItem(BaseModel):
    question_id: int
    value_numeric: Optional[int] = None
    value_text: Optional[str] = None


class SubmitExamRequest(BaseModel):
    answers: List[AnswerItem]
    demographics: Optional[dict] = None


def _find_or_create_assignment(db: Session, exam_id: int, student_id: int) -> MentorExamAssignment:
    assignment = db.query(MentorExamAssignment).filter(
        MentorExamAssignment.exam_id == exam_id,
        MentorExamAssignment.student_id == student_id,
    ).first()
    if assignment:
        return assignment
    student_groups = db.query(GroupStudent).filter(GroupStudent.student_id == student_id).all()
    group_ids = [gs.group_id for gs in student_groups]
    if group_ids:
        group_assignment = db.query(MentorExamAssignment).filter(
            MentorExamAssignment.exam_id == exam_id,
            MentorExamAssignment.group_id.in_(group_ids),
        ).first()
        if group_assignment:
            individual = MentorExamAssignment(
                exam_id=exam_id,
                student_id=student_id,
                group_id=group_assignment.group_id,
                status="pending",
            )
            db.add(individual)
            db.flush()
            return individual
    new_assignment = MentorExamAssignment(
        exam_id=exam_id,
        student_id=student_id,
        group_id=None,
        status="pending",
    )
    db.add(new_assignment)
    db.flush()
    return new_assignment


@router.post("/api/mentor/exams/{exam_id}/submit")
async def submit_exam_answers(
    exam_id: int,
    req: SubmitExamRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    exam = db.query(MentorExam).filter(MentorExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examen no encontrado")
    if exam.status != "published":
        raise HTTPException(status_code=400, detail="Este examen no está disponible para responder")
    questions = db.query(MentorExamQuestion).filter(MentorExamQuestion.exam_id == exam_id).all()
    questions_by_id = {q.id: q for q in questions}
    if not req.answers:
        raise HTTPException(status_code=400, detail="No se recibieron respuestas")
    assignment = _find_or_create_assignment(db, exam_id, current_user_id)
    if assignment.status == "completed":
        raise HTTPException(status_code=400, detail="Ya has respondido este examen anteriormente")
    for ans in req.answers:
        question = questions_by_id.get(ans.question_id)
        if not question:
            raise HTTPException(status_code=400, detail=f"La pregunta {ans.question_id} no pertenece a este examen")
        if question.question_type == "likert_5":
            if ans.value_numeric is None or not (1 <= ans.value_numeric <= 5):
                raise HTTPException(status_code=400, detail=f"La pregunta {ans.question_id} requiere un valor numérico entre 1 y 5")
        elif question.question_type == "text":
            if not ans.value_text or not ans.value_text.strip():
                raise HTTPException(status_code=400, detail=f"La pregunta {ans.question_id} requiere una respuesta de texto")
        db.add(MentorExamAnswer(
            assignment_id=assignment.id,
            question_id=ans.question_id,
            value_numeric=ans.value_numeric,
            value_text=ans.value_text,
        ))
    assignment.demographics = req.demographics
    assignment.status = "completed"
    db.commit()
    return {
        "message": "Respuestas guardadas correctamente",
        "exam_id": exam_id,
        "assignment_id": assignment.id,
        "status": assignment.status,
    }


@router.get("/api/mentor/exams/{exam_id}/results")
async def get_exam_results(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    check_is_mentor(current_user_id, db)
    exam = db.query(MentorExam).filter(MentorExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examen no encontrado")
    if exam.mentor_id is not None and exam.mentor_id != current_user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver los resultados de este examen")
    completed_assignments = db.query(MentorExamAssignment).filter(
        MentorExamAssignment.exam_id == exam_id,
        MentorExamAssignment.status == "completed",
    ).all()
    completed_ids = [a.id for a in completed_assignments]
    if not completed_ids:
        return {
            "exam_id": exam_id,
            "title": exam.title,
            "total_respondents": 0,
            "dimensions": [],
            "open_questions": [],
        }
    questions = db.query(MentorExamQuestion).filter(MentorExamQuestion.exam_id == exam_id).order_by(MentorExamQuestion.order).all()
    answers = db.query(MentorExamAnswer).filter(MentorExamAnswer.assignment_id.in_(completed_ids)).all()
    answers_by_question = defaultdict(list)
    for a in answers:
        answers_by_question[a.question_id].append(a)
    dimension_values = defaultdict(list)
    for q in questions:
        if q.question_type == "likert_5" and q.dimension:
            for a in answers_by_question.get(q.id, []):
                if a.value_numeric is not None:
                    dimension_values[q.dimension].append(a.value_numeric)
    dimensions_result = [
        {
            "dimension": dim,
            "average": round(sum(vals) / len(vals), 2),
            "item_count": len(vals),
        }
        for dim, vals in dimension_values.items()
    ]
    open_questions_result = []
    for q in questions:
        if q.question_type == "text":
            texts = [a.value_text for a in answers_by_question.get(q.id, []) if a.value_text]
            open_questions_result.append({
                "question_id": q.id,
                "question": q.question,
                "answers": texts,
            })
    return {
        "exam_id": exam_id,
        "title": exam.title,
        "total_respondents": len(completed_ids),
        "dimensions": dimensions_result,
        "open_questions": open_questions_result,
    }
