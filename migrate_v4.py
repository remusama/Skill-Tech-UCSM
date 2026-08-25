import sqlite3
import os

BASE_DIR = r"c:\Users\PC\OneDrive\Documentos\App pruebas para server\skill-tech"
db_path = os.path.join(BASE_DIR, "skill_tech_v2.db")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_column(table, column_name, data_type):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column_name} {data_type};")
        print(f"Added {column_name} to {table}")
    except Exception as e:
        print(f"Skipping {column_name} on {table}: {e}")

# users table
add_column("users", "global_cognitive_index", "FLOAT DEFAULT 0.0")
add_column("users", "global_reasoning_vector", "JSON")

# user_skills table
add_column("user_skills", "razonamiento_tipo", "VARCHAR")
add_column("user_skills", "razonamiento_vector", "JSON")
add_column("user_skills", "metricas_base", "JSON")
# In case fatiga_score was created previously, we don't need to drop it, we just ignore it.

conn.commit()
conn.close()
print("Migration completed.")
