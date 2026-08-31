import io
import json
import asyncio
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from openai import AsyncOpenAI
from server_py.config import settings
from server_py.core.structured_logger import get_logger
from ..memoria.database import get_db
from ..auth.router import get_current_user_id

logger = get_logger("voice")

router = APIRouter(prefix="/voice", tags=["voice"])

# Centralized client using Settings config
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# Concurrency semaphore to throttle concurrent OpenAI transcription/eval calls
voice_semaphore = asyncio.Semaphore(5)


@router.post("/evaluate")
async def evaluate_voice_response(
    file: UploadFile = File(...),
    target_objective: str = None,
    expected_answer: str = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    try:
        # 1. Size Validation (Max 10MB)
        audio_content = await file.read()
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        if len(audio_content) > MAX_FILE_SIZE:
            logger.error(
                f"El archivo de audio {file.filename} excede el límite de tamaño de 10MB ({len(audio_content)} bytes)")
            raise HTTPException(status_code=413, detail="Audio file too large. Max 10MB.")

        logger.info(
            f"Iniciando evaluación de voz para el usuario {user_id}. Archivo: {file.filename} ({len(audio_content)} bytes)")

        audio_file = io.BytesIO(audio_content)
        audio_file.name = "audio.webm"

        async with voice_semaphore:
            # 2. Transcription using Whisper (Async)
            logger.info(f"Llamando a Whisper para el usuario {user_id}")
            transcript = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )

            # 3. AI Analysis of the response (Async)
            system_prompt = """
            ERES UN EVALUADOR DE RESPUESTAS POR VOZ DE SKILLTECH.
            Analiza la transcripción del usuario y compárala con el objetivo o respuesta esperada.
            Debes ser motivador pero preciso.
            Si la respuesta es correcta o demuestra comprensión, otorga 'status': 'success'.
            Si está errada, otorga 'status': 'error' y da una breve pista.
            Responde SIEMPRE en JSON con las claves: success (bool), feedback (string), transcription (string).
            """

            user_prompt = f"""
            OBJETIVO DEL RETO: {target_objective}
            RESPUESTA IDEAL (referencia): {expected_answer}
            TRANSCRIPCIÓN DEL USUARIO: {transcript}

            Evalúa si el usuario ha captado la esencia del concepto.
            """

            logger.info(f"Llamando a GPT para evaluar respuesta de voz del usuario {user_id}")
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )

        result = json.loads(response.choices[0].message.content)
        result["transcription"] = transcript

        logger.info(f"Evaluación de voz completada con éxito para el usuario {user_id}")
        return result

    except Exception as e:
        logger.error(f"Error en evaluación de voz para usuario {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
