"""Funciones auxiliares para generar audio mediante ElevenLabs.

Este módulo convierte texto a audio codificado en Base64 y solicita tokens
de uso único para conexiones WebSocket de ElevenLabs.
"""

import base64

import httpx
from elevenlabs.client import AsyncElevenLabs

from server_py.config.app_config import (
    ELEVENLABS_API_KEY,
    VOICE_ELEVENLABS,
)

client_eleven = None
if ELEVENLABS_API_KEY:
    client_eleven = AsyncElevenLabs(
        api_key=ELEVENLABS_API_KEY,
    )


async def generate_eleven_audio_base64(
    text: str,
    voice_id: str = None,
) -> str:
    """Genera audio con ElevenLabs y lo devuelve codificado en Base64.

    Si no existe una clave API configurada, devuelve None.
    """
    if not client_eleven:
        print("⚠️ ElevenLabs API Key no configurada")
        return None

    selected_voice = voice_id or VOICE_ELEVENLABS

    try:
        print(
            f"🔊 [ElevenLabs] Generando audio ({selected_voice}): "
            f"'{text[:30]}...'"
        )
        audio_iterator = await client_eleven.generate(
            text=text,
            voice=selected_voice,
            model="eleven_multilingual_v2",
        )

        audio_data = b""
        async for chunk in audio_iterator:
            audio_data += chunk

        return base64.b64encode(audio_data).decode('utf-8')

    except Exception as e:
        print(f"❌ Error en ElevenLabs: {str(e)}")
        return None


async def generate_eleven_sut(
    token_type: str = "tts_websocket",
) -> str:
    """Genera un token de uso único para ElevenLabs.

    Si no existe una clave API configurada o la solicitud falla, devuelve
    None.
    """
    if not ELEVENLABS_API_KEY:
        return None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                (
                    "https://api.elevenlabs.io/v1/"
                    f"single-use-token/{token_type}"
                ),
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                },
            )
            data = response.json()

        return data.get("token")
    except Exception as e:
        print(f"❌ Error ElevenLabs SUT: {str(e)}")
        return None
