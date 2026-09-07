import os
import sys
import requests
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, ".env")
load_dotenv(env_path)

api_key = os.getenv("ELEVENLABS_API_KEY")

# Usar voz premade compatible con tier gratuito
# 'cgSgspJ2msm6clMCkdW9': Jessica (Playful, Bright, Warm) - habla excelente español con eleven_multilingual_v2
# 'Xb7hH8MSUJpSbSDYk0k2': Alice (Clear, Engaging Educator)
voice_id = os.getenv("VOICE_ELEVENLABS", "cgSgspJ2msm6clMCkdW9")

if not api_key:
    print("❌ Error: ELEVENLABS_API_KEY no encontrada en .env")
    sys.exit(1)

ONBOARDING_SCRIPTS = [
    {
        "id": "presentacion",
        "text": "Hola futuro lider soy Moya, tu asistente felino en el programa. Empecemos este recorrido por la plataforma."
    },
    {
        "id": "guia_inicio",
        "text": "SkillTech es un ecosistema diseñado para analizar tus habilidades académicas y personales."
    },
    {
        "id": "guia_credencial",
        "text": "Un buen lider no deja huella sin el check-in respectivo. Toca tu credencial aqui arriba para abrir tu QR y registrar tu llegada a mover el territorio."
    },
    {
        "id": "guia_skillmap",
        "text": "En tu SkillMap verás una radiografia de las distintas clases que tendremos en el programa. ¡Anticípate a la jugada y descubre hacia dónde vamos a mover el territorio!"
    },
    {
        "id": "guia_examenes_intro",
        "text": "¡Tu primer gran chequeo de habilidades! Aquí descubre el estilo de liderazgo con el que vas a marcar la diferencia, además de otros tipos de evaluaciones."
    },
    {
        "id": "guia_diagnostico",
        "text": "Este es tu Liderometro. Vuelve aquí cuando quieras para revisar tus métricas, ver cómo van tus fortalezas y celebrar tu evolución sábado a sábado."
    },
    {
        "id": "guia_configuracion",
        "text": "Tu espacio privado a salvo! En esta sección puedes consultar tu información personal. Hazme caso y dale una renovada a tu contraseña; un verdadero líder siempre cuida sus espaldas."
    },
    {
        "id": "guia_asistente",
        "text": "¡Llegó la hora de medir tu potencial! Ve resolviendo con calma que el camino es largo. Yo aprovecho para mi recarga de batería felina... ¡Todo el éxito, crack!"
    }
]

output_dir = os.path.join(base_dir, "public", "audio", "onboarding")
os.makedirs(output_dir, exist_ok=True)

headers = {
    "xi-api-key": api_key,
    "Content-Type": "application/json"
}

def generate_all():
    print(f"🎙️ Generando audios MP3 estáticos con ElevenLabs (Voice ID: {voice_id})...")
    print(f"📁 Directorio de destino: {output_dir}\n")

    success_count = 0
    for item in ONBOARDING_SCRIPTS:
        script_id = item["id"]
        text = item["text"]
        file_path = os.path.join(output_dir, f"{script_id}.mp3")

        print(f"🔊 Generando '{script_id}.mp3' -> '{text[:45]}...'")
        
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        try:
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 200 and len(response.content) > 0:
                with open(file_path, "wb") as f:
                    f.write(response.content)
                print(f"   ✅ Guardado ({len(response.content)} bytes)")
                success_count += 1
            else:
                print(f"   ❌ Error ({response.status_code}): {response.text}")
        except Exception as e:
            print(f"   ❌ Excepción al generar {script_id}: {e}")

    print(f"\n🎉 ¡Proceso finalizado! ({success_count}/{len(ONBOARDING_SCRIPTS)} audios generados correctamente)")

if __name__ == "__main__":
    generate_all()
