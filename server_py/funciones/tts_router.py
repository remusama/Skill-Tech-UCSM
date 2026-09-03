from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..auth.router import get_current_user_id
from .tts import generate_ssml_tts_base64

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    mode: str = "neutral_atenta"


@router.post("/api/tts")
async def tts_endpoint(
    request: TTSRequest,
    user_id: int = Depends(get_current_user_id)
):
    """Requiere usuario autenticado (evita abuso de la cuota de TTS)."""
    try:
        audio_b64 = await generate_ssml_tts_base64(request.text, request.mode)
        if not audio_b64:
            raise HTTPException(status_code=500, detail="Failed to generate audio")
        return {"audio": audio_b64}

    # esto es innecesario de cierta forma, antes el cliente veía el mensaje de excepción interno de Python/OpenAI tal cual
    # si gustan lo quitan nrml, pero es util para que no salga informacion que no deberia ser vista por el usuario

    except HTTPException:
        raise
    
    except Exception as e:
        print(f"❌ Error en endpoint /api/tts: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al generar el audio")