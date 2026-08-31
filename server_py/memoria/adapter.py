"""
State Adapter (PR C) — Safe bridge between legacy in-memory state and DB-backed EleonorSession.

Controls via config.ENABLE_DB_SESSION:
  - False (default): falls back to reading/writing the legacy state.py dicts (safe for development).
  - True:  reads/writes the DB EleonorSession row for the given user_id (production-ready).

This allows a canary deploy: enable ENABLE_DB_SESSION=true in staging only, while
production still uses the in-memory fallback until fully validated.
"""
from server_py.config import settings
from server_py.core.structured_logger import get_logger

logger = get_logger("state_adapter")


# ─────────────────────────────────────────────────────────────────────────────
# DB-backed helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_session_from_db(db, user_id: int):
    """Fetch or create an EleonorSession row for the user."""
    from server_py.memoria.database import EleonorSession
    session = db.query(EleonorSession).filter(EleonorSession.user_id == user_id).first()
    if not session:
        session = EleonorSession(id=f"sess_{user_id}", user_id=user_id)
        db.add(session)
        db.commit()
        db.refresh(session)
    return session


def _session_to_dict(session) -> dict:
    """Map SQLAlchemy EleonorSession to a plain dict (same shape as legacy state)."""
    return {
        "valence": session.valence,
        "tension": session.tension,
        "engagement": session.engagement,
        "boundary": session.boundary,
    }


# ─────────────────────────────────────────────────────────────────────────────
# In-memory fallback helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_session_from_memory(user_id: int) -> dict:
    """Read the legacy global state — user_id is ignored as state is global."""
    from server_py.memoria import state
    return {
        "valence": state.eleonor_state.get("valence", "neutra"),
        "tension": state.eleonor_state.get("tension", 0.5),
        "engagement": state.eleonor_state.get("engagement", 0.5),
        "boundary": state.eleonor_boundary,
    }


def _update_session_in_memory(user_id: int, updates: dict) -> None:
    """Write back to legacy global state dicts."""
    from server_py.memoria import state
    if "valence" in updates:
        state.eleonor_state["valence"] = updates["valence"]
    if "tension" in updates:
        state.eleonor_state["tension"] = updates["tension"]
    if "engagement" in updates:
        state.eleonor_state["engagement"] = updates["engagement"]
    if "boundary" in updates:
        state.eleonor_boundary = updates["boundary"]


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def get_session(user_id: int, db=None) -> dict:
    """
    Return session state dict for user_id.
    Routes to DB or in-memory fallback according to ENABLE_DB_SESSION flag.
    """
    if settings.ENABLE_DB_SESSION:
        if db is None:
            logger.error("get_session: DB mode enabled but no db session provided.")
            return _get_session_from_memory(user_id)
        try:
            session = _get_session_from_db(db, user_id)
            logger.info(f"get_session: Loaded session from DB for user {user_id}")
            return _session_to_dict(session)
        except Exception as e:
            logger.error(f"get_session: DB read failed for user {user_id}, falling back to memory. Error: {e}")
            return _get_session_from_memory(user_id)
    else:
        logger.info(f"get_session: Using in-memory fallback for user {user_id}")
        return _get_session_from_memory(user_id)


def update_session(user_id: int, updates: dict, db=None) -> None:
    """
    Persist session state updates for user_id.
    Routes to DB or in-memory fallback according to ENABLE_DB_SESSION flag.
    updates dict keys: valence, tension, engagement, boundary (all optional).
    """
    if settings.ENABLE_DB_SESSION:
        if db is None:
            logger.error("update_session: DB mode enabled but no db session provided.")
            _update_session_in_memory(user_id, updates)
            return
        try:
            import datetime
            session = _get_session_from_db(db, user_id)
            for key, value in updates.items():
                if hasattr(session, key):
                    setattr(session, key, value)
            session.last_updated = datetime.datetime.utcnow()
            db.commit()
            logger.info(f"update_session: Committed DB update for user {user_id}: {list(updates.keys())}")
        except Exception as e:
            logger.error(f"update_session: DB write failed for user {user_id}, falling back to memory. Error: {e}")
            _update_session_in_memory(user_id, updates)
    else:
        logger.info(f"update_session: Writing in-memory fallback for user {user_id}")
        _update_session_in_memory(user_id, updates)
