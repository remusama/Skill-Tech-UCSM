import openai

from server_py.config import settings

# === Delegación de configuración ===
# Las claves API se heredan de settings.py
OPENAI_API_KEY = settings.OPENAI_API_KEY
client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

# === Cliente de OpenAI ===
# Cliente asincrónico preconfigurado con clave API
GEMINI_API_KEY = settings.GEMINI_API_KEY
ELEVENLABS_API_KEY = settings.ELEVENLABS_API_KEY

# === Constantes de voz para Text-to-Speech ===
# Compatible con Azure Speech Services, OpenAI, y ElevenLabs respectivamente
VOICE_EDGE = "es-MX-DaliaNeural"
VOICE_OPENAI = "nova"
VOICE_ELEVENLABS = getattr(settings, "VOICE_ELEVENLABS", "Gaby")
TTS_ENGINE = getattr(settings, "TTS_ENGINE", "edge")
