import datetime
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload, selectinload

from server_py.auth.router import get_current_user_id
from server_py.memoria.database import User, get_db
from server_py.mentoria.models import AttendanceClass, AttendanceRecord, GroupStudent

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

# ============================================================================
# FUNCIONES DE APOYO Y AUTORIZACIÓN
# ============================================================================

def check_is_mentor(user_id: int, db: Session):
    """Verifica que el usuario exista y posea privilegios administrativos o de docencia.

    Raises:
        HTTPException: 404 si el usuario no existe, 403 si carece de permisos.
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


def generate_secure_token() -> str:
    """Genera una credencial única formateada para alumnos."""
    return f"SKILL-{uuid.uuid4().hex[:12].upper()}"

# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class CreateClassRequest(BaseModel):
    name: str = Field(..., description="Nombre de la asignatura o sesión")
    group_id: Optional[int] = Field(None, description="ID del grupo de estudiantes asignado")
    date: str = Field(..., description="Fecha de la clase en formato YYYY-MM-DD")
    start_time: str = Field(..., description="Hora de inicio en formato HH:MM")
    late_time: str = Field(..., description="Hora límite para marcar presente (HH:MM)")


class ScanRequest(BaseModel):
    class_code: str = Field(..., description="Código único de la clase")
    secure_token: str = Field(..., description="Token de credencial QR/NFC del estudiante")
    scan_type: str = Field(..., description="Método de escaneo utilizado ('qr' o 'nfc')")

# ============================================================================
# ENDPOINTS: GESTIÓN DE CLASES Y ASISTENCIA (DOCENTES / MENTORES)
# ============================================================================

@router.post("/classes", status_code=status.HTTP_201_CREATED)
async def create_attendance_class(
    req: CreateClassRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Crea una nueva sesión de clase y genera automáticamente los registros
    iniciales en estado 'falta' para todos los miembros del grupo asignado.
    """
    check_is_mentor(current_user_id, db)
    class_code = f"CLASS-{uuid.uuid4().hex[:6].upper()}"

    try:
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
        db.flush()  # Asigna el ID a new_class sin confirmar la transacción completa

        # Inicialización en lote de asistencias si la clase pertenece a un grupo
        if req.group_id:
            group_students = db.query(GroupStudent).filter(
                GroupStudent.group_id == req.group_id
            ).all()

            records = [
                AttendanceRecord(
                    class_id=new_class.id,
                    student_id=gs.student_id,
                    status="falta",
                    registered_at=None,
                    scan_type=None
                )
                for gs in group_students
            ]
            db.bulk_save_objects(records)

        db.commit()
        db.refresh(new_class)

        return {
            "message": "Clase creada exitosamente.",
            "class_id": new_class.id,
            "code": class_code
        }
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear la clase de asistencia: {str(error)}"
        )


@router.get("/classes")
async def get_attendance_classes(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Obtiene el historial de clases registradas con sus métricas consolidadas."""
    check_is_mentor(current_user_id, db)

    classes = (
        db.query(AttendanceClass)
        .options(
            joinedload(AttendanceClass.group),
            selectinload(AttendanceClass.records)
        )
        .order_by(AttendanceClass.created_at.desc())
        .all()
    )

    result = []
    for c in classes:
        total_students = len(c.records)
        present = sum(1 for r in c.records if r.status == "presente")
        tardy = sum(1 for r in c.records if r.status == "tardanza")
        absent = sum(1 for r in c.records if r.status == "falta")

        attendance_rate = (
            round(((present + tardy) / max(1, total_students)) * 100)
            if total_students > 0 else 0
        )

        result.append({
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "group_id": c.group_id,
            "group_name": c.group.name if c.group else "Sin Grupo",
            "date": c.date,
            "start_time": c.start_time,
            "late_time": c.late_time,
            "is_active": c.is_active,
            "stats": {
                "total": total_students,
                "present": present,
                "tardy": tardy,
                "absent": absent,
                "rate": attendance_rate
            }
        })

    return result


@router.get("/classes/{class_id}")
async def get_class_details(
    class_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Retorna el detalle detallado de la lista de asistencia para una clase específica."""
    check_is_mentor(current_user_id, db)

    c = (
        db.query(AttendanceClass)
        .options(
            joinedload(AttendanceClass.group),
            selectinload(AttendanceClass.records).joinedload(AttendanceRecord.student)
        )
        .filter(AttendanceClass.id == class_id)
        .first()
    )

    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase no encontrada."
        )

    records = [
        {
            "id": r.id,
            "student_id": r.student_id,
            "student_name": r.student.full_name or r.student.username if r.student else "Desconocido",
            "student_username": r.student.username if r.student else "N/A",
            "status": r.status,
            "registered_at": r.registered_at.isoformat() if r.registered_at else None,
            "scan_type": r.scan_type
        }
        for r in c.records
    ]

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
async def scan_attendance(
    req: ScanRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Procesa la lectura QR o NFC realizada por el mentor y actualiza la asistencia del estudiante."""
    check_is_mentor(current_user_id, db)

    # Validar existencia de clase y estado activo
    c = db.query(AttendanceClass).filter(AttendanceClass.code == req.class_code).first()
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase no encontrada con el código proporcionado."
        )
    if not c.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La sesión de asistencia para esta clase está cerrada."
        )

    # Identificar estudiante mediante la credencial escaneada
    student = db.query(User).filter(User.secure_token == req.secure_token).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código de credencial QR/NFC inválido."
        )

    # Verificar pertenencia al grupo
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

    # Determinar si el registro ocurre dentro del tiempo límite
    now = datetime.datetime.now()
    current_time_str = now.strftime("%H:%M")
    status_attendance = "tardanza" if current_time_str > c.late_time else "presente"

    # Buscar registro existente o crear uno nuevo
    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.class_id == c.id,
        AttendanceRecord.student_id == student.id
    ).first()

    student_display_name = student.full_name or student.username

    if record:
        if record.status in ["presente", "tardanza"]:
            return {
                "message": "El estudiante ya había registrado su asistencia previamente.",
                "student_name": student_display_name,
                "status": record.status,
                "registered_at": record.registered_at.isoformat() if record.registered_at else None
            }
        record.status = status_attendance
        record.registered_at = now
        record.scan_type = req.scan_type
    else:
        record = AttendanceRecord(
            class_id=c.id,
            student_id=student.id,
            status=status_attendance,
            registered_at=now,
            scan_type=req.scan_type
        )
        db.add(record)

    db.commit()

    return {
        "message": "Asistencia registrada correctamente.",
        "student_name": student_display_name,
        "status": status_attendance,
        "registered_at": now.isoformat()
    }

# ============================================================================
# ENDPOINTS: CREDENTIALLING & TOKENS (ESTUDIANTES)
# ============================================================================

@router.get("/student/token")
async def get_student_token(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Consulta la credencial segura del estudiante autenticado (genera una si no existe)."""
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    if not user.secure_token:
        user.secure_token = f"SKILL-{uuid.uuid4().hex[:12].upper()}"
        db.commit()
        db.refresh(user)

    return {"token": user.secure_token}


@router.post("/student/regenerate_token")
async def regenerate_student_token(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Invalida la credencial previa y genera una nueva para el estudiante autenticado."""
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    user.secure_token = f"SKILL-{uuid.uuid4().hex[:12].upper()}"
    db.commit()
    db.refresh(user)

    return {
        "token": user.secure_token,
        "message": "Credencial regenerada exitosamente."
    }


@router.get("/student/{student_id}/token")
async def get_any_student_token(
    student_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Permite a un mentor obtener el token de cualquier estudiante."""
    check_is_mentor(current_user_id, db)
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    if not user.secure_token:
        user.secure_token = f"SKILL-{uuid.uuid4().hex[:12].upper()}"
        db.commit()
        db.refresh(user)

    return {"token": user.secure_token}

# ============================================================================
# ENDPOINTS: ESTADÍSTICAS E HISTORIAL
# ============================================================================

def calculate_student_stats(records: List[AttendanceRecord], db: Session):
    """Función auxiliar para procesar totales, porcentajes y promedios comparativos."""
    total = len(records)
    present = sum(1 for r in records if r.status == "presente")
    tardy = sum(1 for r in records if r.status == "tardanza")
    absent = sum(1 for r in records if r.status == "falta")
    
    rate = round(((present + tardy) / max(1, total)) * 100) if total > 0 else 0

    class_ids = [r.class_id for r in records if r.class_id]
    group_average = 0

    if class_ids:
        all_records = db.query(AttendanceRecord).filter(
            AttendanceRecord.class_id.in_(class_ids)
        ).all()
        
        total_class_records = len(all_records)
        total_class_attended = sum(1 for r in all_records if r.status in ["presente", "tardanza"])
        
        if total_class_records > 0:
            group_average = round((total_class_attended / total_class_records) * 100)

    history = [
        {
            "class_name": r.attendance_class.name if r.attendance_class else "Clase Eliminada",
            "date": r.attendance_class.date if r.attendance_class else "N/A",
            "start_time": r.attendance_class.start_time if r.attendance_class else "N/A",
            "status": r.status,
            "registered_at": r.registered_at.isoformat() if r.registered_at else None,
            "scan_type": r.scan_type
        }
        for r in records
    ]
    history.sort(key=lambda x: x["date"], reverse=True)

    return {
        "stats": {
            "total": total,
            "present": present,
            "tardy": tardy,
            "absent": absent,
            "rate": rate,
            "group_average": group_average or 75
        },
        "history": history
    }

@router.get("/student/{student_id}/stats")
async def get_student_attendance_stats(
    student_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Métricas históricas de un estudiante específico vistas por un mentor."""
    check_is_mentor(current_user_id, db)

    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado."
        )

    records = (
        db.query(AttendanceRecord)
        .options(joinedload(AttendanceRecord.attendance_class))
        .filter(AttendanceRecord.student_id == student_id)
        .all()
    )

    data = calculate_student_stats(records, db)
    return {
        "student_id": student.id,
        "student_name": student.full_name or student.username,
        **data
    }


@router.get("/my/stats")
async def get_my_own_attendance_stats(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Permite al estudiante autenticado visualizar sus propias métricas e historial de asistencias."""
    records = (
        db.query(AttendanceRecord)
        .options(joinedload(AttendanceRecord.attendance_class))
        .filter(AttendanceRecord.student_id == current_user_id)
        .all()
    )
    return calculate_student_stats(records, db)