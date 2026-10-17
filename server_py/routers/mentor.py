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
            User.email,
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
            "email": s.email,
            "top_skill": top_skill,
            "average_level": avg_level,
            "completed_exams": list(completed_exams_map.get(s.id, []))
        })
    return result


OFFICIAL_HOUSES_DATA = [
    {
        "name": "Equipo APEX",
        "description": "Excelencia y Liderazgo Estratégico",
        "students": [
            ("Alyce Nayeli Valdivia Sanz", "alyce.valdivia@liderazgo.ucsm.pe", "Liderazgo Directivo", 4.9),
            ("Brescia Avril Oviedo Rodríguez", "brescia.oviedo@liderazgo.ucsm.pe", "Planificación Estratégica", 4.7),
            ("César Alejandro Campos García", "cesar.campos@liderazgo.ucsm.pe", "Toma de Decisiones", 4.6),
            ("Daniel Elías Zapana Daza", "daniel.zapana@liderazgo.ucsm.pe", "Gestión de Recursos", 4.5),
            ("Fernanda Josselyn Rodríguez Del Carpio", "fernanda.rodriguez@liderazgo.ucsm.pe", "Negociación Cuantitativa", 4.8),
            ("Keith Vladimir Chura Díaz", "keith.chura@liderazgo.ucsm.pe", "Optimización de Procesos", 4.6),
            ("Lucas Adriel Bustamante Mena", "lucas.bustamante@liderazgo.ucsm.pe", "Pensamiento Analítico", 4.7),
            ("Luciana Castillo Álvarez", "luciana.castillo@liderazgo.ucsm.pe", "Liderazgo Ejecutivo", 4.9),
            ("María José Limazca Quispe", "maria.limazca@liderazgo.ucsm.pe", "Resolución Táctica", 4.5),
            ("Mariel Dayana Millio Mendoza", "mariel.millio@liderazgo.ucsm.pe", "Control de Calidad", 4.6),
            ("Ruth Evelyn Calli Choqque", "ruth.calli@liderazgo.ucsm.pe", "Gestión del Rendimiento", 4.8),
            ("Stephano Samuel Pinto Rivera", "stephano.pinto@liderazgo.ucsm.pe", "Dirección Operativa", 4.7),
        ]
    },
    {
        "name": "Equipo IGNIS",
        "description": "Pasión, Acción y Transformación",
        "students": [
            ("Dalessandra Cuervo Quispe", "dalessandra.cuervo@liderazgo.ucsm.pe", "Iniciativa y Emprendimiento", 4.8),
            ("Diana Sophia Chichizola Bustamante", "diana.chichizola@liderazgo.ucsm.pe", "Innovación Disruptiva", 4.7),
            ("Edgar Miranda Ccolqque", "edgar.miranda@liderazgo.ucsm.pe", "Resiliencia Emocional", 4.6),
            ("Fabricio André Espinoza Santander", "fabricio.espinoza@liderazgo.ucsm.pe", "Persuasión y Oratoria", 4.9),
            ("Gloria Mía Isabel Callenova Caceres", "gloria.callenova@liderazgo.ucsm.pe", "Motivación e Impulso", 4.7),
            ("James Stephano Alejandro Cosi Rosello", "james.cosi@liderazgo.ucsm.pe", "Energía y Dinamismo", 4.6),
            ("Juan Francisco Herrera Vargas", "juan.herrera@liderazgo.ucsm.pe", "Proactividad Radical", 4.8),
            ("Mariajosé Talavera Cárdenas", "mariajose.talavera@liderazgo.ucsm.pe", "Liderazgo Inspiracional", 4.9),
            ("Piero Alexander Silvestre Gutierrez", "piero.silvestre@liderazgo.ucsm.pe", "Agilidad en el Cambio", 4.5),
            ("Rubí Alexandra Contreras Villarroel", "rubi.contreras@liderazgo.ucsm.pe", "Resolución en Crisis", 4.7),
            ("Sashenka Sofie Bernedo Ccanccapa", "sashenka.bernedo@liderazgo.ucsm.pe", "Mentalidad de Crecimiento", 4.8),
            ("Stefano López Flores", "stefano.lopez@liderazgo.ucsm.pe", "Fuerza Ejecutora", 4.6),
        ]
    },
    {
        "name": "Equipo NEXUS",
        "description": "Conexión, Sinergia e Integración",
        "students": [
            ("Camila Yamileth Beltrán Huanca", "camila.beltran@liderazgo.ucsm.pe", "Trabajo en Equipo", 4.8),
            ("Cristel Xiomara Umiyauri Huaylla", "cristel.umiyauri@liderazgo.ucsm.pe", "Comunicación Asertiva", 4.9),
            ("Denis Arturo Yana Palazuelos", "denis.yana@liderazgo.ucsm.pe", "Cohesión Grupal", 4.7),
            ("Edison Omar Amanqui Galarza", "edison.amanqui@liderazgo.ucsm.pe", "Sinergia Colaborativa", 4.8),
            ("Ikerzon Herbeth Quispe Choquepuma", "ikerzon.quispe@liderazgo.ucsm.pe", "Gestión de Mediación", 4.6),
            ("Jimena Isabel Luque Berroa", "jimena.luque@liderazgo.ucsm.pe", "Empatía e Inclusión", 4.9),
            ("José Manuel Flor Cruz", "jose.flor@liderazgo.ucsm.pe", "Articulación Interpersonal", 4.7),
            ("Julio Gabriel Rodríguez Valdivia", "julio.rodriguez@liderazgo.ucsm.pe", "Resolución de Conflictos", 4.8),
            ("Nadieshda Mariana Flores Barriga", "nadieshda.flores@liderazgo.ucsm.pe", "Facilitación Dialogal", 4.9),
            ("Rodrigo Jhonatan Agüero Condori", "rodrigo.aguero@liderazgo.ucsm.pe", "Inteligencia Social", 4.6),
            ("Sheyla Saida Arqque Quispe", "sheyla.arqque@liderazgo.ucsm.pe", "Construcción de Confianza", 4.7),
            ("Sonia Lazarte Arredondo", "sonia.lazarte@liderazgo.ucsm.pe", "Sinergia de Equipos", 4.8),
        ]
    },
    {
        "name": "Equipo VISIO",
        "description": "Pensamiento Crítico y Visión de Futuro",
        "students": [
            ("Arjum Jhostim Sarayasi Huarilloclla", "arjum.sarayasi@liderazgo.ucsm.pe", "Anticipación Prospectiva", 4.7),
            ("Claudia Velasco Quispe", "claudia.velasco@liderazgo.ucsm.pe", "Diseño de Futuros", 4.8),
            ("Daniela Valeriano Ramos", "daniela.valeriano@liderazgo.ucsm.pe", "Visión Estratégica", 4.9),
            ("Franco Cruz Abado", "franco.cruz@liderazgo.ucsm.pe", "Pensamiento Complejo", 4.7),
            ("Javier Zavaleta Gutierrez", "javier.zavaleta@liderazgo.ucsm.pe", "Modelado Conceptual", 4.6),
            ("Karelia Axde Delgado Cornejo", "karelia.delgado@liderazgo.ucsm.pe", "Creatividad Prospectiva", 4.8),
            ("Kiara Yasumy Zapata Pocco", "kiara.zapata@liderazgo.ucsm.pe", "Análisis Sistémico", 4.9),
            ("Matías José Arteaga Espinoza", "matias.arteaga@liderazgo.ucsm.pe", "Prospectiva Tecnológica", 4.7),
            ("Nurit Tatiana Castro Cuela", "nurit.castro@liderazgo.ucsm.pe", "Pensamiento Crítico", 4.9),
            ("Paolo Del Piero Hernani Delgado", "paolo.hernani@liderazgo.ucsm.pe", "Innovación Social", 4.8),
            ("Piero Farith Vega Baca", "piero.vega@liderazgo.ucsm.pe", "Criterio de Evaluación", 4.6),
            ("Ricardo Enrique Rondón Pacheco", "ricardo.rondon@liderazgo.ucsm.pe", "Abstracción Lógica", 4.7),
        ]
    }
]


def _ensure_house_teams(db: Session, current_user_id: Optional[int] = None):
    """
    Garantiza que los 4 equipos de las casas existan en la base de datos (tanto local como producción).
    Si no estaban creados, se crean en un if con sus 12 estudiantes oficiales.
    """
    house_names = [h["name"] for h in OFFICIAL_HOUSES_DATA]
    existing = db.query(MentorGroup).filter(MentorGroup.name.in_(house_names)).all()

    # Si faltan equipos de las casas, los creamos automáticamente en este if
    if len(existing) < len(house_names):
        teacher_id = current_user_id
        if not teacher_id:
            teacher = db.query(User).filter(User.role.in_(["teacher", "admin", "mentor"])).first()
            teacher_id = teacher.id if teacher else 1

        existing_map = {g.name: g for g in existing}

        for h in OFFICIAL_HOUSES_DATA:
            if h["name"] not in existing_map:
                try:
                    new_group = MentorGroup(
                        mentor_id=teacher_id,
                        name=h["name"],
                        description=h["description"]
                    )
                    db.add(new_group)
                    db.commit()
                    db.refresh(new_group)
                    existing_map[h["name"]] = new_group

                    for student_name, email, skill, level in h["students"]:
                        prefix = email.split("@")[0].lower()
                        student = db.query(User).filter(
                            (User.email.ilike(email)) | (User.username.ilike(prefix))
                        ).first()

                        if student:
                            existing_link = db.query(GroupStudent).filter(
                                GroupStudent.group_id == new_group.id,
                                GroupStudent.student_id == student.id
                            ).first()
                            if not existing_link:
                                db.add(GroupStudent(group_id=new_group.id, student_id=student.id))

                            if not student.full_name or student.full_name == student.username:
                                student.full_name = student_name

                            existing_skill = db.query(UserSkill).filter(
                                UserSkill.user_id == student.id,
                                UserSkill.area == skill
                            ).first()
                            if not existing_skill:
                                db.add(UserSkill(
                                    user_id=student.id,
                                    area=skill,
                                    level=level,
                                    score_tri=level * 20.0
                                ))
                    db.commit()
                except Exception as ex:
                    db.rollback()
                    print(f"Error inicializando casa {h['name']}: {ex}")

    # Verificar si algún grupo existente no tiene sus estudiantes vinculados
    for g in db.query(MentorGroup).filter(MentorGroup.name.in_(house_names)).all():
        student_count = db.query(GroupStudent).filter(GroupStudent.group_id == g.id).count()
        if student_count < 12:
            house_data = next((h for h in OFFICIAL_HOUSES_DATA if h["name"] == g.name), None)
            if house_data:
                try:
                    for student_name, email, skill, level in house_data["students"]:
                        prefix = email.split("@")[0].lower()
                        student = db.query(User).filter(
                            (User.email.ilike(email)) | (User.username.ilike(prefix))
                        ).first()
                        if student:
                            existing_link = db.query(GroupStudent).filter(
                                GroupStudent.group_id == g.id,
                                GroupStudent.student_id == student.id
                            ).first()
                            if not existing_link:
                                db.add(GroupStudent(group_id=g.id, student_id=student.id))
                            if not student.full_name or student.full_name == student.username:
                                student.full_name = student_name
                    db.commit()
                except Exception as ex:
                    db.rollback()
                    print(f"Error vinculando estudiantes a {g.name}: {ex}")


def _detect_house(name: str) -> Optional[str]:
    name_upper = (name or "").upper()
    for h in ["APEX", "IGNIS", "NEXUS", "VISIO"]:
        if h in name_upper:
            return h
    return None


@router.get("/groups")
def get_mentor_groups(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Todos los mentores comparten la misma base de datos de grupos de estudiantes."""
    check_is_mentor(current_user_id, db)
    _ensure_house_teams(db, current_user_id)

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
            "house": _detect_house(g.name),
            "created_at": g.created_at.isoformat() if g.created_at else None,
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
            User.email,
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
            "email": s.email,
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
    if area == "liderazgo_ccl":
        area_filter = ExamResult.area.in_(["liderazgo_ccl", "ccl"])
    elif area == "personalidad_neo":
        area_filter = ExamResult.area.in_(["personalidad_neo", "neo-pi-r", "neo_pi_r", "personalidad"])
    else:
        area_filter = ExamResult.area == area

    results = (
        db.query(
            ExamResult.user_id,
            ExamResult.score,
            ExamResult.data,
            ExamResult.timestamp,
        )
        .filter(
            ExamResult.user_id.in_(student_ids),
            area_filter,
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