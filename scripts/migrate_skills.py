import sqlite3
import os

db_path = 'skill_tech_v2.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

migrations = {
    'Flexibilidad': 'Adaptabilidad',
    'Matemática': 'Matemáticas',
    'Ciencia': 'Ciencias',
    'Comunicación': 'Humanidades',
    'Tecnología': 'Ingeniería',
    'Criterio': 'Pensamiento Crítico',
    'Autogestión': 'Autonomía'
}

for old, new in migrations.items():
    cursor.execute("UPDATE user_skills SET area = ? WHERE area = ?", (new, old))
    if cursor.rowcount > 0:
        print(f"Migrated {cursor.rowcount} rows from '{old}' to '{new}'")

conn.commit()
print("Migration check complete.")
conn.close()
