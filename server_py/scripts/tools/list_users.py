import sqlite3
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))


# Path to the database
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(base_dir, "skill_tech_v2.db")


def list_users():
    if not os.path.exists(db_path):
        print(f"La base de datos no existe en: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id, username, email, has_onboarded, created_at, hashed_password FROM users")
        users = cursor.fetchall()

        if not users:
            print("No hay usuarios registrados aún.")
        else:
            print(f"{'ID':<5} | {'Username':<15} | {'Email':<25} | {'Onboarded':<10} | {'Created At':<20} | {'Password'}")
            print("-" * 120)
            for user in users:
                onboarded = "Sí" if user[3] else "No"
                password_preview = user[5][:10] + "..." if user[5] else "None"
                print(f"{user[0]:<5} | {user[1]:<15} | {user[2]:<25} | {onboarded:<10} | {str(user[4]):<20} | {password_preview}")

    except sqlite3.OperationalError as e:
        print(f"Error al acceder a la tabla users: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    list_users()
