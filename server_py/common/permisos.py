from fastapi import HTTPException, status
from sqlalchemy.orm import Session, load_only

from server_py.memoria.database import User


def check_is_mentor(user_id: int, db: Session):
    user = (
        db.query(User)
        .options(load_only(User.id, User.role))
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    if user.role not in ["teacher", "admin", "mentor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Se requiere rol de mentor."
        )

    return user