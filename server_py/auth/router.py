"""Rutas de autenticación y autorización de usuarios.

Este módulo gestiona el registro, inicio de sesión, autenticación con
Google, cambio de contraseña y validación de tokens JWT.
"""

import datetime
import json
import os
import urllib.request

import bcrypt
import jwt
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from server_py.memoria.database import (
    EleonorSession,
    User,
    get_db,
)

router = APIRouter()

# Configuración de tokens JWT.
SECRET_KEY = (
    os.environ.get("JWT_SECRET")
    or os.environ.get("JWT_SECRET_KEY")
    or ""
).strip()
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET (o JWT_SECRET_KEY) no está configurado. Define una clave secreta fuerte y aleatoria "
        "en la variable de entorno JWT_SECRET o JWT_SECRET_KEY antes de iniciar el backend "
        "(ej: python -c \"import secrets; print(secrets.token_hex(32))\")."
    )

ALGORITHM = "HS256"


# Clave para permitir el autorregistro como docente.
# La configuración por entorno debe utilizarse en producción.
TEACHER_REGISTRATION_KEY = os.environ.get(
    "TEACHER_REGISTRATION_KEY",
    "87654321",
)

# Roles que un usuario puede asignarse durante el autorregistro.
# Los roles admin y mentor no se asignan desde endpoints públicos.
PUBLIC_SELF_ASSIGNABLE_ROLES = {"student", "teacher"}


def _validate_and_resolve_role(
    requested_role: str,
    teacher_key: str = None,
) -> str:
    """Valida y devuelve el rol solicitado durante el autorregistro.

    Los usuarios públicos solo pueden registrarse como estudiantes o
    docentes. El registro como docente requiere una clave adicional.
    """
    role = (requested_role or "student").strip().lower()

    if role not in PUBLIC_SELF_ASSIGNABLE_ROLES:
        raise HTTPException(
            status_code=403,
            detail=(
                "El rol solicitado no está permitido para el "
                "autorregistro."
            ),
        )

    if role == "teacher":
        if not TEACHER_REGISTRATION_KEY:
            raise HTTPException(
                status_code=403,
                detail=(
                    "El registro de docentes no está disponible "
                    "en este momento."
                ),
            )
        if teacher_key != TEACHER_REGISTRATION_KEY:
            raise HTTPException(
                status_code=400,
                detail="Contraseña de docente incorrecta",
            )

    return role


class AuthRequest(BaseModel):
    """Datos necesarios para registrar una cuenta local.

    Validaciones:
    - La contraseña debe tener al menos 8 caracteres.
    - El correo electrónico y la contraseña no deben contener espacios.
    - El rol debe ser 'student' o 'teacher' (este último requiere clave)."""
    username: str
    password: str
    email: str = None
    school: str = None
    classroom: str = None
    role: str = "student"
    teacher_key: str = None


class LoginRequest(BaseModel):
    """Credenciales necesarias para iniciar sesión."""
    username: str
    password: str
    role: str = "student"
    teacher_key: str = None


class GoogleAuthRequest(BaseModel):
    """Datos necesarios para iniciar sesión mediante Google."""
    token: str
    role: str = "student"
    teacher_key: str = None


class ChangePasswordRequest(BaseModel):
    """Datos necesarios para cambiar una contraseña."""
    current_password: str
    new_password: str


def create_access_token(data: dict) -> str:
    """Crea un token JWT válido por siete días.

    El payload incluye:
    - user_id: identificador del usuario.
    - username: nombre de usuario.
    - exp: fecha de expiración (UTC)."""
    token_data = data.copy()
    expiration = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    token_data.update({"exp": expiration})

    return jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


async def get_current_user_id(
    authorization: str = Header(None),
):
    """Obtiene el identificador del usuario desde un token Bearer.

    Validaciones:
    - El header debe comenzar con 'Bearer '.
    - El token debe contener 'user_id'.

    Excepciones:
    - 401 si el token falta, expira o es inválido."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Token faltante o formato inválido",
        )

    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Token inválido: user_id no encontrado",
            )

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="El token ha expirado",
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido",
        )


@router.post("/api/auth/register")
async def register(
    req: AuthRequest,
    db: Session = Depends(get_db),
):
    """Registra un usuario local y crea su sesión inicial."""
    normalized_username = " ".join(req.username.split())
    if normalized_username != req.username or not normalized_username:
        raise HTTPException(
            status_code=400,
            detail=(
                "El nombre de usuario no debe tener espacios al inicio, "
                "al final ni espacios dobles."
            ),
        )

    req.username = normalized_username

    if (
        req.email
        and any(character.isspace() for character in req.email)
    ) or any(character.isspace() for character in req.password):
        raise HTTPException(
            status_code=400,
            detail=(
                "El correo electrónico o la contraseña no deben "
                "contener espacios."
            ),
        )

    if len(req.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener al menos 8 caracteres.",
        )

    resolved_role = _validate_and_resolve_role(
        req.role,
        req.teacher_key,
    )

    existing_user = (
        db.query(User)
        .filter(User.username == req.username)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="El nombre de usuario ya está en uso.",
        )

    if req.email:
        existing_email = (
            db.query(User)
            .filter(User.email == req.email)
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="El correo electrónico ya está registrado.",
            )

    hashed_password = bcrypt.hashpw(
        req.password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    new_user = User(
        username=req.username,
        email=req.email,
        hashed_password=hashed_password,
        school=req.school,
        classroom=req.classroom,
        role=resolved_role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    session = EleonorSession(
        id=f"sess_{new_user.id}",
        user_id=new_user.id,
    )
    db.add(session)
    db.commit()

    return {
        "status": "ok",
        "user_id": new_user.id,
    }


@router.post("/api/auth/login")
async def login(
    req: LoginRequest,
    db: Session = Depends(get_db),
):
    """Valida las credenciales y genera un token JWT."""
    if req.role == "teacher":
        if (
            not TEACHER_REGISTRATION_KEY
            or req.teacher_key != TEACHER_REGISTRATION_KEY
        ):
            raise HTTPException(
                status_code=400,
                detail="Contraseña de docente incorrecta",
            )

    user = (
        db.query(User)
        .filter(
            (User.username == req.username)
            | (User.email == req.username),
            User.role == req.role,
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Credenciales inválidas o rol incorrecto",
        )

    password_is_valid = bcrypt.checkpw(
        req.password.encode("utf-8"),
        user.hashed_password.encode("utf-8"),
    )

    if not password_is_valid:
        raise HTTPException(
            status_code=400,
            detail="Credenciales inválidas",
        )

    token = create_access_token(
        {
            "user_id": user.id,
            "username": user.username,
        }
    )

    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "has_onboarded": bool(user.has_onboarded),
            "role": user.role,
        },
    }


@router.post("/api/auth/google")
async def google_login(
    req: GoogleAuthRequest,
    db: Session = Depends(get_db),
):
    """Autentica un usuario mediante un token de Google."""
    tokeninfo_url = (
        "https://oauth2.googleapis.com/tokeninfo"
        f"?id_token={req.token}"
    )
    try:
        request = urllib.request.Request(tokeninfo_url)

        with urllib.request.urlopen(request, timeout=5) as response:
            google_data = json.loads(
                response.read().decode("utf-8")
            )

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=(
                "Token de Google inválido o error de red: "
                f"{str(error)}"
            ),
        )

    google_client_id = os.environ.get(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID"
    )

    if google_client_id and google_data.get("aud") != google_client_id:
        alternate_client_id = os.environ.get("GOOGLE_CLIENT_ID")
        if (
            alternate_client_id
            and google_data.get("aud") != alternate_client_id
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "El token de Google no coincide con el "
                    "Client ID configurado."
                ),
            )
    email = google_data.get("email")

    if not email:
        raise HTTPException(
            status_code=400,
            detail=(
                "El token no contiene un correo electrónico válido."
            ),
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        resolved_role = _validate_and_resolve_role(
            req.role,
            req.teacher_key,
        )
        base_username = (
            email.split("@")[0]
            .replace(".", "")
            .replace("-", "")
            .replace("_", "")
        )
        base_username = "".join(
            character
            for character in base_username
            if character.isalnum()
        )
        if not base_username:
            base_username = "user"

        username = base_username
        suffix = 1

        while (
            db.query(User)
            .filter(User.username == username)
            .first()
        ):
            username = f"{base_username}{suffix}"
            suffix += 1

        random_password = os.urandom(24).hex()
        hashed_password = bcrypt.hashpw(
            random_password.encode("utf-8"),
            bcrypt.gensalt(),
        ).decode("utf-8")

        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role=resolved_role,
            full_name=google_data.get("name"),
            avatar_url=google_data.get("picture"),
            has_onboarded=0
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        session = EleonorSession(
            id=f"sess_{user.id}",
            user_id=user.id,
        )
        db.add(session)
        db.commit()

    token = create_access_token(
        {
            "user_id": user.id,
            "username": user.username,
        }
    )

    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "has_onboarded": bool(user.has_onboarded),
            "role": user.role
        }
    }


@router.post("/api/auth/onboarding_complete")
async def onboarding_complete(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Marca como completado el proceso de incorporación del usuario."""
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    user.has_onboarded = 1
    db.commit()
    return {"status": "ok"}


@router.post("/api/auth/change_password")
async def change_password(
    req: ChangePasswordRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Cambia la contraseña del usuario autenticado."""
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    password_is_valid = bcrypt.checkpw(
        req.current_password.encode("utf-8"),
        user.hashed_password.encode("utf-8"),
    )

    if not password_is_valid:
        raise HTTPException(
            status_code=400,
            detail="La contraseña actual es incorrecta",
        )

    if len(req.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail=(
                "La nueva contraseña debe tener al menos 8 caracteres."
            ),
        )

    if any(
        character.isspace()
        for character in req.new_password
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "La nueva contraseña no debe contener espacios."
            ),
        )

    user.hashed_password = bcrypt.hashpw(
        req.new_password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")
    db.commit()

    return {
        "status": "ok",
        "message": "Contraseña actualizada exitosamente",
    }