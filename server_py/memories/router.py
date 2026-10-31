import os
import uuid
import logging
import jwt
from fastapi import Query

from pathlib import Path
from fastapi import Request, Response
from PIL import Image, UnidentifiedImageError

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
from datetime import datetime, timedelta, timezone

from server_py.auth.router import ALGORITHM, SECRET_KEY
from server_py.auth.router import get_current_user_id
from server_py.common.permisos import check_is_mentor
from server_py.memoria.database import get_db
from server_py.memories.models import MemoryAsset
from server_py.memories.upload_validation import (
    validate_nonphoto_upload,
)

from fastapi.responses import FileResponse


logger = logging.getLogger(__name__)


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


PHOTO_FORMATS = {
    ".jpg": ("JPEG", "image/jpeg"),
    ".jpeg": ("JPEG", "image/jpeg"),
    ".png": ("PNG", "image/png"),
    ".webp": ("WEBP", "image/webp"),
}

MAX_PHOTO_PIXELS = 30_000_000


def validate_photo(file_path: Path, extension: str) -> str:
    """
    Valida el formato real, integridad y dimensiones
    de una fotografía subida al servidor.

    Devuelve el MIME real de la imagen.
    """

    expected_format, content_type = PHOTO_FORMATS[extension]

    try:
        with Image.open(file_path) as image:
            if image.format != expected_format:
                raise ValueError("El formato no coincide.")

            width, height = image.size

            if width * height > MAX_PHOTO_PIXELS:
                raise ValueError("Imagen demasiado grande.")

            if getattr(image, "is_animated", False):
                raise ValueError(
                    "No se permiten imágenes animadas."
                )

            image.verify()

        # Reabrir para comprobar también la decodificación.
        with Image.open(file_path) as image:
            image.load()

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        SyntaxError,
        Image.DecompressionBombError,
    ) as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La imagen no es válida, está dañada "
                "o no coincide con su extensión."
            ),
        ) from error

    return content_type


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

        if total_size == 0:
            destination.unlink(missing_ok=True)

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se permiten archivos vacíos.",
            )

        validated_content_type = file.content_type

        if normalized_type == "photo":
            validated_content_type = validate_photo(
                destination,
                extension,
            )

        elif normalized_type in ("video", "document"):
            validated_content_type = validate_nonphoto_upload(
                destination,
                normalized_type,
                extension,
            )

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
            content_type=validated_content_type,
            size_bytes=total_size,
        )

        db.add(memory)
        db.commit()
        db.refresh(memory)

    except HTTPException:
        db.rollback()
        destination.unlink(missing_ok=True)
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
        content_disposition_type="attachment",
        headers={
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
        },
    )


@router.delete(
    "/{memory_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_memory(
    memory_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Elimina permanentemente un recuerdo.

    Solo docentes o mentores autorizados pueden eliminar.
    """

    check_is_mentor(current_user_id, db)

    memory = (
        db.query(MemoryAsset)
        .filter(MemoryAsset.id == memory_id)
        .first()
    )

    if memory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recuerdo no encontrado.",
        )

    # Evitar rutas de archivo manipuladas.
    stored_filename = memory.stored_filename

    if (
        not stored_filename
        or Path(stored_filename).name != stored_filename
    ):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Nombre de archivo almacenado inválido.",
        )

    file_path = MEMORIES_DIR / stored_filename

    # Primero eliminar el registro de la base de datos.
    try:
        db.delete(memory)
        db.commit()

    except Exception:
        db.rollback()

        logger.exception(
            "Error al eliminar el recuerdo %s de la BD",
            memory_id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo eliminar el recuerdo.",
        )

    # Después retirar el archivo físico.
    try:
        file_path.unlink(missing_ok=True)

    except OSError:
        logger.exception(
            "No se pudo eliminar el archivo físico del recuerdo %s",
            memory_id,
        )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


# Tiempo máximo de validez del acceso temporal.
VIDEO_STREAM_TOKEN_MINUTES = 15

VIDEO_CONTENT_TYPES = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
}


@router.post("/{memory_id}/stream-access")
def create_video_stream_access(
    memory_id: int,
    response: Response,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Genera un acceso temporal para reproducir un video.

    Disponible para estudiantes y docentes autenticados.
    """

    memory = db.get(MemoryAsset, memory_id)

    if memory is None or memory.media_type != "video":
        raise HTTPException(
            status_code=404,
            detail="Video no encontrado.",
        )

    now = datetime.now(timezone.utc)

    payload = {
        "purpose": "memory-video-stream",
        "memory_id": memory.id,
        "sub": str(current_user_id),
        "iat": now,
        "exp": now + timedelta(
            minutes=VIDEO_STREAM_TOKEN_MINUTES
        ),
    }

    stream_token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    response.set_cookie(
        key=f"memory_stream_{memory_id}",
        value=stream_token,
        max_age=VIDEO_STREAM_TOKEN_MINUTES * 60,
        path=f"/api/memories/{memory_id}/stream",
        httponly=True,
        secure=os.getenv(
            "MEMORY_COOKIE_SECURE", "false"
        ).lower() == "true",
        samesite="lax",
    )

    response.headers["Cache-Control"] = "no-store"

    return {
        "expires_in": VIDEO_STREAM_TOKEN_MINUTES * 60,
    }


@router.get("/{memory_id}/stream")
def stream_memory_video(
    memory_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Reproduce videos mediante FileResponse.

    El acceso requiere un token temporal firmado,
    limitado al video solicitado.
    """

    stream_token = request.cookies.get(
        f"memory_stream_{memory_id}"
    )

    if not stream_token:
        raise HTTPException(
            status_code=401,
            detail="Acceso temporal no disponible.",
        )

    try:
        payload = jwt.decode(
            stream_token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["exp"]},
        )

    except jwt.PyJWTError:
        raise HTTPException(
            status_code=401,
            detail="Acceso de video inválido o expirado.",
        )

    if (
        payload.get("purpose") != "memory-video-stream"
        or payload.get("memory_id") != memory_id
    ):
        raise HTTPException(
            status_code=403,
            detail="Acceso no autorizado para este video.",
        )

    memory = db.get(MemoryAsset, memory_id)

    if memory is None or memory.media_type != "video":
        raise HTTPException(
            status_code=404,
            detail="Video no encontrado.",
        )

    # Restringir la ruta al directorio de recuerdos.
    base_dir = MEMORIES_DIR.resolve()

    file_path = (
        base_dir / memory.stored_filename
    ).resolve()

    if file_path.parent != base_dir:
        raise HTTPException(
            status_code=500,
            detail="Ruta de archivo inválida.",
        )

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="El archivo de video no existe.",
        )

    media_type = VIDEO_CONTENT_TYPES.get(
        file_path.suffix.lower()
    )

    if media_type is None:
        raise HTTPException(
            status_code=415,
            detail="Formato de video no compatible.",
        )

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=memory.original_filename,
        content_disposition_type="inline",
        headers={
            "Cache-Control": "private, no-store",
            "Referrer-Policy": "no-referrer",
            "X-Content-Type-Options": "nosniff",
        },
    )