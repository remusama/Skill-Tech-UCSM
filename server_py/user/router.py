from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from server_py.memoria.database import get_db, User
from server_py.auth.router import get_current_user_id

from sqlalchemy.orm.attributes import flag_modified

router = APIRouter(prefix="/api/user", tags=["User"])


class UserProfileUpdate(BaseModel):
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
    preferences: Dict[str, Any]


@router.get("/profile")
async def get_profile(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
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
async def update_profile(update_data: UserProfileUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Update fields if provided
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return {"status": "ok", "message": "Perfil actualizado correctamente"}


@router.put("/settings")
async def update_settings(settings: UserSettingsUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Merge existing preferences with updates
    current_prefs = dict(user.preferences) if user.preferences else {}
    current_prefs.update(settings.preferences)

    # SQLAlchemy requires explicit reassignment for JSON mutation tracking or use flag_modified
    user.preferences = current_prefs

    # flag_modified(user, "preferences") # If needed, but reassignment often works
    flag_modified(user, "preferences")

    db.commit()
    return {"status": "ok", "preferences": user.preferences}