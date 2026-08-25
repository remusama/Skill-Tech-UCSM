import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_file = os.path.join(BASE_DIR, "skill_tech_v2.db")

def upgrade():
    if not os.path.exists(db_file):
        print(f"Base de datos no encontrada en {db_file}")
        return

    print(f"Conectando a la base de datos: {db_file}")
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    columns_to_add = [
        ("users", "vocational_profile", "JSON"),
    ]

    for table, column, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type};")
            print(f"✅ Columna '{column}' añadida a la tabla '{table}' exitosamente.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"⚠️ La columna '{column}' ya existe en la tabla '{table}'.")
            else:
                print(f"❌ Error al añadir '{column}' en '{table}': {e}")
        except Exception as e:
            print(f"❌ Error inesperado: {e}")

    conn.commit()
    conn.close()
    print("Migración completada.")

if __name__ == "__main__":
    upgrade()
