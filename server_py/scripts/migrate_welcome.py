import sqlite3
import os

# Path to database
# server_py/scripts/migrate_welcome.py
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_PY_DIR = os.path.dirname(SCRIPTS_DIR)
ROOT_DIR = os.path.dirname(SERVER_PY_DIR)
DB_PATH = os.path.join(ROOT_DIR, "skill_tech_v2.db")


def migrate():
    print(f"Checking database at {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("Database not found. It will be created on first run.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Attempting to add 'last_welcome_at' column to 'eleonor_sessions'...")
        cursor.execute("ALTER TABLE eleonor_sessions ADD COLUMN last_welcome_at TIMESTAMP")
        conn.commit()
        print("✅ Migration successful: Column 'last_welcome_at' added.")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("ℹ️ Column 'last_welcome_at' already exists.")
        else:
            print(f"❌ Migration failed: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
