from fastapi import APIRouter, UploadFile, File, HTTPException
from .stt import transcribe_audio_whisper

router = APIRouter()

@router.post("/api/stt")
async def speech_to_text(file: UploadFile = File(...)):
    """
    Endpoint para recibir audio del frontend y devolver la transcripción.
    """
    try:
        audio_bytes = await file.read()
        print(f"📥 [STT] Recibido audio: {len(audio_bytes)} bytes, nombre: {file.filename}")
        
        text = await transcribe_audio_whisper(audio_bytes, file.filename)
        
        if text:
            return {"status": "ok", "text": text}
        else:
            raise HTTPException(status_code=500, detail="Error en la transcripción")
            
    except Exception as e:
        print(f"❌ Error en endpoint /api/stt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
