import edge_tts
import base64
import json
import os
from server_py.config.app_config import client as client_openai, OPENAI_API_KEY, VOICE_EDGE, VOICE_OPENAI, ELEVENLABS_API_KEY
from .eleven_labs import generate_eleven_audio_base64

# Configuración de Motores de Voz
TTS_ENGINE = "edge"  # "edge" | "openai" | "eleven"

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
    """
    Traduce el estado cognitivo en una intención vocal abstracta para OpenAI TTS.
    Retorna un diccionario con 'speed' y 'voice' (y otros parámetros si existieran).
    """
    t = state.get("tension", 0.5)
    e = state.get("engagement", 0.5)
    v = state.get("valence", "neutra")

    # Mapeo de Intenciones
    # 1. Tensión alta -> voz más lenta
    # 2. Interés alto -> claridad (usualmente velocidad estable o ligeramente mayor)
    # 3. Valencia negativa -> tono más pausado

    speed = 0.95

    # Ajuste por tensión (0.0 a 1.0)
    # Si tensión es alta, bajamos velocidad hasta 0.85
    if t > 0.7:
        speed = 0.9
    elif t < 0.3:
        # Relajación completa
        speed = 0.95

    # Ajuste por engagement
    if e > 0.8:
        speed += 0.05  # Un poco más activa
    elif e < 0.3:
        speed -= 0.05  # Un poco más cansada

    return {
        "voice": VOICE_OPENAI,
        "speed": round(speed, 2),
        "intention": f"T:{t:.2f} E:{e:.2f} V:{v}"  # Para debugging
    }


def wrap_ssml(text: str, mode: str) -> str:
    """Envuelve el texto en SSML basado en el modo seleccionado (para Edge-TTS)."""
    config = SSML_MODES.get(mode, SSML_MODES["neutral_atenta"])
    rate = config["rate"]
    volume = config["volume"]
    pitch = config["pitch"]

    ssml = f"""
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-MX">
        <voice name="{VOICE_EDGE}">
            <prosody rate="{rate}" volume="{volume}" pitch="{pitch}">
                {text}
            </prosody>
        </voice>
    </speak>
    """
    return ssml.strip()


async def generate_openai_tts_base64(text: str, state: dict) -> str:
    """Genera audio usando OpenAI TTS basado en la intención vocal."""
    if not client_openai:
        print("⚠️ OpenAI API Key no configurada para TTS")
        return None

    try:
        intention = get_vocal_intention(state)
        print(f"🔊 Generando Audio OpenAI ({intention['voice']}, speed: {intention['speed']}): '{text[:30]}...'")

        response = await client_openai.audio.speech.create(
            model="tts-1",
            voice=intention["voice"],
            input=text,
            speed=intention["speed"]
        )

        # Obtener bytes del audio
        audio_data = response.content
        return base64.b64encode(audio_data).decode('utf-8')
    except Exception as e:
        print(f"❌ Error en OpenAI TTS: {str(e)}")
        return None


async def generate_ssml_tts_base64(text: str, mode: str = "neutral_atenta", state: dict = None) -> str:
    """Fachada principal para generación de voz. Selecciona motor según flag."""
    
    # Limpiamos posibles etiquetas de control o emoción que el LLM pudiera haber colado
    import re
    clean_text = re.sub(r'\[(DECISION|ANALISIS|ANALYSIS|GAME|TEXTO)\].*?(\[|$)', '', text, flags=re.DOTALL).strip()
    clean_text = re.sub(r'\[.*?\]', '', clean_text).strip()

    # Normalización para forzar contexto español en modelos multilingües
    # 1. Asegurar signos de apertura (¿ ¡) si hay cierre
    if '?' in clean_text and '¿' not in clean_text:
        clean_text = '¿' + clean_text
    if '!' in clean_text and '¡' not in clean_text:
        clean_text = '¡' + clean_text

    # 2. Ajustar velocidad base para mayor claridad (Nova a 1.0 puede sonar apresurada)
    default_state = {"tension": 0.5, "engagement": 0.5, "valence": "neutra"}
    active_state = state or default_state

    if TTS_ENGINE == "openai":
        # Validación crítica para evitar error 400 en OpenAI (input string should have at least 1 character)
        if not clean_text or not clean_text.strip():
            print("⚠️ TTS cancelado: El texto resultante está vacío.")
            return None

        # Anchor point: Agregamos un prefijo invisible o espacio para asentar el motor en ES
        # Aunque Nova detecta el idioma por el texto, un texto bien puntuado es la mejor ancla.
        return await generate_openai_tts_base64(clean_text, active_state)

    if TTS_ENGINE == "eleven":
        return await generate_eleven_audio_base64(clean_text)

    # Motor Edge-TTS: Usamos parámetros directos en lugar de SSML para evitar que lea las etiquetas
    try:
        config = SSML_MODES.get(mode, SSML_MODES["neutral_atenta"])
        rate = config["rate"]
        volume = config["volume"]
        pitch = config["pitch"]

        print(f"🔊 Generando Audio Edge-TTS (Modo: {mode}): '{clean_text[:30]}...'")

        communicate = edge_tts.Communicate(clean_text, VOICE_EDGE, rate=rate, pitch=pitch, volume=volume)
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


async def generate_tts_base64(text: str, rate="+0%", pitch="+0Hz") -> str:
    """Generador simple (Legacy/Fallback)."""
    try:
        communicate = edge_tts.Communicate(text, VOICE_EDGE, rate=rate, pitch=pitch)
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        return base64.b64encode(audio_data).decode('utf-8') if audio_data else None
    except Exception:
        return None
