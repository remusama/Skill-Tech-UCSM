"""Endpoint autenticado para transcribir audio mediante OpenAI Whisper."""

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)

from ..auth.router import get_current_user_id
from .stt import transcribe_audio_whisper

router = APIRouter()


@router.post("/api/stt")
async def speech_to_text(
    file: UploadFile = File(...),
    # La dependencia exige un JWT válido antes de procesar el audio.
    user_id: int = Depends(get_current_user_id),
):
    """Recibe un archivo de audio y devuelve su transcripción.

    El endpoint requiere un usuario autenticado y delega la transcripción
    al servicio que utiliza OpenAI Whisper.

    Returns:
        Un diccionario con el estado de la operación y el texto transcrito.

    Raises:
        HTTPException: Si la transcripción falla o ocurre un error interno.
    """
    try:
        audio_bytes = await file.read()
        print(
            f"📥 [STT] Recibido audio de user_id={user_id}: "
            f"{len(audio_bytes)} bytes, nombre: {file.filename}"
        )
        text = await transcribe_audio_whisper(
            audio_bytes,
            file.filename,
        )
        if text:
            return {"status": "ok", "text": text}
        raise HTTPException(
            status_code=500,
            detail="Error en la transcripción",
        )

    except HTTPException:
        raise

    except Exception as error:
        # Evita exponer detalles internos al usuario.
        print(
            f"❌ Error en endpoint /api/stt: {str(error)}"
        )
        raise HTTPException(
            status_code=500,
            detail="Error interno al procesar el audio",
        )