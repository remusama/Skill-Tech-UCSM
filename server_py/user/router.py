"""Módulo de gestión de perfil y configuración de usuario.

Este módulo define las rutas para:
- Obtener el perfil del usuario autenticado.
- Actualizar datos del perfil.
- Actualizar preferencias de configuración.

Se utilizan modelos Pydantic para validar la entrada y SQLAlchemy para
persistencia en la base de datos.
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from server_py.memoria.database import get_db, User
from server_py.auth.router import get_current_user_id

router = APIRouter(prefix="/api/user", tags=["User"])


class UserProfileUpdate(BaseModel):
    """Modelo para actualización de datos de perfil del usuario."""
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    occupation: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[str] = None


class UserSettingsUpdate(BaseModel):
    """Modelo para actualización de preferencias del usuario."""
    preferences: Dict[str, Any]


@router.get("/profile")
async def get_profile(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Obtiene el perfil del usuario autenticado.

    Args:
        db (Session): Sesión de base de datos.
        user_id (int): Identificador del usuario autenticado.

    Returns:
        dict: Datos del perfil del usuario.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "bio": user.bio,
        "location": user.location,
        "occupation": user.occupation,
        "specialty": user.specialty,
        "phone": user.phone,
        "website": user.website,
        "avatar_url": user.avatar_url,
        "preferences": user.preferences,
        "created_at": user.created_at
    }


@router.put("/profile")
async def update_profile(
    update_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Actualiza el perfil del usuario autenticado.

    Args:
        update_data (UserProfileUpdate): Datos a actualizar.
        db (Session): Sesión de base de datos.
        user_id (int): Identificador del usuario autenticado.

    Returns:
        dict: Estado de la operación.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar campos proporcionados
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return {"status": "ok", "message": "Perfil actualizado correctamente"}


@router.put("/settings")
async def update_settings(
    settings: UserSettingsUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Actualiza las preferencias del usuario autenticado.

    Args:
        settings (UserSettingsUpdate): Preferencias a actualizar.
        db (Session): Sesión de base de datos.
        user_id (int): Identificador del usuario autenticado.

    Returns:
        dict: Estado de la operación y preferencias actualizadas.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Fusionar preferencias existentes con las nuevas
    current_prefs = dict(user.preferences) if user.preferences else {}
    current_prefs.update(settings.preferences)

    # Reasignación explícita para que SQLAlchemy rastree cambios en JSON
    user.preferences = current_prefs
    flag_modified(user, "preferences")

    db.commit()
    return {"status": "ok", "preferences": user.preferences}


class DeleteAccountRequest(BaseModel):
    """Modelo para confirmar la eliminación de la cuenta."""
    password: Optional[str] = None
    confirmation: Optional[str] = None


@router.delete("/account")
async def delete_my_account(
    req: Optional[DeleteAccountRequest] = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Elimina permanentemente la cuenta del usuario autenticado y todos sus datos relacionados.
    """
    import bcrypt
    from server_py.user.service import delete_user_account

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Si el usuario tiene contraseña configurada y envió contraseña, verificarla
    if user.hashed_password and req and req.password:
        if not bcrypt.checkpw(req.password.encode("utf-8"), user.hashed_password.encode("utf-8")):
            raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    success = delete_user_account(db, user_id)
    if not success:
        raise HTTPException(status_code=500, detail="No se pudo completar la eliminación de la cuenta")

    return {"status": "ok", "message": "Cuenta y datos asociados eliminados exitosamente"}


@router.delete("/{target_user_id}")
async def admin_delete_user(
    target_user_id: str,
    username: Optional[str] = None,
    email: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user_id: Optional[int] = Depends(get_current_user_id),
):
    """
    Endpoint para administradores y mentores: elimina TOTALMENTE a un usuario y
    todos sus registros vinculados (todas sus notas, exámenes, habilidades, asistencias,
    evaluaciones de línea de tiempo y cuenta).
    """
    from server_py.user.service import delete_user_account

    # Validar permisos
    if current_user_id:
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if current_user and current_user.role not in ("admin", "teacher"):
            raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este usuario")

    purged_info = delete_user_account(db, target_user_id, username=username, email=email)
    if not purged_info:
        raise HTTPException(status_code=404, detail="Usuario objetivo no encontrado en la base de datos")

    return {
        "status": "ok",
        "message": f"Usuario {target_user_id} y todos sus datos relacionados (notas, habilidades, asistencias y cuenta) han sido eliminados permanentemente",
        "purged_records": purged_info
    }
