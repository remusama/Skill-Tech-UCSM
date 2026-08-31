import openai
from server_py.config import settings

# Delegate configurations to settings in config.py
OPENAI_API_KEY = settings.OPENAI_API_KEY
client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

GEMINI_API_KEY = settings.GEMINI_API_KEY
ELEVENLABS_API_KEY = settings.ELEVENLABS_API_KEY

# Constant voice configurations
VOICE_EDGE = "es-MX-DaliaNeural"
VOICE_OPENAI = "nova"
VOICE_ELEVENLABS = "Mady"  # ID placeholder
