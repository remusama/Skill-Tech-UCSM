"""Adaptador entre el estado en memoria y las sesiones almacenadas en BD.

La fuente de estado se selecciona mediante la configuración
ENABLE_DB_SESSION. Cuando está desactivada, se utiliza el estado global
heredado en memoria. Cuando está activada, se utiliza EleonorSession
mediante una sesión de SQLAlchemy.
"""

import datetime

from server_py.config import settings
from server_py.core.structured_logger import get_logger

logger = get_logger("state_adapter")


# Funciones auxiliares para trabajar con la base de datos.


def _get_session_from_db(db, user_id: int):
    """Obtiene o crea la sesión de Eleonor asociada a un usuario."""

    from server_py.memoria.database import EleonorSession

    session = (
        db.query(EleonorSession)
        .filter(EleonorSession.user_id == user_id)
        .first()
    )
    if not session:
        session = EleonorSession(
            id=f"sess_{user_id}",
            user_id=user_id,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    return session


def _session_to_dict(session) -> dict:
    """Convierte una sesión de SQLAlchemy en un diccionario de estado."""
    return {
        "valence": session.valence,
        "tension": session.tension,
        "engagement": session.engagement,
        "boundary": session.boundary,
    }


# Funciones auxiliares para trabajar con el estado en memoria.


def _get_session_from_memory(user_id: int) -> dict:
    """Obtiene el estado global heredado almacenado en memoria.

    El parámetro user_id se conserva por compatibilidad, pero el estado
    heredado actualmente es compartido entre usuarios.
    """

    from server_py.memoria import state

    return {
        "valence": state.eleonor_state.get("valence", "neutra"),
        "tension": state.eleonor_state.get("tension", 0.5),
        "engagement": state.eleonor_state.get("engagement", 0.5),
        "boundary": state.eleonor_boundary,
    }


def _update_session_in_memory(user_id: int, updates: dict) -> None:
    """Actualiza el estado global heredado almacenado en memoria."""

    from server_py.memoria import state

    if "valence" in updates:
        state.eleonor_state["valence"] = updates["valence"]
    if "tension" in updates:
        state.eleonor_state["tension"] = updates["tension"]
    if "engagement" in updates:
        state.eleonor_state["engagement"] = updates["engagement"]
    if "boundary" in updates:
        state.eleonor_boundary = updates["boundary"]


# API pública del adaptador.


def get_session(user_id: int, db=None) -> dict:
    """Obtiene el estado de sesión correspondiente al usuario.

    La fuente de datos depende de ENABLE_DB_SESSION. Si la base de datos
    está habilitada pero no se proporciona una sesión, se utiliza el
    estado en memoria como mecanismo de compatibilidad.
    """
    if settings.ENABLE_DB_SESSION:
        if db is None:
            logger.error(
                "get_session: DB mode enabled but no db session provided."
            )
            return _get_session_from_memory(user_id)
        try:
            session = _get_session_from_db(db, user_id)
            logger.info(
                "get_session: Loaded session from DB for user %s",
                user_id,
            )
            return _session_to_dict(session)
        except Exception as error:
            logger.error(
                "get_session: DB read failed for user %s. "
                "Falling back to memory. Error: %s",
                user_id,
                error,
            )
            return _get_session_from_memory(user_id)

    logger.info(
        "get_session: Using in-memory fallback for user %s",
        user_id,
    )
    return _get_session_from_memory(user_id)


def update_session(user_id: int, updates: dict, db=None) -> None:
    """Actualiza el estado de sesión correspondiente al usuario.

    La fuente de persistencia depende de ENABLE_DB_SESSION. El diccionario
    updates puede contener los campos de estado admitidos por la
    implementación actual: valence, tension, engagement y boundary.
    """
    if settings.ENABLE_DB_SESSION:
        if db is None:
            logger.error(
                "update_session: DB mode enabled but no db session provided."
            )
            _update_session_in_memory(user_id, updates)
            return
        try:
            session = _get_session_from_db(db, user_id)
            for key, value in updates.items():
                if hasattr(session, key):
                    setattr(session, key, value)
            session.last_updated = datetime.datetime.utcnow()
            db.commit()
            logger.info(
                "update_session: Committed DB update for user %s: %s",
                user_id,
                list(updates.keys()),
            )
        except Exception as error:
            logger.error(
                "update_session: DB write failed for user %s. "
                "Falling back to memory. Error: %s",
                user_id,
                error,
            )
            _update_session_in_memory(user_id, updates)
            return

    else:
        logger.info(
            "update_session: Writing in-memory fallback for user %s",
            user_id,
        )
        _update_session_in_memory(user_id, updates)
