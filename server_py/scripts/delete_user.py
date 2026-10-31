"""Script CLI para eliminar cuentas de usuario de la base de datos de forma segura y en cascada.

Uso:
    python -m server_py.scripts.delete_user --username <nombre_usuario>
    python -m server_py.scripts.delete_user --email <correo>
    python -m server_py.scripts.delete_user --id <user_id>
"""

import argparse
import sys
import os

# Asegurar que la raíz del proyecto esté en sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from server_py.memoria.database import SessionLocal, User
from server_py.user.service import delete_user_account


def main():
    parser = argparse.ArgumentParser(description="Eliminar una cuenta de usuario de la base de datos.")
    parser.add_argument("--id", type=int, help="ID numérico del usuario")
    parser.add_argument("--username", type=str, help="Nombre de usuario exacto")
    parser.add_argument("--email", type=str, help="Correo electrónico exacto")
    parser.add_argument("-y", "--yes", action="store_true", help="Confirmar automáticamente sin preguntar")

    args = parser.parse_args()

    if not (args.id or args.username or args.email):
        parser.error("Debes especificar al menos un parámetro: --id, --username o --email")

    db = SessionLocal()
    try:
        query = db.query(User)
        if args.id:
            query = query.filter(User.id == args.id)
        elif args.username:
            query = query.filter(User.username == args.username)
        elif args.email:
            query = query.filter(User.email == args.email)

        user = query.first()
        if not user:
            print("[ERROR] No se encontró ningún usuario con los criterios indicados.")
            sys.exit(1)

        print(f"\n[AVISO] Se ha localizado el siguiente usuario:")
        print(f"  - ID:       {user.id}")
        print(f"  - Username: {user.username}")
        print(f"  - Email:    {user.email}")
        print(f"  - Rol:      {user.role}")
        print(f"  - Nombre:   {user.full_name or 'Sin nombre'}")

        if not args.yes:
            confirm = input("\n¿Estás seguro de que deseas eliminar permanentemente esta cuenta y todos sus datos? (s/N): ")
            if confirm.strip().lower() not in ("s", "si", "y", "yes"):
                print("Operación cancelada por el usuario.")
                sys.exit(0)

        print("[...] Eliminando en cascada registros asociados...")
        success = delete_user_account(db, user.id)

        if success:
            print(f"[EXITO] La cuenta de {user.username} (ID: {user.id}) fue eliminada permanentemente de la base de datos.")
        else:
            print("[ERROR] Ocurrió un error al intentar eliminar la cuenta.")
            sys.exit(1)

    finally:
        db.close()


if __name__ == "__main__":
    main()
