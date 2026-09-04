from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from ..auth.router import get_current_user_id
from .stt import transcribe_audio_whisper

router = APIRouter()


@router.post("/api/stt")
async def speech_to_text(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id) # Aqui fast API esta exigiendo si o si un JWT valido antes de pasar a lapeticion, si no hay token o es invalido, nos dara 401 antes de usar la api
):
    """
    Endpoint para recibir audio del frontend y devolver la transcripción.
    Requiere usuario autenticado.
    """
    # evita abuso de la cuota de Whisper
    try:
        audio_bytes = await file.read()
        print(f"📥 [STT] Recibido audio de user_id={user_id}: {len(audio_bytes)} bytes, nombre: {file.filename}")

        text = await transcribe_audio_whisper(audio_bytes, file.filename)

        if text:
            return {"status": "ok", "text": text}
        else:
            raise HTTPException(status_code=500, detail="Error en la transcripción")

    except HTTPException:
        raise
    except Exception as e:
        # esto es innecesario de cierta forma, antes el cliente veía el mensaje de excepción interno de Python/OpenAI tal cual
        # si gustan lo quitan nrml, pero es util para que no salga informacion que no deberia ser vista por el usuario
        print(f"❌ Error en endpoint /api/stt: {str(e)}") 
        raise HTTPException(status_code=500, detail="Error interno al procesar el audio")