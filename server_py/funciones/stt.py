import os
import tempfile
from server_py.config.app_config import client as client_openai, OPENAI_API_KEY

async def transcribe_audio_whisper(audio_bytes: bytes, filename: str = "temp_audio.webm"):
    """
    Recibe bytes de audio, los guarda temporalmente y los transcribe usando OpenAI Whisper.
    """
    if not client_openai:
        print("⚠️ OpenAI API Key no configurada para STT")
        return None

    temp_file_path = None
    try:
        # 1. Crear un archivo temporal para Whisper
        suffix = os.path.splitext(filename)[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name

        print(f"🎙️ [STT] Transcribiendo archivo: {temp_file_path}")

        # 2. Llamar a OpenAI Whisper
        with open(temp_file_path, "rb") as audio_file:
            transcript = await client_openai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="es" # Forzamos español para mejor precisión
            )

        print(f"📝 [STT] Resultado: '{transcript.text}'")
        return transcript.text

    except Exception as e:
        print(f"❌ Error en Whisper STT: {str(e)}")
        return None
    finally:
        # 3. Limpieza del archivo temporal
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
