from collections import defaultdict
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from server_py.auth.router import get_current_user_id
from server_py.logic import informante_logic
from server_py.memoria.database import User, get_db
from server_py.mentoria.models import (
    Agent,
    GroupStudent,
    MentorExam,
    MentorExamAnswer,
    MentorExamAssignment,
    MentorExamQuestion,
    MentorGroup,
)

router = APIRouter(tags=["Mentor Exams"])

# ============================================================================
# FUNCIONES AUXILIARES Y AUTORIZACIÓN
# ============================================================================

def check_is_mentor(user_id: int, db: Session) -> User:
    """Verifica que el usuario exista y tenga el rol permitido de mentor/profesor/admin.

    Raises:
        HTTPException: 403 si el rol no es válido, 404 si el usuario no existe.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Usuario no encontrado."
        )
    if user.role not in ["teacher", "admin", "mentor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Se requiere rol de mentor."
        )
    return user

def _find_or_create_assignment(db: Session, exam_id: int, student_id: int) -> MentorExamAssignment:
    """Busca o inicializa una asignación de examen para un estudiante específico."""
    assignment = db.query(MentorExamAssignment).filter(
        MentorExamAssignment.exam_id == exam_id,
        MentorExamAssignment.student_id == student_id,
    ).first()
    
    if assignment:
        return assignment

    # Verificar si fue asignado a través de un grupo
    student_groups = db.query(GroupStudent.group_id).filter(GroupStudent.student_id == student_id).all()
    group_ids = [g[0] for g in student_groups]

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

# ============================================================================
# ESQUEMAS DE PETICIÓN (PYDANTIC)
# ============================================================================

class QuestionRequest(BaseModel):
    question: str = Field(..., description="Texto de la pregunta")
    question_type: str = Field("text", description="Tipo de pregunta: 'text' | 'multiple_choice' | 'likert_5'")
    options: List[Any] = Field(default_factory=list, description="Opciones en caso de opción múltiple o Likert")
    order: int = Field(0, description="Orden de aparición")
    correct_answer: Optional[str] = Field(None, description="Respuesta correcta si aplica")
    dimension: Optional[str] = Field(None, description="Dimensión o competencia evaluada")


class CreateExamRequest(BaseModel):
    agent_id: int = Field(..., description="ID del Agente evaluador asociado")
    title: str = Field(..., description="Título del examen")
    description: Optional[str] = Field(None, description="Descripción opcional del examen")
    questions: List[QuestionRequest] = Field(default_factory=list, description="Lista de preguntas")


class AssignExamRequest(BaseModel):
    student_ids: List[int] = Field(default_factory=list, description="IDs de estudiantes individuales")
    group_ids: List[int] = Field(default_factory=list, description="IDs de grupos de estudiantes")


class AnswerItem(BaseModel):
    question_id: int
    value_numeric: Optional[int] = None
    value_text: Optional[str] = None


class SubmitExamRequest(BaseModel):
    answers: List[AnswerItem]
    demographics: Optional[Dict[str, Any]] = None

# ============================================================================
# ENDPOINTS DE LA API (MENTOR)
# ============================================================================

@router.post("/mentor/exams", status_code=status.HTTP_201_CREATED)
async def create_exam(
    req: CreateExamRequest, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Crea un nuevo examen asignado a un Agente evaluador especificado."""
    check_is_mentor(current_user_id, db)

    # Validate agent exists
    agent = db.query(Agent).filter(Agent.id == req.agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Agente no encontrado. Debes seleccionar un Agente antes de crear el examen."
        )

    try:
        exam = MentorExam(
            mentor_id=current_user_id,
            agent_id=req.agent_id,
            title=req.title,
            description=req.description,
            status="draft"
        )
        db.add(exam)
        db.flush()

        # Opciones por defecto para escala Likert
        default_likert_options = [
            {"value": 1, "label": "Totalmente en desacuerdo"},
            {"value": 2, "label": "En desacuerdo"},
            {"value": 3, "label": "Neutral"},
            {"value": 4, "label": "De acuerdo"},
            {"value": 5, "label": "Totalmente de acuerdo"}
        ]

        for q in req.questions:
            opts = None
            if q.question_type == "multiple_choice":
                opts = q.options
            elif q.question_type == "likert_5":
                opts = q.options if (isinstance(q.options, list) and q.options and isinstance(q.options[0], dict)) else default_likert_options

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
        db.refresh(exam)

        return {
            "id": exam.id,
            "title": exam.title,
            "status": exam.status,
            "agent_id": exam.agent_id,
            "competencies": agent.competencies or []
        }
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear el examen: {str(error)}"
        )


@router.post("/mentor/exams/{exam_id}/assign")
async def assign_exam(
    exam_id: int, 
    req: AssignExamRequest, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Asigna un examen a estudiantes individuales o a grupos enteros."""
    check_is_mentor(current_user_id, db)

    exam = db.query(MentorExam).filter(
        MentorExam.id == exam_id, 
        MentorExam.mentor_id == current_user_id
    ).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Examen no encontrado o no tienes permiso sobre él."
        )

    # Assign to individual students
    for student_id in req.student_ids:
        student = db.query(User).filter(User.id == student_id, User.role == "student").first()
        if student:
            existing = db.query(MentorExamAssignment).filter(
                MentorExamAssignment.exam_id == exam_id,
                MentorExamAssignment.student_id == student_id,
                MentorExamAssignment.group_id is None
            ).first()
            if not existing:
                db.add(MentorExamAssignment(
                    exam_id=exam_id,
                    student_id=student_id,
                    group_id=None,
                    status="pending"
                ))

    try:
        # Asignación individual
        for student_id in req.student_ids:
            student = db.query(User).filter(User.id == student_id, User.role == "student").first()
            if student:
                existing = db.query(MentorExamAssignment).filter(
                    MentorExamAssignment.exam_id == exam_id,
                    MentorExamAssignment.student_id == student_id,
                    MentorExamAssignment.group_id.is_(None)
                ).first()
                if not existing:
                    db.add(MentorExamAssignment(
                        exam_id=exam_id,
                        student_id=student_id,
                        group_id=None,
                        status="pending"
                    ))

        # Asignación por grupos
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

        exam.status = "published"
        db.commit()

        return {
            "message": "Examen asignado correctamente", 
            "exam_id": exam_id, 
            "status": exam.status
        }
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al asignar el examen: {str(error)}"
        )


@router.get("/mentor/exams/{exam_id}/detail")
async def get_exam_detail(
    exam_id: int, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Obtiene el detalle completo de un examen, sus preguntas y contador de asignaciones."""
    check_is_mentor(current_user_id, db)

    exam = db.query(MentorExam).filter(MentorExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examen no encontrado")

    agent = db.query(Agent).filter(Agent.id == exam.agent_id).first()
    questions = db.query(MentorExamQuestion).filter(
        MentorExamQuestion.exam_id == exam_id
    ).order_by(MentorExamQuestion.order).all()
    
    assignment_count = db.query(MentorExamAssignment).filter(
        MentorExamAssignment.exam_id == exam_id
    ).count()

    return {
        "id": exam.id,
        "title": exam.title,
        "description": exam.description,
        "status": exam.status,
        "agent": {"id": agent.id, "name": agent.name, "competencies": agent.competencies} if agent else None,
        "questions": [
            {
                "id": q.id,
                "question": q.question,
                "question_type": q.question_type,
                "options": q.options or [],
                "correct_answer": q.correct_answer,
                "order": q.order,
                "dimension": q.dimension
            } 
            for q in questions
        ],
        "assignment_count": assignment_count
    }


@router.get("/mentor/students/{student_id}/quantum")
async def get_student_quantum_mentor(
    student_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Retorna los datos de competencias cuánticas de un estudiante para vista del mentor."""
    from server_py.routers.mentor import check_is_mentor
    check_is_mentor(current_user_id, db)
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudiante no encontrado.")
    return informante_logic.get_student_quantum_data(db, student_id)


@router.get("/mentor/archives/exams")
async def get_all_mentor_exams(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Obtiene todos los exámenes creados por el mentor actual para vista de archivo."""
    check_is_mentor(current_user_id, db)

    exams = db.query(MentorExam).filter(MentorExam.mentor_id == current_user_id).all()
    if not exams:
        return []

    exam_ids = [e.id for e in exams]
    
    # Carga optimizada
    agents = {a.id: a for a in db.query(Agent).all()}
    
    questions_counts = defaultdict(int)
    for q in db.query(MentorExamQuestion.exam_id).filter(MentorExamQuestion.exam_id.in_(exam_ids)).all():
        questions_counts[q[0]] += 1

    assignments_counts = defaultdict(int)
    for a in db.query(MentorExamAssignment.exam_id).filter(MentorExamAssignment.exam_id.in_(exam_ids)).all():
        assignments_counts[a[0]] += 1

    result = []
    for e in exams:
        agent = agents.get(e.agent_id)
        result.append({
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "status": e.status,
            "created_at": e.created_at.isoformat() if getattr(e, "created_at", None) else None,
            "agent_id": e.agent_id,
            "agent_name": agent.name if agent else "Desconocido",
            "competencies": agent.competencies if agent else [],
            "question_count": questions_counts[e.id],
            "assignment_count": assignments_counts[e.id],
        })

    return result


@router.post("/mentor/exams/{exam_id}/duplicate", status_code=status.HTTP_201_CREATED)
async def duplicate_exam(
    exam_id: int, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Duplica un examen existente como un nuevo borrador."""
    check_is_mentor(current_user_id, db)
    original = db.query(MentorExam).filter(
        MentorExam.id == exam_id, 
        MentorExam.mentor_id == current_user_id
    ).first()
    
    if not original:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Examen no encontrado.")

    try:
        new_exam = MentorExam(
            mentor_id=current_user_id,
            agent_id=original.agent_id,
            title=f"[COPIA] {original.title}",
            description=original.description,
            status="draft"
        )
        db.add(new_exam)
        db.flush()

        original_questions = db.query(MentorExamQuestion).filter(
            MentorExamQuestion.exam_id == exam_id
        ).all()

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
        db.refresh(new_exam)

        return {"id": new_exam.id, "title": new_exam.title, "status": new_exam.status}
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al duplicar el examen: {str(error)}"
        )


@router.get("/mentor/exams/{exam_id}/results")
async def get_exam_results(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """Obtiene los resultados consolidados por dimensiones y respuestas abiertas de un examen."""
    check_is_mentor(current_user_id, db)

    exam = db.query(MentorExam).filter(MentorExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examen no encontrado")
    if exam.mentor_id is not None and exam.mentor_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No tienes permiso para ver los resultados de este examen."
        )

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

    questions = db.query(MentorExamQuestion).filter(
        MentorExamQuestion.exam_id == exam_id
    ).order_by(MentorExamQuestion.order).all()

    answers = db.query(MentorExamAnswer).filter(
        MentorExamAnswer.assignment_id.in_(completed_ids)
    ).all()

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

# ============================================================================
# ENDPOINTS DE LA API (ESTUDIANTE)
# ============================================================================

@router.get("/student/mentor-exams")
async def get_student_mentor_exams(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Retorna los exámenes asignados al estudiante actual (directamente o por grupo)."""
    student = db.query(User).filter(User.id == current_user_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    direct = db.query(MentorExamAssignment).filter(
        MentorExamAssignment.student_id == current_user_id,
        MentorExamAssignment.group_id.is_(None)
    ).all()

    student_groups = db.query(GroupStudent.group_id).filter(
        GroupStudent.student_id == current_user_id
    ).all()
    group_ids = [gs[0] for gs in student_groups]

    group_assignments = db.query(MentorExamAssignment).filter(
        MentorExamAssignment.group_id.in_(group_ids)
    ).all() if group_ids else []

    all_exam_ids = set()
    result = []

    for assignment in direct + group_assignments:
        if assignment.exam_id not in all_exam_ids:
            all_exam_ids.add(assignment.exam_id)

            exam = db.query(MentorExam).filter(
                MentorExam.id == assignment.exam_id, 
                MentorExam.status == "published"
            ).first()

            if exam and exam.status == "published":
                agent = db.query(Agent).filter(Agent.id == exam.agent_id).first()
                questions = db.query(MentorExamQuestion).filter(
                    MentorExamQuestion.exam_id == exam.id
                ).order_by(MentorExamQuestion.order).all()

                result.append({
                    "id": exam.id,
                    "title": exam.title,
                    "description": exam.description,
                    "agent_name": agent.name if agent else "Desconocido",
                    "competencies": agent.competencies if agent else [],
                    "status": assignment.status,
                    "assigned_at": assignment.assigned_at.isoformat() if getattr(assignment, "assigned_at", None) else None,
                    "questions": [
                        {
                            "id": q.id,
                            "question": q.question,
                            "question_type": q.question_type,
                            "options": q.options or [],
                            "correct_answer": q.correct_answer,
                            "order": q.order,
                            "dimension": q.dimension
                        } 
                        for q in questions
                    ]
                })

    return result


@router.post("/mentor/exams/{exam_id}/submit")
async def submit_exam_answers(
    exam_id: int,
    req: SubmitExamRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """Permite a un estudiante responder y enviar su examen."""
    exam = db.query(MentorExam).filter(MentorExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examen no encontrado")

    if exam.status != "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Este examen no está disponible para responder."
        )

    if not req.answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No se recibieron respuestas."
        )

    try:
        questions = db.query(MentorExamQuestion).filter(MentorExamQuestion.exam_id == exam_id).all()
        questions_by_id = {q.id: q for q in questions}

        assignment = _find_or_create_assignment(db, exam_id, current_user_id)
        if assignment.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Ya has respondido este examen anteriormente."
            )

        for ans in req.answers:
            question = questions_by_id.get(ans.question_id)
            if not question:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"La pregunta {ans.question_id} no pertenece a este examen."
                )

            if question.question_type == "likert_5":
                if ans.value_numeric is None or not (1 <= ans.value_numeric <= 5):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST, 
                        detail=f"La pregunta {ans.question_id} requiere un valor numérico entre 1 y 5."
                    )
            elif question.question_type == "text":
                if not ans.value_text or not ans.value_text.strip():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST, 
                        detail=f"La pregunta {ans.question_id} requiere una respuesta de texto."
                    )

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
    except HTTPException:
        db.rollback()
        raise
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar las respuestas: {str(error)}"
        )