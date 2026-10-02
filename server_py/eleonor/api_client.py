"""Enrutador para servicios legados o en proceso de deprecación."""

from fastapi import APIRouter, File, HTTPException, UploadFile, status

router = APIRouter()


@router.post("/api/gemini/listen")
async def gemini_listen(file: UploadFile = File(...)):
    """Endpoint legado para el procesamiento de sensores de audio.

    Esta funcionalidad fue removida del sistema tras la eliminación
    del módulo 'sensors'.

    Args:
        file: Archivo de audio recibido en la petición.

    Raises:
        HTTPException: Devuelve un estado 501 (Not Implemented) para notificar
            que el endpoint ya no está operativo.
    """

    print("⚠️ [GEMINI-LISTEN] Endpoint llamado pero la funcionalidad fue removida.")

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="This endpoint is deprecated and the sensors module has been removed.",
    )