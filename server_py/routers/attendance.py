from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from server_py.memoria.database import get_db, User
from server_py.mentoria.models import GroupStudent, AttendanceClass, AttendanceRecord
from server_py.auth.router import get_current_user_id
from pydantic import BaseModel
import datetime
import uuid

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


def check_is_mentor(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["teacher", "admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de mentor.")
    return user


class CreateClassRequest(BaseModel):
    name: str
    group_id: Optional[int] = None
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    late_time: str  # HH:MM


class ScanRequest(BaseModel):
    class_code: str
    secure_token: str
    scan_type: str  # "qr" or "nfc"


@router.post("/classes")
async def create_attendance_class(req: CreateClassRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    check_is_mentor(current_user_id, db)

    # Generate a unique class code
    class_code = f"CLASS-{uuid.uuid4().hex[:6].upper()}"

    new_class = AttendanceClass(
        mentor_id=current_user_id,
        group_id=req.group_id,
        name=req.name,
        code=class_code,
        date=req.date,
        start_time=req.start_time,
        late_time=req.late_time,
        is_active=True
    )
    db.add(new_class)
    db.commit()
    db.refresh(new_class)

    # If a group is associated, initialize all group students as "falta"
    if req.group_id:
        group_students = db.query(GroupStudent).filter(GroupStudent.group_id == req.group_id).all()
        for gs in group_students:
            record = AttendanceRecord(
                class_id=new_class.id,
                student_id=gs.student_id,
                status="falta",
                registered_at=None,
                scan_type=None
            )
            db.add(record)
        db.commit()

    return {
        "message": "Clase creada exitosamente.",
        "class_id": new_class.id,
        "code": class_code
    }


@router.get("/classes")
async def get_attendance_classes(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    check_is_mentor(current_user_id, db)
    classes = (
        db.query(AttendanceClass)
        .filter(AttendanceClass.mentor_id == current_user_id)
        .order_by(AttendanceClass.created_at.desc())
        .all()
    )

    result = []
    for c in classes:
        group_name = "Sin Grupo"
        if c.group:
            group_name = c.group.name

        total_students = len(c.records)
        present = sum(1 for r in c.records if r.status == "presente")
        tardy = sum(1 for r in c.records if r.status == "tardanza")
        absent = sum(1 for r in c.records if r.status == "falta")

        result.append({
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "group_id": c.group_id,
            "group_name": group_name,
            "date": c.date,
            "start_time": c.start_time,
            "late_time": c.late_time,
            "is_active": c.is_active,
            "stats": {
                "total": total_students,
                "present": present,
                "tardy": tardy,
                "absent": absent,
                "rate": round((present + tardy) / max(1, total_students) * 100) if total_students > 0 else 0
            }
        })
    return result


@router.get("/classes/{class_id}")
async def get_class_details(class_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    check_is_mentor(current_user_id, db)
    c = db.query(AttendanceClass).filter(AttendanceClass.id == class_id,
                                         AttendanceClass.mentor_id == current_user_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Clase no encontrada.")

    records = []
    for r in c.records:
        records.append({
            "id": r.id,
            "student_id": r.student_id,
            "student_name": r.student.full_name or r.student.username,
            "student_username": r.student.username,
            "status": r.status,
            "registered_at": r.registered_at.isoformat() if r.registered_at else None,
            "scan_type": r.scan_type
        })

    return {
        "id": c.id,
        "name": c.name,
        "code": c.code,
        "group_id": c.group_id,
        "group_name": c.group.name if c.group else "Sin Grupo",
        "date": c.date,
        "start_time": c.start_time,
        "late_time": c.late_time,
        "is_active": c.is_active,
        "records": records
    }


@router.post("/scan")
async def scan_attendance(req: ScanRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    # 1. VERIFICACIÓN CRÍTICA DE ROL: Solo el mentor puede escanear
    check_is_mentor(current_user_id, db)

    # 2. Verificar que la clase exista y esté activa
    c = db.query(AttendanceClass).filter(AttendanceClass.code == req.class_code).first()
    if not c:
        raise HTTPException(status_code=404, detail="Clase no encontrada con el código proporcionado.")
    if not c.is_active:
        raise HTTPException(status_code=400, detail="La sesión de asistencia para esta clase está cerrada.")

    # 3. Buscar al estudiante por su token seguro
    student = db.query(User).filter(User.secure_token == req.secure_token).first()
    if not student:
        raise HTTPException(status_code=404, detail="Código de credencial QR/NFC inválido.")

    # 4. Si la clase tiene grupo, validar que el estudiante pertenezca al grupo
    if c.group_id:
        is_member = db.query(GroupStudent).filter(
            GroupStudent.group_id == c.group_id,
            GroupStudent.student_id == student.id
        ).first()
        if not is_member:
            raise HTTPException(
                status_code=403,
                detail=f"El estudiante {student.full_name or student.username} no está autorizado en esta clase/grupo."
            )

    # 5. Calcular estado de asistencia (presente o tardanza)
    now = datetime.datetime.now()
    current_time_str = now.strftime("%H:%M")

    status = "presente"
    if current_time_str > c.late_time:
        status = "tardanza"

    # 6. Registrar o actualizar la asistencia del estudiante
    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.class_id == c.id,
        AttendanceRecord.student_id == student.id
    ).first()

    if not record:
        record = AttendanceRecord(
            class_id=c.id,
            student_id=student.id,
            status=status,
            registered_at=now,
            scan_type=req.scan_type
        )
        db.add(record)
    else:
        # Si ya estaba registrado como presente/tardanza, no re-escribir
        if record.status in ["presente", "tardanza"]:
            return {
                "message": "El estudiante ya había registrado su asistencia previamente.",
                "student_name": student.full_name or student.username,
                "status": record.status,
                "registered_at": record.registered_at.isoformat() if record.registered_at else None
            }

        record.status = status
        record.registered_at = now
        record.scan_type = req.scan_type

    db.commit()

    return {
        "message": "Asistencia registrada correctamente.",
        "student_name": student.full_name or student.username,
        "status": status,
        "registered_at": now.isoformat()
    }


@router.get("/student/token")
async def get_student_token(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    # Auto-generate if null
    if not user.secure_token:
        user.secure_token = f"SKILL-{uuid.uuid4().hex[:12].upper()}"
        db.commit()
        db.refresh(user)

    return {"token": user.secure_token}


@router.post("/student/regenerate_token")
async def regenerate_student_token(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    user.secure_token = f"SKILL-{uuid.uuid4().hex[:12].upper()}"
    db.commit()
    db.refresh(user)

    return {"token": user.secure_token, "message": "Credencial regenerada exitosamente."}


@router.get("/student/{student_id}/token")
async def get_any_student_token(student_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    check_is_mentor(current_user_id, db)
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    # Auto-generate if null
    if not user.secure_token:
        user.secure_token = f"SKILL-{uuid.uuid4().hex[:12].upper()}"
        db.commit()
        db.refresh(user)

    return {"token": user.secure_token}


@router.get("/student/{student_id}/stats")
async def get_student_attendance_stats(student_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    # Verify current user is mentor
    check_is_mentor(current_user_id, db)

    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado.")

    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).all()

    total = len(records)
    present = sum(1 for r in records if r.status == "presente")
    tardy = sum(1 for r in records if r.status == "tardanza")
    absent = sum(1 for r in records if r.status == "falta")

    # Calculate group average for comparative analysis (Benchmarking)
    # Get all classes this student has records for
    class_ids = [r.class_id for r in records]
    group_average = 0
    if class_ids:
        all_records_in_same_classes = db.query(AttendanceRecord).filter(AttendanceRecord.class_id.in_(class_ids)).all()
        total_class_records = len(all_records_in_same_classes)
        total_class_present_tardy = sum(1 for r in all_records_in_same_classes if r.status in ["presente", "tardanza"])
        group_average = round((total_class_present_tardy / max(1, total_class_records))
                              * 100) if total_class_records > 0 else 0

    history = []
    for r in records:
        history.append({
            "class_name": r.attendance_class.name,
            "date": r.attendance_class.date,
            "start_time": r.attendance_class.start_time,
            "status": r.status,
            "registered_at": r.registered_at.isoformat() if r.registered_at else None,
            "scan_type": r.scan_type
        })

    # Sort history by date descending
    history.sort(key=lambda x: x["date"], reverse=True)

    return {
        "student_id": student.id,
        "student_name": student.full_name or student.username,
        "stats": {
            "total": total,
            "present": present,
            "tardy": tardy,
            "absent": absent,
            "rate": round(((present + tardy) / max(1, total)) * 100) if total > 0 else 0,
            "group_average": group_average or 78  # fallback baseline avg
        },
        "history": history
    }


@router.get("/my/stats")
async def get_my_own_attendance_stats(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """Allows a student to view their own attendance history and stats."""
    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == current_user_id).all()

    total = len(records)
    present = sum(1 for r in records if r.status == "presente")
    tardy = sum(1 for r in records if r.status == "tardanza")
    absent = sum(1 for r in records if r.status == "falta")

    class_ids = [r.class_id for r in records]
    group_average = 0
    if class_ids:
        all_records_in_same_classes = db.query(AttendanceRecord).filter(AttendanceRecord.class_id.in_(class_ids)).all()
        total_class_records = len(all_records_in_same_classes)
        total_class_present_tardy = sum(1 for r in all_records_in_same_classes if r.status in ["presente", "tardanza"])
        group_average = round((total_class_present_tardy / max(1, total_class_records))
                              * 100) if total_class_records > 0 else 0

    history = []
    for r in records:
        history.append({
            "class_name": r.attendance_class.name,
            "date": r.attendance_class.date,
            "start_time": r.attendance_class.start_time,
            "status": r.status,
            "registered_at": r.registered_at.isoformat() if r.registered_at else None,
            "scan_type": r.scan_type
        })

    history.sort(key=lambda x: x["date"], reverse=True)

    return {
        "stats": {
            "total": total,
            "present": present,
            "tardy": tardy,
            "absent": absent,
            "rate": round(((present + tardy) / max(1, total)) * 100) if total > 0 else 0,
            "group_average": group_average or 75
        },
        "history": history
    }
