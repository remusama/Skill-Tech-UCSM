import sys
sys.path.append('.')
import re
from server_py.memoria.database import SessionLocal, User
from sqlalchemy import text

db = SessionLocal()

# 1. Cargar el mapeo oficial exacto de lib/casasData.ts
with open('lib/casasData.ts', 'r', encoding='utf-8') as f:
    text_content = f.read()

pattern = re.compile(
    r'username:\s*"([^"]+)",\s*full_name:\s*"([^"]+)",\s*email:\s*"([^"]+)",\s*classroom:\s*"([^"]+)",\s*house:\s*"([^"]+)"'
)
matches = pattern.findall(text_content)
print(f"Total estudiantes oficiales en casasData: {len(matches)}")

official_map = {}
for u, fn, em, cl, h in matches:
    official_map[em.lower().strip()] = {
        "username": u,
        "full_name": fn,
        "email": em.lower().strip(),
        "classroom": cl,
        "house": h
    }

# 2. Actualizar cada usuario en la base de datos de acuerdo a su email oficial
updated = 0
for email, off in official_map.items():
    user = db.query(User).filter(User.email.ilike(email)).first()
    if user:
        user.house = off["house"]
        user.full_name = off["full_name"]
        user.classroom = off["classroom"]
        user.role = "student"
        if not user.myl_balance_cash:
            user.myl_balance_cash = 4
        if not user.myl_balance_digital:
            user.myl_balance_digital = 4
        updated += 1
    else:
        print(f"Usuario no encontrado en BD por email: {email}")

db.commit()
print(f"Usuarios actualizados con su Casa oficial: {updated}")

# 3. Revisar usuarios adicionales o de prueba que tengan house asignada
all_users = db.query(User).all()
extra_in_houses = []
for u in all_users:
    u_email = (u.email or "").lower().strip()
    if u.house and u_email not in official_map:
        extra_in_houses.append((u.id, u.username, u.email, u.house))

print(f"\nUsuarios extra o de prueba con Casa asignada fuera de los 48 oficiales: {len(extra_in_houses)}")
for x in extra_in_houses:
    print(f"  ID: {x[0]} | {x[1]} | {x[2]} | Casa: {x[3]}")

# 4. Mostrar el conteo final por casa
print("\n=== CONTEO FINAL EN BASE DE DATOS ===")
for h in ["APEX", "IGNIS", "NEXUS", "VISIO"]:
    count = db.query(User).filter(User.house == h, User.role == "student").count()
    print(f"Casa {h}: {count} estudiantes")

db.close()

