"""Servicio de transcripción de audio mediante OpenAI Whisper.

Recibe bytes de audio, crea un archivo temporal, solicita su transcripción
a OpenAI y elimina el archivo temporal al finalizar el proceso.
"""

import os
import tempfile

from server_py.config.app_config import client as client_openai


async def transcribe_audio_whisper(
    audio_bytes: bytes,
    filename: str = "temp_audio.webm",
) -> str:
    """Transcribe audio utilizando el modelo OpenAI Whisper.

    El audio se guarda temporalmente con la extensión del archivo original.
    Si no existe un cliente de OpenAI o ocurre un error, devuelve None.

    Args:
        audio_bytes: Contenido binario del archivo de audio.
        filename: Nombre del archivo original para conservar su extensión.

    Returns:
        Texto transcrito por Whisper o None si la operación falla.
    """
    if not client_openai:
        print("⚠️ OpenAI API Key no configurada para STT")
        return None

    temp_file_path = None

    try:
        suffix = os.path.splitext(filename)[1] or ".webm"

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
        ) as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name

        print(
            f"🎙️ [STT] Transcribiendo archivo: {temp_file_path}"
        )

        with open(temp_file_path, "rb") as audio_file:
            transcript = await client_openai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="es"
            )

        print(f"📝 [STT] Resultado: '{transcript.text}'")
        return transcript.text

    except Exception as e:
        print(f"❌ Error en Whisper STT: {str(e)}")
        return None

    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
