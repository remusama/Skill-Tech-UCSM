from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .tts import generate_ssml_tts_base64, is_tts_enabled

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    mode: str = "neutral_atenta"


@router.post("/api/tts")
async def tts_endpoint(request: TTSRequest):
    if not is_tts_enabled():
        return {"audio": None, "disabled": True}

    try:
        audio_b64 = await generate_ssml_tts_base64(request.text, request.mode)
        if not audio_b64:
            raise HTTPException(status_code=500, detail="Failed to generate audio")
        return {"audio": audio_b64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
