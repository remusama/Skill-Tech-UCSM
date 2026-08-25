import sqlite3
import os

BASE_DIR = r"c:\Users\PC\OneDrive\Documentos\App pruebas para server\skill-tech"
db_path = os.path.join(BASE_DIR, "skill_tech_v2.db")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
try:
    cursor.execute("ALTER TABLE users ADD COLUMN school VARCHAR;")
    print("Added school column")
except Exception as e:
    print(f"Error adding school: {e}")

try:
    cursor.execute("ALTER TABLE users ADD COLUMN classroom VARCHAR;")
    print("Added classroom column")
except Exception as e:
    print(f"Error adding classroom: {e}")

try:
    cursor.execute("ALTER TABLE user_skills ADD COLUMN analytics_baseline JSON;")
    print("Added analytics_baseline column to user_skills")
except Exception as e:
    print(f"Error adding analytics_baseline: {e}")

conn.commit()
conn.close()
print("Migration completed.")
