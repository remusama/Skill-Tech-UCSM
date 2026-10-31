"""Servicio para operaciones de usuario y eliminación en cascada.

Permite eliminar de forma íntegra y segura todas las relaciones asociadas
a un usuario en la base de datos (sesiones, diagnósticos, historial, habilidades,
grupos, exámenes, registros de asistencia y economía MYL).
"""

import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
import bcrypt

from server_py.memoria.database import User

logger = logging.getLogger(__name__)


def delete_user_account(db: Session, user_identifier: int | str, username: str | None = None, email: str | None = None) -> dict:
    """Elimina COMPLETAMENTE un usuario y TODOS sus registros vinculados:
    Limpia todas las foreign keys descubiertas en Supabase antes de eliminar la fila en users.
    """
    user = None
    # 1. Buscar por ID numérico si es posible
    try:
        u_id = int(user_identifier)
        user = db.query(User).filter(User.id == u_id).first()
    except (ValueError, TypeError):
        pass

    # 2. Si no se encontró por ID, buscar por username
    if not user and username:
        user = db.query(User).filter(User.username == username).first()

    # 3. Si no se encontró por username, buscar por email
    if not user and email:
        user = db.query(User).filter(User.email == email).first()

    # 4. Fallback: buscar user_identifier como string en username o email
    if not user and isinstance(user_identifier, str):
        user = db.query(User).filter(
            (User.username == user_identifier) | (User.email == user_identifier)
        ).first()

    if not user:
        logger.warning(f"delete_user_account: no se encontró usuario con identificador={user_identifier}, username={username}, email={email}")
        return {}

    target_uid = int(user.id)
    target_uname = user.username
    logger.info(f"Iniciando purga TOTAL en cascada del usuario ID={target_uid} ({target_uname})")

    purged = {"user_id": target_uid, "username": target_uname}

    # Ejecutar en una única transacción atómica para que sea consistente
    try:
        # Hijas de learning_journeys
        db.execute(text("DELETE FROM journey_sessions WHERE journey_id IN (SELECT id FROM learning_journeys WHERE user_id = :uid)"), {"uid": target_uid})
        # Hijas de mentor_exams / mentor_exam_assignments
        db.execute(text("DELETE FROM mentor_exam_answers WHERE assignment_id IN (SELECT id FROM mentor_exam_assignments WHERE student_id = :uid)"), {"uid": target_uid})
        db.execute(text("DELETE FROM mentor_exam_questions WHERE exam_id IN (SELECT id FROM mentor_exams WHERE mentor_id = :uid)"), {"uid": target_uid})
        db.execute(text("DELETE FROM mentor_exam_assignments WHERE student_id = :uid OR exam_id IN (SELECT id FROM mentor_exams WHERE mentor_id = :uid)"), {"uid": target_uid})

        # Relaciones directas
        direct_tables = [
            "chat_messages",
            "eleonor_history",
            "eleonor_sessions",
            "user_skills",
            "exam_results",
            "practical_timeline_snapshots",
            "learning_journeys",
            "attendance_records",
            "attendance_classes",
            "mentor_group_students",
            "mentor_groups",
            "mentor_exams",
            "memory_assets",
            "myl_ledger_entries",
            "myl_active_impulses",
            "myl_order_contributions",
        ]
        for tbl in direct_tables:
            try:
                db.execute(text(f"DELETE FROM {tbl} WHERE user_id = :uid"), {"uid": target_uid})
            except Exception:
                pass
            try:
                db.execute(text(f"DELETE FROM {tbl} WHERE student_id = :uid"), {"uid": target_uid})
            except Exception:
                pass
            try:
                db.execute(text(f"DELETE FROM {tbl} WHERE mentor_id = :uid"), {"uid": target_uid})
            except Exception:
                pass
            try:
                db.execute(text(f"DELETE FROM {tbl} WHERE uploader_id = :uid"), {"uid": target_uid})
            except Exception:
                pass

        # P2P orders (tanto vendedor como comprador)
        db.execute(text("DELETE FROM myl_p2p_orders WHERE seller_user_id = :uid OR buyer_user_id = :uid"), {"uid": target_uid})

        # Desvincular agents creator
        db.execute(text("UPDATE agents SET creator_id = NULL WHERE creator_id = :uid"), {"uid": target_uid})

        # Tablas auxiliares opcionales
        try:
            db.execute(text("DELETE FROM ponencias_preguntas WHERE user_id = :uid"), {"uid": str(target_uid)})
        except Exception:
            pass

        # Finalmente, eliminar el usuario
        res = db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": target_uid})
        db.commit()
        purged["users_deleted"] = res.rowcount if hasattr(res, "rowcount") else 1
        logger.info(f"Purga exitosa para ID={target_uid}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error purgando usuario {target_uid}: {e}")
        raise e

    return purged
