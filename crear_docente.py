"""
Script para crear un usuario docente directamente en la DB local.
Ejecutar desde la raíz del proyecto:
  python crear_docente.py
"""
import sys
import os

# Asegura que Python encuentre el paquete server_py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bcrypt
from server_py.memoria.database import SessionLocal, User, EleonorSession

# ── CONFIGURA TUS DATOS AQUÍ ──────────────────────────────
USERNAME  = "docente1"
PASSWORD  = "password123"
EMAIL     = "docente1@skilltech.com"
FULL_NAME = "Docente de Prueba"
# ─────────────────────────────────────────────────────────

def main():
    db = SessionLocal()

    # Verificar si ya existe
    if db.query(User).filter(User.username == USERNAME).first():
        print(f"⚠  El usuario '{USERNAME}' ya existe.")
        db.close()
        return

    if db.query(User).filter(User.email == EMAIL).first():
        print(f"⚠  El email '{EMAIL}' ya está registrado.")
        db.close()
        return

    hashed = bcrypt.hashpw(PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user = User(
        username=USERNAME,
        email=EMAIL,
        hashed_password=hashed,
        full_name=FULL_NAME,
        role="teacher",
        has_onboarded=1,  # saltar onboarding
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Crear sesión de Eleonor
    session = EleonorSession(id=f"sess_{user.id}", user_id=user.id)
    db.add(session)
    db.commit()

    print(f"✅ Usuario docente creado exitosamente:")
    print(f"   ID       : {user.id}")
    print(f"   Username : {USERNAME}")
    print(f"   Password : {PASSWORD}")
    print(f"   Email    : {EMAIL}")
    print(f"   Rol      : teacher")
    db.close()

if __name__ == "__main__":
    main()
