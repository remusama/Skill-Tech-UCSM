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

# user_skills table
add_column("user_skills", "bloom_matrix", "JSON")
add_column("user_skills", "score_tri", "FLOAT")

# exam_results table
add_column("exam_results", "csat_score", "INTEGER")
add_column("exam_results", "rage_clicks", "INTEGER")
add_column("exam_results", "score_tri", "FLOAT")

conn.commit()
conn.close()
print("Migration completed.")
