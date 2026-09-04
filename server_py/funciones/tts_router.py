"""Endpoint autenticado para generar audio mediante el servicio TTS."""

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
)
from pydantic import BaseModel

from ..auth.router import get_current_user_id
from .tts import generate_ssml_tts_base64

router = APIRouter()


class TTSRequest(BaseModel):
    """Datos necesarios para convertir texto en audio."""
    text: str
    mode: str = "neutral_atenta"


@router.post("/api/tts")
async def tts_endpoint(
    request: TTSRequest,
    user_id: int = Depends(get_current_user_id)
):
    """Genera audio a partir de texto para un usuario autenticado.

    Args:
        request: Texto y modo vocal solicitado.
        user_id: Identificador del usuario autenticado.

    Returns:
        Un diccionario con el audio codificado en Base64.

    Raises:
        HTTPException: Si no se puede generar el audio o ocurre un error
            inesperado.
    """
    try:
        audio_b64 = await generate_ssml_tts_base64(
            request.text,
            request.mode,
        )
        if not audio_b64:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate audio",
            )

        return {"audio": audio_b64}
    
    except HTTPException:
        raise
    
    except Exception as e:
        # Evita exponer detalles internos al usuario.
        print(
            f"❌ Error en endpoint /api/tts: {str(error)}"
        )
        raise HTTPException(
            status_code=500,
            detail="Error interno al generar el audio",
        )