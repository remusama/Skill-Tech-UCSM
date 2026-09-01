"""
auto_migrate.py
---------------
Script de migración automática que se ejecuta al iniciar el servidor.
Agrega columnas faltantes a la base de datos sin borrar datos existentes.
Funciona con PostgreSQL (producción/Supabase) y SQLite (desarrollo).
"""
import logging
from sqlalchemy import text
from server_py.memoria.database import engine

logger = logging.getLogger(__name__)


def column_exists_pg(conn, table: str, column: str) -> bool:
    """Verifica si una columna existe en PostgreSQL."""
    result = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.columns "
        "WHERE table_name = :table AND column_name = :column"
    ), {"table": table, "column": column})
    return result.scalar() > 0


def column_exists_sqlite(conn, table: str, column: str) -> bool:
    """Verifica si una columna existe en SQLite."""
    result = conn.execute(text(f"PRAGMA table_info({table})"))
    rows = result.fetchall()
    return any(row[1] == column for row in rows)


def column_exists(conn, table: str, column: str, is_postgres: bool) -> bool:
    if is_postgres:
        return column_exists_pg(conn, table, column)
    return column_exists_sqlite(conn, table, column)


# Definición de todas las migraciones pendientes
MIGRATIONS = [
    # ── Perfil Cognitivo ──────────────────────────────────────────────────
    ("users", "global_cognitive_index", "FLOAT DEFAULT 0.0", "REAL DEFAULT 0.0"),
    ("users", "global_reasoning_vector", "JSONB", "JSON"),
    ("users", "streak_count", "INTEGER DEFAULT 0", "INTEGER DEFAULT 0"),
    ("users", "last_active_at", "TIMESTAMP", "DATETIME"),
    # ── Perfil básico ────────────────────────────────────────────────────
    ("users", "full_name", "VARCHAR", "VARCHAR"),
    ("users", "bio", "VARCHAR", "VARCHAR"),
    ("users", "location", "VARCHAR", "VARCHAR"),
    ("users", "occupation", "VARCHAR", "VARCHAR"),
    ("users", "specialty", "VARCHAR", "VARCHAR"),
    ("users", "phone", "VARCHAR", "VARCHAR"),
    ("users", "website", "VARCHAR", "VARCHAR"),
    ("users", "avatar_url", "VARCHAR", "VARCHAR"),
    # ── Access Control ───────────────────────────────────────────────────
    ("users", "role", "VARCHAR DEFAULT 'student'", "VARCHAR DEFAULT 'student'"),
    ("users", "school", "VARCHAR", "VARCHAR"),
    ("users", "classroom", "VARCHAR", "VARCHAR"),
    ("users", "secure_token", "VARCHAR", "VARCHAR"),
    # ── Preferences ──────────────────────────────────────────────────────
    ("users", "preferences", "JSONB", "JSON"),
    # ── UserSkills extras ────────────────────────────────────────────────
    ("user_skills", "razonamiento_tipo", "VARCHAR", "VARCHAR"),
    ("user_skills", "razonamiento_vector", "JSONB", "JSON"),
    ("user_skills", "metricas_base", "JSONB", "JSON"),
    ("user_skills", "bloom_matrix", "JSONB", "JSON"),
    ("user_skills", "score_tri", "FLOAT", "REAL"),
    ("user_skills", "current_diagnosis", "JSONB", "JSON"),
    ("user_skills", "analytics_baseline", "JSONB", "JSON"),
    # ── ExamResult extras ────────────────────────────────────────────────
    ("exam_results", "csat_score", "INTEGER", "INTEGER"),
    ("exam_results", "rage_clicks", "INTEGER", "INTEGER"),
    ("exam_results", "score_tri", "FLOAT", "REAL"),
    ("mentor_exam_questions", "correct_answer", "VARCHAR", "VARCHAR"),
]


def run_auto_migrations():
    """
    Ejecuta todas las migraciones definidas en MIGRATIONS.
    Se puede llamar de forma segura múltiples veces — solo agrega
    columnas que no existen todavía.
    """
    db_url = str(engine.url)
    is_postgres = db_url.startswith("postgresql") or db_url.startswith("postgres")
    dialect = "PostgreSQL" if is_postgres else "SQLite"
    logger.info(f"[AutoMigrate] Iniciando migraciones automáticas ({dialect})...")

    added = 0
    skipped = 0
    errors = 0

    with engine.connect() as conn:
        for table, column, pg_type, sqlite_type in MIGRATIONS:
            try:
                if column_exists(conn, table, column, is_postgres):
                    skipped += 1
                    continue

                col_type = pg_type if is_postgres else sqlite_type
                sql = f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"
                conn.execute(text(sql))
                conn.commit()
                logger.info(f"[AutoMigrate] OK: {table}.{column} ({col_type}) agregada")
                added += 1

            except Exception as e:
                conn.rollback()
                # Si el error es de columna duplicada, es inofensivo
                err_str = str(e).lower()
                if "duplicate column" in err_str or "already exists" in err_str:
                    skipped += 1
                else:
                    logger.warning(f"[AutoMigrate] WARNING: {table}.{column}: {e}")
                    errors += 1

    logger.info(
        f"[AutoMigrate] Completado — {added} agregadas, {skipped} ya existían, {errors} errores"
    )
