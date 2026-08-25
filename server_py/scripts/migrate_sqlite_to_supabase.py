"""
╔══════════════════════════════════════════════════════════════════════════════╗
║         MIGRACIÓN: SQLite (local) → Supabase/PostgreSQL (producción)        ║
╚══════════════════════════════════════════════════════════════════════════════╝

USO:
    1. Copia tu DATABASE_URL de Supabase (Settings → Database → URI)
    2. Ejecuta desde la raíz del proyecto:
       python -m server_py.scripts.migrate_sqlite_to_supabase

IMPORTANTE:
    - Este script SOLO AGREGA datos, no borra nada en Supabase.
    - Si hay conflictos de IDs, los omite (ON CONFLICT DO NOTHING).
    - Ejecuta SOLO UNA VEZ para migrar datos existentes.
"""

import os
import sys
import sqlite3

# Agregar raíz del proyecto al path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT_DIR)

SQLITE_PATH = os.path.join(ROOT_DIR, "skill_tech_v2.db")


def get_supabase_url() -> str:
    """Obtiene la DATABASE_URL de Supabase desde el entorno."""
    from dotenv import load_dotenv
    load_dotenv(os.path.join(ROOT_DIR, ".env"))
    load_dotenv(os.path.join(ROOT_DIR, ".env.local"))

    url = os.getenv("DATABASE_URL")
    if not url:
        print("❌ ERROR: DATABASE_URL no está definida.")
        print("   Agrega en tu .env.local:")
        print("   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres")
        sys.exit(1)

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    if url.startswith("sqlite"):
        print("❌ ERROR: DATABASE_URL apunta a SQLite, no a Supabase.")
        print("   Asegúrate de tener la URL de PostgreSQL de Supabase en .env.local")
        sys.exit(1)

    return url


def migrate():
    """Migra todas las tablas de SQLite a Supabase/PostgreSQL."""
    import psycopg2
    from psycopg2.extras import execute_values

    print("=" * 70)
    print("  MIGRACIÓN SQLite → Supabase")
    print("=" * 70)

    # ── 1. Verificar que existe el SQLite ─────────────────────────────────
    if not os.path.exists(SQLITE_PATH):
        print(f"❌ No se encontró la BD SQLite en: {SQLITE_PATH}")
        sys.exit(1)

    print(f"✅ SQLite encontrado: {SQLITE_PATH}")

    # ── 2. Conectar a Supabase ────────────────────────────────────────────
    supabase_url = get_supabase_url()
    print(f"✅ Conectando a Supabase...")

    try:
        pg_conn = psycopg2.connect(supabase_url)
        pg_conn.autocommit = False
        pg_cursor = pg_conn.cursor()
        print("✅ Conexión a Supabase exitosa\n")
    except Exception as e:
        print(f"❌ No se pudo conectar a Supabase: {e}")
        sys.exit(1)

    # ── 3. Crear tablas en Supabase (usando los modelos de SQLAlchemy) ────
    print("📦 Creando tablas en Supabase si no existen...")
    from server_py.memoria.database import Base, engine as pg_engine, DATABASE_URL as check_url
    if "sqlite" in check_url:
        print("⚠️  El engine de SQLAlchemy apunta a SQLite.")
        print("   Asegúrate de que DATABASE_URL esté configurada antes de importar.")
    else:
        Base.metadata.create_all(bind=pg_engine)
        print("✅ Tablas verificadas/creadas en Supabase\n")

    # ── 4. Leer datos de SQLite y migrar ─────────────────────────────────
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    # Orden respeta foreign keys
    TABLES = [
        "users",
        "user_skills",
        "exam_results",
        "eleonor_history",
        "chat_messages",
        "eleonor_sessions",
        "learning_journeys",
        "journey_sessions",
    ]

    total_migrated = 0

    for table in TABLES:
        try:
            # Verificar si la tabla existe en SQLite
            sqlite_cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,)
            )
            if not sqlite_cursor.fetchone():
                print(f"⚠️  Tabla '{table}' no existe en SQLite — saltando")
                continue

            sqlite_cursor.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()

            if not rows:
                print(f"  ℹ️  '{table}': vacía — saltando")
                continue

            # Obtener columnas
            columns = [desc[0] for desc in sqlite_cursor.description]
            col_str = ", ".join(f'"{c}"' for c in columns)
            placeholders = ", ".join(["%s"] * len(columns))

            # Convertir filas a tuplas
            data = [tuple(row) for row in rows]

            # INSERT con ON CONFLICT DO NOTHING (no rompe si ya existen)
            insert_sql = (
                f'INSERT INTO "{table}" ({col_str}) VALUES ({placeholders}) '
                f'ON CONFLICT DO NOTHING'
            )

            pg_cursor.executemany(insert_sql, data)
            pg_conn.commit()

            print(f"  ✅ '{table}': {len(data)} filas migradas")
            total_migrated += len(data)

        except Exception as e:
            pg_conn.rollback()
            print(f"  ❌ Error en tabla '{table}': {e}")

    # ── 5. Resumen ────────────────────────────────────────────────────────
    sqlite_conn.close()
    pg_cursor.close()
    pg_conn.close()

    print("\n" + "=" * 70)
    print(f"✅ MIGRACIÓN COMPLETADA — {total_migrated} filas migradas a Supabase")
    print("=" * 70)
    print("\n📌 Próximos pasos:")
    print("   1. Verifica los datos en el dashboard de Supabase → Table Editor")
    print("   2. Configura DATABASE_URL en Render → Settings → Environment")
    print("   3. Haz git push → Render redesplegará con Supabase como BD")
    print()


if __name__ == "__main__":
    migrate()
