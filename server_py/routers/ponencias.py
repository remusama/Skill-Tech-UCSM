"""Router de ponencias — sistema de preguntas de estudiantes.

Las preguntas se persisten en un archivo CSV dentro de server_py/data/.
Cada fila representa una pregunta con su UUID, ponencia, user_id y texto.

Endpoints:
  GET    /api/ponencias                     → lista de ponencias activas
  POST   /api/ponencias                     → crear ponencia (solo teacher)
  GET    /api/ponencias/{ponencia_id}/preguntas   → preguntas de una ponencia
  POST   /api/ponencias/{ponencia_id}/preguntas   → enviar pregunta (student)
  PUT    /api/ponencias/preguntas/{pregunta_id}   → editar pregunta propia
  DELETE /api/ponencias/preguntas/{pregunta_id}   → borrar pregunta propia
"""

import csv
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import filelock
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from server_py.auth.router import get_current_user_id
from server_py.memoria.database import User, get_db

router = APIRouter(prefix="/api/ponencias", tags=["Ponencias"])

# ── Rutas de archivos ────────────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

PONENCIAS_CSV = DATA_DIR / "ponencias.csv"
PREGUNTAS_CSV = DATA_DIR / "preguntas_ponencias.csv"

PONENCIAS_LOCK = str(DATA_DIR / "ponencias.lock")
PREGUNTAS_LOCK = str(DATA_DIR / "preguntas.lock")

# ── Columnas CSV ─────────────────────────────────────────────────────────────
PONENCIAS_COLS = ["id", "titulo", "ponente", "descripcion", "created_at", "activa", "permite_anonimos"]
PREGUNTAS_COLS = ["id", "ponencia_id", "user_id", "texto", "created_at", "updated_at", "es_anonimo"]


# ── Helpers CSV ──────────────────────────────────────────────────────────────

def _read_csv(path: Path, cols: list) -> list[dict]:
    """Lee el CSV y devuelve lista de dicts. Crea el archivo si no existe."""
    if not path.exists():
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=cols)
            writer.writeheader()
        return []
    with open(path, "r", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _write_csv(path: Path, cols: list, rows: list[dict]) -> None:
    """Reescribe el CSV completo con las filas dadas asegurando todas las columnas."""
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        writer.writeheader()
        for r in rows:
            # Rellenar columnas faltantes con cadena vacía
            filled = {k: r.get(k, "") for k in cols}
            writer.writerow(filled)


def _append_csv(path: Path, cols: list, row: dict) -> None:
    """Añade una fila al CSV con extrasaction ignorado."""
    exists = path.exists()
    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        if not exists:
            writer.writeheader()
        writer.writerow({k: row.get(k, "") for k in cols})


def _get_user_role(db: Session, user_id: int) -> str:
    user = db.query(User).filter(User.id == user_id).first()
    return user.role if user else "student"


def _get_user_info(db: Session, user_id: int) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"role": "student", "name": "Estudiante", "classroom": ""}
    return {
        "role": user.role or "student",
        "name": user.full_name or user.username or "Estudiante",
        "classroom": user.classroom or "",
    }


# ── Schemas ──────────────────────────────────────────────────────────────────

class PonenciaCreate(BaseModel):
    titulo: str
    ponente: str
    descripcion: Optional[str] = ""
    permite_anonimos: Optional[bool] = True


class PonenciaOut(BaseModel):
    id: str
    titulo: str
    ponente: str
    descripcion: str
    created_at: str
    activa: str
    permite_anonimos: bool = True


class PreguntaCreate(BaseModel):
    texto: str
    es_anonimo: Optional[bool] = False


class PreguntaEdit(BaseModel):
    texto: str


class PreguntaOut(BaseModel):
    id: str
    ponencia_id: str
    user_id: str
    user_name: Optional[str] = "Estudiante"
    user_classroom: Optional[str] = ""
    texto: str
    created_at: str
    updated_at: str
    es_anonimo: bool = False
    es_mia: bool = False  # True si pertenece al usuario que consulta


# ── Endpoints de Ponencias ───────────────────────────────────────────────────

@router.get("", response_model=List[PonenciaOut])
async def listar_ponencias(
    incluir_inactivas: bool = False,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Devuelve las ponencias. Si el docente solicita incluir inactivas, devuelve todas."""
    u_info = _get_user_info(db, user_id)
    is_teacher = u_info["role"] == "teacher"

    with filelock.FileLock(PONENCIAS_LOCK):
        rows = _read_csv(PONENCIAS_CSV, PONENCIAS_COLS)

    res = []
    for r in rows:
        activa = r.get("activa", "1")
        if activa == "1" or (is_teacher and incluir_inactivas):
            res.append({
                "id": r.get("id", ""),
                "titulo": r.get("titulo", ""),
                "ponente": r.get("ponente", ""),
                "descripcion": r.get("descripcion", ""),
                "created_at": r.get("created_at", ""),
                "activa": activa,
                "permite_anonimos": r.get("permite_anonimos", "1") in ("1", "true", "True", True),
            })
    return res


@router.post("", response_model=PonenciaOut, status_code=201)
async def crear_ponencia(
    body: PonenciaCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Crea una ponencia nueva. Solo accesible para docentes."""
    role = _get_user_role(db, user_id)
    if role != "teacher":
        raise HTTPException(status_code=403, detail="Solo los docentes pueden crear ponencias.")

    nueva = {
        "id": str(uuid.uuid4()),
        "titulo": body.titulo.strip(),
        "ponente": body.ponente.strip(),
        "descripcion": (body.descripcion or "").strip(),
        "created_at": datetime.utcnow().isoformat(),
        "activa": "1",
        "permite_anonimos": "1" if body.permite_anonimos is not False else "0",
    }

    with filelock.FileLock(PONENCIAS_LOCK):
        _append_csv(PONENCIAS_CSV, PONENCIAS_COLS, nueva)

    return {
        **nueva,
        "permite_anonimos": nueva["permite_anonimos"] == "1",
    }


@router.delete("/{ponencia_id}", status_code=204)
async def desactivar_o_eliminar_ponencia(
    ponencia_id: str,
    permanente: bool = False,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Desactiva u oculta una ponencia, o la elimina permanentemente con sus preguntas."""
    role = _get_user_role(db, user_id)
    if role != "teacher":
        raise HTTPException(status_code=403, detail="Solo los docentes pueden eliminar ponencias.")

    with filelock.FileLock(PONENCIAS_LOCK):
        rows = _read_csv(PONENCIAS_CSV, PONENCIAS_COLS)
        updated = []
        found = False
        for r in rows:
            if r["id"] == ponencia_id:
                found = True
                if permanente:
                    continue  # Eliminar fila completamente
                else:
                    r["activa"] = "0"
                    updated.append(r)
            else:
                updated.append(r)

        if not found:
            raise HTTPException(status_code=404, detail="Ponencia no encontrada.")
        _write_csv(PONENCIAS_CSV, PONENCIAS_COLS, updated)

    if permanente:
        with filelock.FileLock(PREGUNTAS_LOCK):
            p_rows = _read_csv(PREGUNTAS_CSV, PREGUNTAS_COLS)
            p_updated = [p for p in p_rows if p.get("ponencia_id") != ponencia_id]
            _write_csv(PREGUNTAS_CSV, PREGUNTAS_COLS, p_updated)


@router.patch("/{ponencia_id}/toggle-activa", response_model=PonenciaOut)
async def toggle_activa_ponencia(
    ponencia_id: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Alterna el estado activa (1/0) de una ponencia. Solo docentes."""
    role = _get_user_role(db, user_id)
    if role != "teacher":
        raise HTTPException(status_code=403, detail="Solo los docentes pueden modificar ponencias.")

    with filelock.FileLock(PONENCIAS_LOCK):
        rows = _read_csv(PONENCIAS_CSV, PONENCIAS_COLS)
        target = None
        updated = []
        for r in rows:
            if r["id"] == ponencia_id:
                r["activa"] = "0" if r.get("activa", "1") == "1" else "1"
                target = r
            updated.append(r)

        if not target:
            raise HTTPException(status_code=404, detail="Ponencia no encontrada.")
        _write_csv(PONENCIAS_CSV, PONENCIAS_COLS, updated)

    return {
        **target,
        "permite_anonimos": target.get("permite_anonimos", "1") in ("1", "true", "True", True),
    }


# ── Endpoints de Preguntas ───────────────────────────────────────────────────

@router.get("/{ponencia_id}/preguntas", response_model=List[PreguntaOut])
async def listar_preguntas(
    ponencia_id: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Devuelve todas las preguntas de una ponencia con los datos del autor.
    Marca con es_mia=True las que pertenecen al usuario que consulta."""
    with filelock.FileLock(PREGUNTAS_LOCK):
        rows = _read_csv(PREGUNTAS_CSV, PREGUNTAS_COLS)

    user_cache = {}
    resultado = []
    for r in rows:
        if r.get("ponencia_id") == ponencia_id:
            uid_str = r.get("user_id")
            if uid_str not in user_cache:
                try:
                    u = db.query(User).filter(User.id == int(uid_str)).first()
                    user_cache[uid_str] = {
                        "name": (u.full_name or u.username) if u else "Estudiante",
                        "classroom": (u.classroom or "") if u else "",
                    }
                except Exception:
                    user_cache[uid_str] = {"name": "Estudiante", "classroom": ""}

            u_meta = user_cache.get(uid_str, {"name": "Estudiante", "classroom": ""})
            is_anon = r.get("es_anonimo", "0") in ("1", "true", "True", True)

            resultado.append({
                "id": r["id"],
                "ponencia_id": r["ponencia_id"],
                "user_id": r["user_id"],
                "user_name": u_meta["name"],
                "user_classroom": u_meta["classroom"],
                "texto": r["texto"],
                "created_at": r["created_at"],
                "updated_at": r.get("updated_at", r["created_at"]),
                "es_anonimo": is_anon,
                "es_mia": r["user_id"] == str(user_id),
            })

    # Orden: las más recientes primero
    resultado.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return resultado


@router.post("/{ponencia_id}/preguntas", response_model=PreguntaOut, status_code=201)
async def enviar_pregunta(
    ponencia_id: str,
    body: PreguntaCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """El estudiante envía una pregunta para una ponencia."""
    texto = body.texto.strip()
    if not texto:
        raise HTTPException(status_code=400, detail="La pregunta no puede estar vacía.")
    if len(texto) > 500:
        raise HTTPException(status_code=400, detail="La pregunta no puede superar los 500 caracteres.")

    # Verificar que la ponencia existe y está activa
    with filelock.FileLock(PONENCIAS_LOCK):
        ponencias = _read_csv(PONENCIAS_CSV, PONENCIAS_COLS)
    ponencia = next((p for p in ponencias if p["id"] == ponencia_id and p.get("activa", "1") == "1"), None)
    if not ponencia:
        raise HTTPException(status_code=404, detail="Ponencia no encontrada o inactiva.")

    ahora = datetime.utcnow().isoformat()
    es_anon_val = "1" if body.es_anonimo else "0"
    nueva = {
        "id": str(uuid.uuid4()),
        "ponencia_id": ponencia_id,
        "user_id": str(user_id),
        "texto": texto,
        "created_at": ahora,
        "updated_at": ahora,
        "es_anonimo": es_anon_val,
    }

    with filelock.FileLock(PREGUNTAS_LOCK):
        _append_csv(PREGUNTAS_CSV, PREGUNTAS_COLS, nueva)

    user = db.query(User).filter(User.id == user_id).first()
    u_name = (user.full_name or user.username) if user else "Estudiante"
    u_classroom = user.classroom or "" if user else ""

    return {
        **nueva,
        "es_anonimo": bool(body.es_anonimo),
        "user_name": u_name,
        "user_classroom": u_classroom,
        "es_mia": True,
    }


@router.put("/preguntas/{pregunta_id}", response_model=PreguntaOut)
async def editar_pregunta(
    pregunta_id: str,
    body: PreguntaEdit,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """El estudiante edita su propia pregunta."""
    texto = body.texto.strip()
    if not texto:
        raise HTTPException(status_code=400, detail="La pregunta no puede estar vacía.")
    if len(texto) > 500:
        raise HTTPException(status_code=400, detail="La pregunta no puede superar los 500 caracteres.")

    with filelock.FileLock(PREGUNTAS_LOCK):
        rows = _read_csv(PREGUNTAS_CSV, PREGUNTAS_COLS)
        updated = []
        target = None
        for r in rows:
            if r["id"] == pregunta_id:
                if r["user_id"] != str(user_id):
                    raise HTTPException(status_code=403, detail="No puedes editar una pregunta que no es tuya.")
                r["texto"] = texto
                r["updated_at"] = datetime.utcnow().isoformat()
                target = r
            updated.append(r)

        if not target:
            raise HTTPException(status_code=404, detail="Pregunta no encontrada.")

        _write_csv(PREGUNTAS_CSV, PREGUNTAS_COLS, updated)

    user = db.query(User).filter(User.id == user_id).first()
    u_name = (user.full_name or user.username) if user else "Estudiante"
    u_classroom = user.classroom or "" if user else ""
    is_anon = target.get("es_anonimo", "0") in ("1", "true", "True", True)

    return {
        **target,
        "es_anonimo": is_anon,
        "user_name": u_name,
        "user_classroom": u_classroom,
        "es_mia": True,
    }


@router.delete("/preguntas/{pregunta_id}", status_code=204)
async def borrar_pregunta(
    pregunta_id: str,
    user_id: int = Depends(get_current_user_id),
):
    """El estudiante borra su propia pregunta."""
    with filelock.FileLock(PREGUNTAS_LOCK):
        rows = _read_csv(PREGUNTAS_CSV, PREGUNTAS_COLS)
        updated = []
        found = False
        for r in rows:
            if r["id"] == pregunta_id:
                if r["user_id"] != str(user_id):
                    raise HTTPException(status_code=403, detail="No puedes borrar una pregunta que no es tuya.")
                found = True
                continue  # La eliminamos simplemente no añadiéndola
            updated.append(r)

        if not found:
            raise HTTPException(status_code=404, detail="Pregunta no encontrada.")

        _write_csv(PREGUNTAS_CSV, PREGUNTAS_COLS, updated)
