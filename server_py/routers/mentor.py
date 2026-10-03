from typing import List, Optional
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload, load_only
from pydantic import BaseModel

from server_py.memoria.database import get_db, User, ExamResult, UserSkill
from server_py.mentoria.models import MentorGroup, GroupStudent, MentorExam, MentorExamAssignment
from server_py.auth.router import get_current_user_id
from server_py.common.permisos import check_is_mentor

router = APIRouter(prefix="/api/mentor", tags=["Mentor"])

def _get_completed_exams_by_student(db: Session, student_ids: List[int]):
    completed_map = defaultdict(set)
    if not student_ids:
        return completed_map

    exam_results = (
        db.query(
            ExamResult.user_id,
            ExamResult.area,
        )
        .filter(
            ExamResult.user_id.in_(student_ids)
        )
        .all()
    )

    for user_id, area in exam_results:
        area_norm = (area or "").lower().strip()

        completed_map[user_id].add(area_norm)

        if "neo" in area_norm or "personalidad" in area_norm:
            completed_map[user_id].add("neo-pi-r")

        if "cepv" in area_norm or "valores" in area_norm or "estilo" in area_norm:
            completed_map[user_id].add("cepv")

        if "ccl" in area_norm or "liderazgo" in area_norm:
            completed_map[user_id].add("ccl")

        if "expectativa" in area_norm:
            completed_map[user_id].add("expectativas")

    assignments = (
        db.query(
            MentorExamAssignment.student_id,
            MentorExamAssignment.exam_id,
        )
        .filter(
            MentorExamAssignment.student_id.in_(
                student_ids
            ),
            MentorExamAssignment.status == "completed"
        )
        .all()
    )

    for student_id, exam_id in assignments:
        if (
            student_id is not None
            and exam_id is not None
        ):
            completed_map[
                student_id
            ].add(str(exam_id))

    return completed_map

# ============================================================================
# ESQUEMAS DE PETICIÓN (PYDANTIC)
# ============================================================================

class CreateGroupRequest(BaseModel):
    name: str
    description: str = None
    student_ids: List[int] = []

# ============================================================================
# ENDPOINTS DE GESTIÓN DE MENTORÍA
# ============================================================================

@router.get("/students")
def get_mentor_students(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Devuelve la lista de estudiantes asignados al mentor (vía grupos o asignación directa).
    Actualmente devuelve todos los estudiantes para la versión MVP del dashboard de mentor.
    """
    check_is_mentor(current_user_id, db)

    students = (
        db.query(
            User.id,
            User.username,
            User.full_name,
        )
        .filter(
            User.role == "student"
        )
        .all()
    )
    student_ids = [s.id for s in students]

    # Precarga de todas las habilidades para los estudiantes seleccionados
    all_skills = (
        db.query(
            UserSkill.user_id,
            UserSkill.area,
            UserSkill.level,
        )
        .filter(
            UserSkill.user_id.in_(student_ids)
        )
        .all()
    )

    skills_by_student = {}

    for user_id, area, level in all_skills:
        if user_id not in skills_by_student:
            skills_by_student[user_id] = []

        skills_by_student[user_id].append({
            "area": area,
            "level": level,
        })

    # Precarga de exámenes completados por estudiante
    completed_exams_map = _get_completed_exams_by_student(db, student_ids)

    result = []
    for s in students:
        s_skills = skills_by_student.get(s.id, [])
        top_skill = (
            max(s_skills, key=lambda x: x["level"])["area"]
            if s_skills
            else "N/A"
        )

        avg_level = (
            sum(sk["level"] for sk in s_skills) / len(s_skills)
            if s_skills
            else 0
        )

        result.append({
            "id": s.id,
            "username": s.username,
            "full_name": s.full_name or s.username,
            "top_skill": top_skill,
            "average_level": avg_level,
            "completed_exams": list(completed_exams_map.get(s.id, []))
        })
    return result


@router.get("/groups")
def get_mentor_groups(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Todos los mentores comparten la misma base de datos de grupos de estudiantes."""
    check_is_mentor(current_user_id, db)
    groups = (
        db.query(MentorGroup)
        .options(
            selectinload(MentorGroup.students)
        )
        .all()
    )

    return [
        {
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "created_at": g.created_at.isoformat(),
            "student_count": len(g.students)
        } for g in groups
    ]


@router.post("/groups")
def create_mentor_group(
    req: CreateGroupRequest, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Crea un nuevo grupo de mentoría y le asocia los estudiantes proporcionados."""
    check_is_mentor(current_user_id, db)

    try:
        group = MentorGroup(
            mentor_id=current_user_id,
            name=req.name,
            description=req.description
        )
        db.add(group)
        db.commit()
        db.refresh(group)

        for sid in req.student_ids:
            gs = GroupStudent(group_id=group.id, student_id=sid)
            db.add(gs)

        db.commit()
        return {"message": "Group created", "group_id": group.id}
    except Exception:
        db.rollback()
        raise


@router.get("/exams")
def get_mentor_exams(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Obtiene los exámenes creados por el mentor autenticado."""
    check_is_mentor(current_user_id, db)
    exams = (
        db.query(
            MentorExam.id,
            MentorExam.title,
            MentorExam.description,
            MentorExam.status,
            MentorExam.created_at,
        )
        .filter(
            MentorExam.mentor_id == current_user_id
        )
        .all()
    )
    return [
        {
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "status": e.status,
            "created_at": e.created_at.isoformat()
        } for e in exams
    ]

# ============================================================================
# ENDPOINTS DE COMPATIBILIDAD CON COMPONENTES EXISTENTES DEL DASHBOARD
# ============================================================================

@router.get("/students/{student_id}/history")
def get_student_history(
    student_id: int, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Obtiene el historial de exámenes de un estudiante por su ID."""
    check_is_mentor(current_user_id, db)
    history = (
        db.query(
            ExamResult.id,
            ExamResult.area,
            ExamResult.score,
            ExamResult.timestamp,
            ExamResult.data,
        )
        .filter(
            ExamResult.user_id == student_id
        )
        .order_by(
            ExamResult.timestamp.desc()
        )
        .all()
    )
    return [
        {
            "id": h.id, 
            "area": h.area, 
            "score": h.score, 
            "timestamp": h.timestamp.isoformat(), 
            "details": h.data
        } for h in history
    ]


@router.get("/stats/global")
def get_global_stats(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Respuesta stub para métricas globales en el dashboard de mentores."""
    check_is_mentor(current_user_id, db)
    return {
        "averages": {},
        "total_students": db.query(User).filter(User.role == "student").count(),
        "system_health": "stable"
    }


@router.get("/groups/{group_id}/students")
def get_group_students(
    group_id: int, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Devuelve los estudiantes pertenecientes a un grupo específico con sus datos de habilidad."""
    check_is_mentor(current_user_id, db)
    group = db.query(MentorGroup).filter(MentorGroup.id == group_id).first()

    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    student_ids = [
        student_id
        for (student_id,) in (
            db.query(GroupStudent.student_id)
            .filter(
                GroupStudent.group_id == group_id
            )
            .all()
        )
    ]

    students = (
        db.query(
            User.id,
            User.username,
            User.full_name,
        )
        .filter(
            User.id.in_(student_ids)
        )
        .all()
    )

    all_skills = (
        db.query(
            UserSkill.user_id,
            UserSkill.area,
            UserSkill.level,
        )
        .filter(
            UserSkill.user_id.in_(student_ids)
        )
        .all()
    )

    skills_by_student = {}

    for user_id, area, level in all_skills:
        skills_by_student.setdefault(
            user_id,
            []
        ).append({
            "area": area,
            "level": level,
        })

    completed_exams_map = _get_completed_exams_by_student(db, student_ids)

    result = []

    for s in students:
        s_skills = skills_by_student.get(s.id, [])
        top_skill = (
            max(
                s_skills,
                key=lambda x: x["level"]
            )["area"]
            if s_skills
            else "N/A"
        )

        avg_level = (
            sum(
                sk["level"]
                for sk in s_skills
            ) / len(s_skills)
            if s_skills
            else 0
        )
        result.append({
            "id": s.id,
            "username": s.username,
            "full_name": s.full_name or s.username,
            "top_skill": top_skill,
            "average_level": avg_level,
            "completed_exams": list(completed_exams_map.get(s.id, []))
        })

    return result


# ── Tarea 5A: Dashboard psicométrico ─────────────────────────────────────────

VALID_PSICOMETRIA_AREAS = {"liderazgo", "liderazgo_ccl", "personalidad_neo"}


@router.get("/dashboard/psicometria")
def get_psicometria_dashboard(
    area: str,
    group_id: int = None,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """Devuelve, para el área psicométrica indicada, el último resultado de cada
    estudiante (opcionalmente filtrado por grupo) junto con el promedio grupal."""
    check_is_mentor(current_user_id, db)

    if area not in VALID_PSICOMETRIA_AREAS:
        raise HTTPException(
            status_code=400,
            detail=f"Área inválida. Debe ser una de: {', '.join(sorted(VALID_PSICOMETRIA_AREAS))}"
        )

    if group_id is not None:
        group = db.query(MentorGroup).filter(MentorGroup.id == group_id).first()

        if not group:
            raise HTTPException(status_code=404, detail="Grupo no encontrado")
        student_ids = [
            student_id
            for (student_id,) in (
                db.query(GroupStudent.student_id)
                .filter(
                    GroupStudent.group_id == group_id
                )
                .all()
            )
        ]

    else:
        student_ids = [
            user_id
            for (user_id,) in (
                db.query(User.id)
                .filter(User.role == "student")
                .all()
            )
        ]
    if not student_ids:
        return {"area": area, "total": 0, "group_avg_score": 0, "students": []}

    student_rows = (
        db.query(
            User.id,
            User.full_name,
            User.username,
        )
        .filter(
            User.id.in_(student_ids)
        )
        .all()
    )

    students_by_id = {
        student_id: {
            "id": student_id,
            "full_name": full_name,
            "username": username,
        }
        for student_id, full_name, username in student_rows
    }
    results = (
        db.query(
            ExamResult.user_id,
            ExamResult.score,
            ExamResult.data,
            ExamResult.timestamp,
        )
        .filter(
            ExamResult.user_id.in_(student_ids),
            ExamResult.area == area,
        )
        .order_by(
            ExamResult.timestamp.desc()
        )
        .all()
    )

    latest_by_student = {}

    for user_id, score, data, timestamp in results:
        if user_id not in latest_by_student:
            latest_by_student[user_id] = {
                "score": score,
                "data": data,
                "timestamp": timestamp,
            }

    students_out = []

    for student_id, result in latest_by_student.items():
        student = students_by_id.get(student_id)

        if not student:
            continue

        students_out.append({
            "student_id": student["id"],
            "student_name": student["full_name"] or student["username"],
            "score": result["score"],
            "data": result["data"],
            "date": (
                result["timestamp"].isoformat()
                if result["timestamp"]
                else None
            ),
        })

    total = len(students_out)
    group_avg_score = round(sum(s["score"] or 0 for s in students_out) / total, 2) if total > 0 else 0

    return {
        "area": area,
        "total": total,
        "group_avg_score": group_avg_score,
        "students": students_out,
    }