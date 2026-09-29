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
PONENCIAS_COLS = ["id", "titulo", "ponente", "descripcion", "created_at", "activa"]
PREGUNTAS_COLS = ["id", "ponencia_id", "user_id", "texto", "created_at", "updated_at"]


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
    """Reescribe el CSV completo con las filas dadas."""
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=cols)
        writer.writeheader()
        writer.writerows(rows)


def _append_csv(path: Path, cols: list, row: dict) -> None:
    """Añade una fila al CSV (más eficiente que reescribir todo)."""
    exists = path.exists()
    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=cols)
        if not exists:
            writer.writeheader()
        writer.writerow(row)


def _get_user_role(db: Session, user_id: int) -> str:
    user = db.query(User).filter(User.id == user_id).first()
    return user.role if user else "student"


# ── Schemas ──────────────────────────────────────────────────────────────────

class PonenciaCreate(BaseModel):
    titulo: str
    ponente: str
    descripcion: Optional[str] = ""


class PonenciaOut(BaseModel):
    id: str
    titulo: str
    ponente: str
    descripcion: str
    created_at: str
    activa: str


class PreguntaCreate(BaseModel):
    texto: str


class PreguntaEdit(BaseModel):
    texto: str


class PreguntaOut(BaseModel):
    id: str
    ponencia_id: str
    user_id: str
    texto: str
    created_at: str
    updated_at: str
    es_mia: bool = False  # True si pertenece al usuario que consulta


# ── Endpoints de Ponencias ───────────────────────────────────────────────────

@router.get("", response_model=List[PonenciaOut])
async def listar_ponencias(
    user_id: int = Depends(get_current_user_id),
):
    """Devuelve todas las ponencias activas."""
    with filelock.FileLock(PONENCIAS_LOCK):
        rows = _read_csv(PONENCIAS_CSV, PONENCIAS_COLS)
    return [r for r in rows if r.get("activa", "1") == "1"]


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
    }

    with filelock.FileLock(PONENCIAS_LOCK):
        _append_csv(PONENCIAS_CSV, PONENCIAS_COLS, nueva)

    return nueva


@router.delete("/{ponencia_id}", status_code=204)
async def desactivar_ponencia(
    ponencia_id: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Desactiva (oculta) una ponencia. Solo docentes."""
    role = _get_user_role(db, user_id)
    if role != "teacher":
        raise HTTPException(status_code=403, detail="Solo los docentes pueden eliminar ponencias.")

    with filelock.FileLock(PONENCIAS_LOCK):
        rows = _read_csv(PONENCIAS_CSV, PONENCIAS_COLS)
        updated = []
        found = False
        for r in rows:
            if r["id"] == ponencia_id:
                r["activa"] = "0"
                found = True
            updated.append(r)
        if not found:
            raise HTTPException(status_code=404, detail="Ponencia no encontrada.")
        _write_csv(PONENCIAS_CSV, PONENCIAS_COLS, updated)


# ── Endpoints de Preguntas ───────────────────────────────────────────────────

@router.get("/{ponencia_id}/preguntas", response_model=List[PreguntaOut])
async def listar_preguntas(
    ponencia_id: str,
    user_id: int = Depends(get_current_user_id),
):
    """Devuelve todas las preguntas de una ponencia.
    Marca con es_mia=True las que pertenecen al usuario que consulta."""
    with filelock.FileLock(PREGUNTAS_LOCK):
        rows = _read_csv(PREGUNTAS_CSV, PREGUNTAS_COLS)

    resultado = []
    for r in rows:
        if r.get("ponencia_id") == ponencia_id:
            resultado.append({
                **r,
                "es_mia": r["user_id"] == str(user_id),
            })

    # Orden: las más recientes primero
    resultado.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return resultado


@router.post("/{ponencia_id}/preguntas", response_model=PreguntaOut, status_code=201)
async def enviar_pregunta(
    ponencia_id: str,
    body: PreguntaCreate,
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
    ponencia = next((p for p in ponencias if p["id"] == ponencia_id and p.get("activa") == "1"), None)
    if not ponencia:
        raise HTTPException(status_code=404, detail="Ponencia no encontrada o inactiva.")

    ahora = datetime.utcnow().isoformat()
    nueva = {
        "id": str(uuid.uuid4()),
        "ponencia_id": ponencia_id,
        "user_id": str(user_id),
        "texto": texto,
        "created_at": ahora,
        "updated_at": ahora,
    }

    with filelock.FileLock(PREGUNTAS_LOCK):
        _append_csv(PREGUNTAS_CSV, PREGUNTAS_COLS, nueva)

    return {**nueva, "es_mia": True}


@router.put("/preguntas/{pregunta_id}", response_model=PreguntaOut)
async def editar_pregunta(
    pregunta_id: str,
    body: PreguntaEdit,
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

    return {**target, "es_mia": True}


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
