"""Servicios de síntesis de voz para los motores configurados.

Este módulo genera audio mediante Edge-TTS, OpenAI TTS o ElevenLabs,
según el motor seleccionado en TTS_ENGINE. Las respuestas de audio se
devuelven codificadas en Base64.
"""
import base64
import re

import edge_tts

from server_py.config.app_config import (
    VOICE_EDGE,
    VOICE_OPENAI,
    TTS_ENGINE as TTS_ENGINE_CONFIG,
    client as client_openai,
)

from .eleven_labs import generate_eleven_audio_base64


# Motor de voz activo: edge, openai o eleven (configurado desde .env).
TTS_ENGINE = TTS_ENGINE_CONFIG


# Configuración de los modos de voz para Edge-TTS.
SSML_MODES = {
    "neutral_atenta": {
        "rate": "+0%",
        "pitch": "+0Hz",
        "volume": "+0%",
        "emphasis": "none"
    },
    "calma_acompañante": {
        "rate": "-10%",
        "pitch": "-2Hz",
        "volume": "-10%",
        "emphasis": "reduced"
    },
    "directiva_suave": {
        "rate": "+5%",
        "pitch": "+1Hz",
        "volume": "+5%",
        "emphasis": "moderate"
    },
    "reflexiva": {
        "rate": "-15%",
        "pitch": "-1Hz",
        "volume": "-5%",
        "emphasis": "reduced"
    },
    "energia_contenida": {
        "rate": "+10%",
        "pitch": "+2Hz",
        "volume": "+10%",
        "emphasis": "strong"
    }
}


def get_vocal_intention(state: dict) -> dict:
    """Traduce el estado cognitivo en una intención vocal para OpenAI TTS.

    Returns:
        Un diccionario con la voz, velocidad e intención calculadas.
    """
    t = state.get("tension", 0.5)
    e = state.get("engagement", 0.5)
    v = state.get("valence", "neutra")

    # Mapeo de Intenciones
    # 1. Tensión alta -> voz más lenta
    # 2. Interés alto -> claridad (usualmente velocidad estable o ligeramente mayor)
    # 3. Valencia negativa -> tono más pausado
    speed = 0.95

    if t > 0.7:
        speed = 0.9
    elif t < 0.3:
        speed = 0.95

    # El interés modifica ligeramente la velocidad.
    if e > 0.8:
        speed += 0.05
    elif e < 0.3:
        speed -= 0.05

    return {
        "voice": VOICE_OPENAI,
        "speed": round(speed, 2),
        "intention": (
            f"T:{tension:.2f} "
            f"E:{engagement:.2f} "
            f"V:{valence}"
        ),
    }


def wrap_ssml(text: str, mode: str) -> str:
    """Envuelve un texto en SSML con el modo de voz seleccionado."""
    config = SSML_MODES.get(
        mode,
        SSML_MODES["neutral_atenta"],
    )
    rate = config["rate"]
    volume = config["volume"]
    pitch = config["pitch"]

    ssml = f"""
    <speak
        version="1.0"
        xmlns="http://www.w3.org/2001/10/synthesis"
        xml:lang="es-MX"
    >
        <voice name="{VOICE_EDGE}">
            <prosody
                rate="{rate}"
                volume="{volume}"
                pitch="{pitch}"
            >
                {text}
            </prosody>
        </voice>
    </speak>
    """

    return ssml.strip()


async def generate_openai_tts_base64(
    text: str,
    state: dict,
) -> str:
    """Genera audio con OpenAI TTS y lo devuelve en Base64."""
    if not client_openai:
        print("⚠️ OpenAI API Key no configurada para TTS")
        return None

    try:
        intention = get_vocal_intention(state)
        print(
            f"🔊 Generando Audio OpenAI "
            f"({intention['voice']}, speed: {intention['speed']}): "
            f"'{text[:30]}...'"
        )
        response = await client_openai.audio.speech.create(
            model="tts-1",
            voice=intention["voice"],
            input=text,
            speed=intention["speed"]
        )

        audio_data = response.content
        return base64.b64encode(audio_data).decode('utf-8')

    except Exception as e:
        print(f"❌ Error en OpenAI TTS: {str(e)}")
        return None


async def generate_ssml_tts_base64(
    text: str,
    mode: str = "neutral_atenta",
    state: dict = None,
) -> str:
    """Genera audio usando el motor definido en TTS_ENGINE.

    Limpia etiquetas internas generadas por el modelo y aplica el modo
    vocal seleccionado antes de generar el audio.
    """

    # Elimina etiquetas internas que el modelo pueda haber incluido.
    clean_text = re.sub(
        r"\[(DECISION|ANALISIS|ANALYSIS|GAME|TEXTO)\].*?(\[|$)",
        "",
        text,
        flags=re.DOTALL,
    )
    clean_text = re.sub(r"\[.*?\]", "", clean_text).strip()

    # Agrega signos de apertura cuando solo existe el signo de cierre.
    if '?' in clean_text and '¿' not in clean_text:
        clean_text = '¿' + clean_text
    if '!' in clean_text and '¡' not in clean_text:
        clean_text = '¡' + clean_text

    default_state = {
        "tension": 0.5,
        "engagement": 0.5,
        "valence": "neutra",
    }
    active_state = state or default_state

    if TTS_ENGINE == "openai":
        if not clean_text or not clean_text.strip():
            print("⚠️ TTS cancelado: El texto resultante está vacío.")
            return None

        return await generate_openai_tts_base64(
            clean_text,
            active_state,
        )

    if TTS_ENGINE == "eleven":
        return await generate_eleven_audio_base64(clean_text)

    # Edge-TTS utiliza parámetros directos para evitar leer etiquetas SSML.
    try:
        config = SSML_MODES.get(
            mode,
            SSML_MODES["neutral_atenta"],
        )
        rate = config["rate"]
        volume = config["volume"]
        pitch = config["pitch"]

        print(
            f"🔊 Generando Audio Edge-TTS (Modo: {mode}): "
            f"'{clean_text[:30]}...'"
        )

        communicate = edge_tts.Communicate(
            clean_text,
            VOICE_EDGE,
            rate=rate,
            pitch=pitch,
            volume=volume,
        )
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]

        if not audio_data:
            return None

        return base64.b64encode(audio_data).decode('utf-8')

    except Exception as e:
        print(f"❌ Error en Edge TTS: {str(e)}")
        return None


async def generate_tts_base64(
    text: str,
    rate: str = "+0%",
    pitch: str = "+0Hz",
) -> str:
    """Genera audio con Edge-TTS usando velocidad y tono directos."""
    try:
        communicate = edge_tts.Communicate(
            text,
            VOICE_EDGE,
            rate=rate,
            pitch=pitch,
        )
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        if not audio_data:
            return None

        return base64.b64encode(audio_data).decode("utf-8")

    except Exception:
        return None