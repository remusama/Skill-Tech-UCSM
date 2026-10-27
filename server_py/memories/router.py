import os
import uuid
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from server_py.auth.router import get_current_user_id
from server_py.common.permisos import check_is_mentor
from server_py.memoria.database import get_db
from server_py.memories.models import MemoryAsset

from fastapi.responses import FileResponse


router = APIRouter(
    prefix="/api/memories",
    tags=["Memories"],
)


BASE_DIR = Path(__file__).resolve().parents[2]

MEMORIES_DIR = BASE_DIR / "uploads" / "memories"
MEMORIES_DIR.mkdir(parents=True, exist_ok=True)


ALLOWED_EXTENSIONS = {
    "photo": {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    },
    "video": {
        ".mp4",
        ".webm",
        ".mov",
    },
    "document": {
        ".pdf",
        ".doc",
        ".docx",
        ".ppt",
        ".pptx",
        ".xls",
        ".xlsx",
        ".txt",
    },
}


MAX_FILE_SIZES = {
    "photo": 15 * 1024 * 1024,      # 15 MB
    "video": 250 * 1024 * 1024,     # 250 MB
    "document": 30 * 1024 * 1024,   # 30 MB
}


CHUNK_SIZE = 1024 * 1024


@router.post("", status_code=status.HTTP_201_CREATED)
def upload_memory(
    title: str = Form(...),
    media_type: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Sube una foto, video o documento.

    Solo usuarios con rol teacher/admin/mentor pueden publicar contenido.
    """

    check_is_mentor(current_user_id, db)

    normalized_type = media_type.strip().lower()

    if normalized_type not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de archivo inválido.",
        )

    clean_title = title.strip()

    if not clean_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El título es obligatorio.",
        )

    if len(clean_title) > 150:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El título no puede superar los 150 caracteres.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo no tiene un nombre válido.",
        )

    original_filename = os.path.basename(file.filename)

    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS[normalized_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"La extensión {extension or 'desconocida'} "
                f"no está permitida para {normalized_type}."
            ),
        )

    stored_filename = f"{uuid.uuid4().hex}{extension}"
    destination = MEMORIES_DIR / stored_filename

    max_size = MAX_FILE_SIZES[normalized_type]
    total_size = 0

    try:
        with destination.open("wb") as output:
            while True:
                chunk = file.file.read(CHUNK_SIZE)

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > max_size:
                    output.close()

                    if destination.exists():
                        destination.unlink()

                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="El archivo supera el tamaño máximo permitido.",
                    )

                output.write(chunk)

        memory = MemoryAsset(
            uploader_id=current_user_id,
            title=clean_title,
            description=(
                description.strip()
                if description and description.strip()
                else None
            ),
            media_type=normalized_type,
            original_filename=original_filename,
            stored_filename=stored_filename,
            content_type=file.content_type,
            size_bytes=total_size,
        )

        db.add(memory)
        db.commit()
        db.refresh(memory)

    except HTTPException:
        raise

    except Exception:
        db.rollback()

        if destination.exists():
            destination.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo guardar el archivo.",
        )

    finally:
        file.file.close()

    return {
        "id": memory.id,
        "title": memory.title,
        "description": memory.description,
        "media_type": memory.media_type,
        "original_filename": memory.original_filename,
        "content_type": memory.content_type,
        "size_bytes": memory.size_bytes,
        "created_at": memory.created_at,
    }


@router.get("")
def list_memories(
    media_type: str | None = Query(
        default=None,
        description="Filtrar por: photo, video o document",
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Lista los recuerdos disponibles.

    Cualquier usuario autenticado puede consultar el contenido.
    """

    query = db.query(MemoryAsset)

    if media_type:
        normalized_type = media_type.strip().lower()

        if normalized_type not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de archivo inválido.",
            )

        query = query.filter(
            MemoryAsset.media_type == normalized_type
        )

    total = query.count()

    memories = (
        query
        .order_by(
            MemoryAsset.created_at.desc(),
            MemoryAsset.id.desc(),
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "items": [
            {
                "id": memory.id,
                "title": memory.title,
                "description": memory.description,
                "media_type": memory.media_type,
                "original_filename": memory.original_filename,
                "content_type": memory.content_type,
                "size_bytes": memory.size_bytes,
                "created_at": memory.created_at,
            }
            for memory in memories
        ],
    }


@router.get("/{memory_id}/file")
def get_memory_file(
    memory_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Devuelve el archivo físico de un recuerdo.

    Disponible para cualquier usuario autenticado.
    """

    memory = (
        db.query(MemoryAsset)
        .filter(MemoryAsset.id == memory_id)
        .first()
    )

    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recuerdo no encontrado.",
        )

    file_path = MEMORIES_DIR / memory.stored_filename

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El archivo físico no existe.",
        )

    return FileResponse(
        path=file_path,
        media_type=memory.content_type or "application/octet-stream",
        filename=memory.original_filename,
        content_disposition_type="inline",
    )