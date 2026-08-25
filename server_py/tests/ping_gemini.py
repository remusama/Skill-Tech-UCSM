import os
import asyncio
from google import genai
from dotenv import load_dotenv

async def ping():
    # 1. Cargar API KEY
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("❌ Error: No se encontró GEMINI_API_KEY en el .env")
        return

    # 2. Inicializar Cliente
    client = genai.Client(api_key=api_key)
    model_id = "gemini-2.0-flash"

    print(f"📡 Enviando 'Hola' a {model_id}...")
    
    try:
        # 3. Enviar mensaje
        response = await client.aio.models.generate_content(
            model=model_id,
            contents="Hola"
        )
        
        # 4. Mostrar respuesta
        print(f"\n✨ Respuesta de Gemini:")
        print(f"-----------------------")
        print(response.text)
        print(f"-----------------------")
        print("✅ ¡Conexión exitosa!")

    except Exception as e:
        print(f"\n❌ Error al conectar con Gemini: {e}")

if __name__ == "__main__":
    asyncio.run(ping())
