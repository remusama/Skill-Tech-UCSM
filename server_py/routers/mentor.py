from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from server_py.memoria.database import get_db, User, ExamResult, UserSkill
from server_py.mentoria.models import MentorGroup, GroupStudent, MentorExam
from server_py.auth.router import get_current_user_id
from pydantic import BaseModel

router = APIRouter(prefix="/api/mentor", tags=["Mentor"])


def check_is_mentor(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["teacher", "admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de mentor.")
    return user


class CreateGroupRequest(BaseModel):
    name: str
    description: str = None
    student_ids: List[int] = []


@router.get("/students")
async def get_mentor_students(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Returns a list of students assigned to the mentor (via groups or direct assignment).
    For now, returns all students if admin/mentor, but logically should filter by mentor's groups.
    """
    check_is_mentor(current_user_id, db)

    # In a full implementation, we'd filter by students in groups owned by this mentor.
    # For now, returning all students for the mentor dashboard MVP
    students = db.query(User).filter(User.role == "student").all()

    student_ids = [s.id for s in students]

    # Pre-fetch all skills for these students
    all_skills = db.query(UserSkill).filter(UserSkill.user_id.in_(student_ids)).all()
    skills_by_student = {}
    for sk in all_skills:
        if sk.user_id not in skills_by_student:
            skills_by_student[sk.user_id] = []
        skills_by_student[sk.user_id].append(sk)

    result = []
    for s in students:
        s_skills = skills_by_student.get(s.id, [])
        top_skill = max(s_skills, key=lambda x: x.level).area if s_skills else "N/A"
        avg_level = sum(sk.level for sk in s_skills) / max(1, len(s_skills)) if s_skills else 0

        result.append({
            "id": s.id,
            "username": s.username,
            "full_name": s.full_name or s.username,
            "top_skill": top_skill,
            "average_level": avg_level
        })
    return result


@router.get("/groups")
async def get_mentor_groups(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    check_is_mentor(current_user_id, db)
    # Todos los mentores comparten la misma base de datos de grupos de estudiantes
    groups = db.query(MentorGroup).all()

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
async def create_mentor_group(req: CreateGroupRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    check_is_mentor(current_user_id, db)

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


@router.get("/exams")
async def get_mentor_exams(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    check_is_mentor(current_user_id, db)
    exams = db.query(MentorExam).filter(MentorExam.mentor_id == current_user_id).all()

    return [
        {
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "status": e.status,
            "created_at": e.created_at.isoformat()
        } for e in exams
    ]

# Compatibility endpoints for existing dashboard components


@router.get("/students/{student_id}/history")
async def get_student_history(student_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    # El estudiante puede ver su propio historial; cualquier otro caso requiere rol de mentor
    # (antes no había ninguna verificación acá: cualquier usuario logueado podía leer el
    # historial completo de exámenes de cualquier otro estudiante con solo cambiar el id).
    if current_user_id != student_id:
        check_is_mentor(current_user_id, db)
    history = db.query(ExamResult).filter(ExamResult.user_id == student_id).order_by(ExamResult.timestamp.desc()).all()
    return [{"id": h.id, "area": h.area, "score": h.score, "timestamp": h.timestamp.isoformat(), "details": h.data} for h in history]


@router.get("/stats/global")
async def get_global_stats(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    # Minimal stub for Mentor dashboard stats
    return {
        "averages": {},
        "total_students": db.query(User).filter(User.role == "student").count(),
        "system_health": "stable"
    }


@router.get("/groups/{group_id}/students")
async def get_group_students(group_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Returns students belonging to a specific group with their skill data."""
    check_is_mentor(current_user_id, db)
    group = db.query(MentorGroup).filter(MentorGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    student_ids = [gs.student_id for gs in group.students]
    students = db.query(User).filter(User.id.in_(student_ids)).all()

    all_skills = db.query(UserSkill).filter(UserSkill.user_id.in_(student_ids)).all()
    skills_by_student = {}
    for sk in all_skills:
        skills_by_student.setdefault(sk.user_id, []).append(sk)

    result = []
    for s in students:
        s_skills = skills_by_student.get(s.id, [])
        top_skill = max(s_skills, key=lambda x: x.level).area if s_skills else "N/A"
        avg_level = sum(sk.level for sk in s_skills) / max(1, len(s_skills)) if s_skills else 0
        result.append({
            "id": s.id,
            "username": s.username,
            "full_name": s.full_name or s.username,
            "top_skill": top_skill,
            "average_level": avg_level
        })
    return result


# ── Tarea 5A: Dashboard psicométrico ─────────────────────────────────────────

VALID_PSICOMETRIA_AREAS = {"liderazgo", "liderazgo_ccl", "personalidad_neo"}


@router.get("/dashboard/psicometria")
async def get_psicometria_dashboard(
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
        student_ids = [gs.student_id for gs in group.students]
    else:
        student_ids = [s.id for s in db.query(User).filter(User.role == "student").all()]

    if not student_ids:
        return {"area": area, "total": 0, "group_avg_score": 0, "students": []}

    students_by_id = {s.id: s for s in db.query(User).filter(User.id.in_(student_ids)).all()}

    # Último ExamResult por estudiante para el área dada
    results = db.query(ExamResult).filter(
        ExamResult.user_id.in_(student_ids),
        ExamResult.area == area,
    ).order_by(ExamResult.timestamp.desc()).all()

    latest_by_student = {}
    for r in results:
        if r.user_id not in latest_by_student:
            latest_by_student[r.user_id] = r

    students_out = []
    for student_id, result in latest_by_student.items():
        student = students_by_id.get(student_id)
        if not student:
            continue
        students_out.append({
            "student_id": student.id,
            "student_name": student.full_name or student.username,
            "score": result.score,
            "data": result.data,
            "date": result.timestamp.isoformat() if result.timestamp else None,
        })

    total = len(students_out)
    group_avg_score = round(sum(s["score"] or 0 for s in students_out) / total, 2) if total > 0 else 0

    return {
        "area": area,
        "total": total,
        "group_avg_score": group_avg_score,
        "students": students_out,
    }