import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

import sqlite3

def fix_schema():
    # Database path
    db_path = "skill_tech_v2.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("🔧 Attempting to fix schema for 'eleonor_sessions'...")

        # Add 'boundary' column
        try:
            cursor.execute("ALTER TABLE eleonor_sessions ADD COLUMN boundary TEXT DEFAULT 'none'")
            print("✅ Added column: boundary")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("ℹ️ Column 'boundary' already exists.")
            else:
                print(f"❌ Error adding 'boundary': {e}")

        # Add 'friction_data' column
        try:
            cursor.execute("ALTER TABLE eleonor_sessions ADD COLUMN friction_data JSON")
            print("✅ Added column: friction_data")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("ℹ️ Column 'friction_data' already exists.")
            else:
                print(f"❌ Error adding 'friction_data': {e}")

        # Add 'usage_model' column
        try:
            cursor.execute("ALTER TABLE eleonor_sessions ADD COLUMN usage_model JSON")
            print("✅ Added column: usage_model")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("ℹ️ Column 'usage_model' already exists.")
            else:
                print(f"❌ Error adding 'usage_model': {e}")

        conn.commit()
        print("✨ Schema update complete.")

    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_schema()
