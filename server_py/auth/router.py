from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from server_py.memoria.database import get_db, User, EleonorSession
import bcrypt
import jwt
import datetime
import os
import urllib.request
import json

router = APIRouter()

SECRET_KEY = (os.environ.get("JWT_SECRET") or os.environ.get("JWT_SECRET_KEY") or "").strip()
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET (o JWT_SECRET_KEY) no está configurado. Define una clave secreta fuerte y aleatoria "
        "en la variable de entorno JWT_SECRET o JWT_SECRET_KEY antes de iniciar el backend "
        "(ej: python -c \"import secrets; print(secrets.token_hex(32))\")."
    )

ALGORITHM = "HS256"


# Clave para permitir el auto-registro como docente. Debe configurarse por entorno;
# si no está presente, usa fallback "87654321" para desarrollo.
TEACHER_REGISTRATION_KEY = os.environ.get("TEACHER_REGISTRATION_KEY", "87654321")

# No estoy de acuerdo, pero boe, aqui te lo dejo por siaca
# TEACHER_REGISTRATION_KEY = os.environ.get("TEACHER_REGISTRATION_KEY")


# Roles que un usuario puede auto-asignarse en /api/auth/register o /api/auth/google. "admin" y "mentor" NUNCA se asignan desde estos endpoints públicos.
PUBLIC_SELF_ASSIGNABLE_ROLES = {"student", "teacher"}


# Valida que el rol solicitado por un usuario no autenticado sea uno que puede auto-asignarse, y que si pide 'teacher' presente la clave correcta
def _validate_and_resolve_role(requested_role: str, teacher_key: str = None) -> str:
    role = (requested_role or "student").strip().lower()

    if role not in PUBLIC_SELF_ASSIGNABLE_ROLES:
        raise HTTPException(
            status_code=403,
            detail="El rol solicitado no está permitido para el auto-registro."
        )

    if role == "teacher":
        if not TEACHER_REGISTRATION_KEY:
            raise HTTPException(
                status_code=403,
                detail="El registro de docentes no está disponible en este momento."
            )
        if teacher_key != TEACHER_REGISTRATION_KEY:
            raise HTTPException(status_code=400, detail="Contraseña de docente incorrecta")

    return role


class AuthRequest(BaseModel):
    username: str
    password: str
    email: str = None
    school: str = None
    classroom: str = None
    role: str = "student"
    teacher_key: str = None


class LoginRequest(BaseModel):
    username: str
    password: str
    role: str = "student"
    teacher_key: str = None


class GoogleAuthRequest(BaseModel):
    token: str
    role: str = "student"
    teacher_key: str = None


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token faltante o formato inválido")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido: user_id no encontrado")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="El token ha expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


@router.post("/api/auth/register")
async def register(req: AuthRequest, db: Session = Depends(get_db)):
    # if any(c.isspace() for c in req.username) or (req.email and any(c.isspace() for c in req.email)) or any(c.isspace() for c in req.password):
    #     raise HTTPException(status_code=400, detail="el nombre de usuario, correo electrónico o contraseña no deben contener espacios")

    # El username puede contener espacios (ej. nombre completo de un alumno registrado en lote), pero no debe empezar/terminar en espacio ni tener espacios dobles.
    normalized_username = " ".join(req.username.split())
    if normalized_username != req.username or not normalized_username:
        raise HTTPException(status_code=400, detail="el nombre de usuario no debe tener espacios al inicio/final ni espacios dobles")
    req.username = normalized_username
    #Esta es una validacion para el correo electronico y la contraseña, asegurando que no contengan espacios en blanco.
    if (req.email and any(c.isspace() for c in req.email)) or any(c.isspace() for c in req.password):
        raise HTTPException(status_code=400, detail="el correo electrónico o la contraseña no deben contener espacios")

    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="la contraseña debe tener al menos 8 caracteres")

    # Valida y resuelve el rol de forma segura: nunca confiar directamente en req.role
    resolved_role = _validate_and_resolve_role(req.role, req.teacher_key)

    # Check if user exists by username
    existing_user = db.query(User).filter(User.username == req.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="el nombre de usuario ya está en uso")

    # Check if email exists
    if req.email:
        existing_email = db.query(User).filter(User.email == req.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="el correo electrónico ya está registrado")

    hashed = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_user = User(
        username=req.username,
        email=req.email,
        hashed_password=hashed,
        school=req.school,
        classroom=req.classroom,
        role=resolved_role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize Eleonor session for this user
    session = EleonorSession(id=f"sess_{new_user.id}", user_id=new_user.id)
    db.add(session)
    db.commit()

    return {"status": "ok", "user_id": new_user.id}


@router.post("/api/auth/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    # aqui me parece que has estado seteando al profesor, razon del cambio
    if req.role == "teacher":
        if not TEACHER_REGISTRATION_KEY or req.teacher_key != TEACHER_REGISTRATION_KEY:
            raise HTTPException(status_code=400, detail="Contraseña de docente incorrecta")

    # Intentar buscar por nombre de usuario o por email y rol
    user = db.query(User).filter(
        (User.username == req.username) | (User.email == req.username),
        User.role == req.role
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Credenciales inválidas o rol incorrecto")

    if not bcrypt.checkpw(req.password.encode('utf-8'), user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Credenciales inválidas")

    token = create_access_token({"user_id": user.id, "username": user.username})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "has_onboarded": bool(user.has_onboarded),
            "role": user.role
        }
    }


@router.post("/api/auth/google")
async def google_login(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    # 1. Verificar el token de Google llamando a la API de Google tokeninfo
    tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={req.token}"
    try:
        req_obj = urllib.request.Request(tokeninfo_url)
        with urllib.request.urlopen(req_obj, timeout=5) as resp:
            google_data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Token de Google inválido o error de red: {str(e)}")

    # 2. Validar que la audiencia (aud) corresponda a nuestro Client ID de Google
    google_client_id = os.environ.get("NEXT_PUBLIC_GOOGLE_CLIENT_ID")
    if google_client_id and google_data.get("aud") != google_client_id:
        alt_google_client_id = os.environ.get("GOOGLE_CLIENT_ID")
        if alt_google_client_id and google_data.get("aud") != alt_google_client_id:
            raise HTTPException(status_code=400, detail="El token de Google no coincide con el Client ID configurado.")

    email = google_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="El token no contiene un correo electrónico válido.")

    # 3. Comprobar si el usuario ya existe
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Valida y resuelve el rol de forma segura antes de crear la cuenta
        resolved_role = _validate_and_resolve_role(req.role, req.teacher_key)

        # Registrar un usuario nuevo
        base_username = email.split("@")[0].replace(".", "").replace("-", "").replace("_", "")
        base_username = "".join(c for c in base_username if c.isalnum())
        if not base_username:
            base_username = "user"

        username = base_username
        suffix = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{suffix}"
            suffix += 1

        # Generar hash de contraseña inútil aleatoria
        random_pass = os.urandom(24).hex()
        hashed = bcrypt.hashpw(random_pass.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insertar nuevo usuario
        user = User(
            username=username,
            email=email,
            hashed_password=hashed,
            role=resolved_role,  # para que concuerde con los datos
            full_name=google_data.get("name"),
            avatar_url=google_data.get("picture"),
            has_onboarded=0
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Crear EleonorSession
        session = EleonorSession(id=f"sess_{user.id}", user_id=user.id)
        db.add(session)
        db.commit()

    # 4. Generar y devolver el token JWT de la aplicación
    token = create_access_token({"user_id": user.id, "username": user.username})
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
async def onboarding_complete(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.has_onboarded = 1
    db.commit()
    return {"status": "ok"}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/api/auth/change_password")
async def change_password(req: ChangePasswordRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not bcrypt.checkpw(req.current_password.encode('utf-8'), user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 8 caracteres")

    if any(c.isspace() for c in req.new_password):
        raise HTTPException(status_code=400, detail="La nueva contraseña no debe contener espacios")

    user.hashed_password = bcrypt.hashpw(req.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.commit()
    return {"status": "ok", "message": "Contraseña actualizada exitosamente"}
