import os
import asyncio
from google import genai
from dotenv import load_dotenv

async def check_genai_sdk():
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    
    models = [
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ]
    
    print("🔍 Probando modelos con el NUEVO SDK (google-genai)...")
    
    for m in models:
        print(f"\n--- Probando: {m} ---")
        try:
            response = await client.aio.models.generate_content(
                model=m,
                contents="Di 'OK'"
            )
            print(f"✅ ÉXITO con {m}: {response.text.strip()}")
        except Exception as e:
            print(f"❌ FALLO con {m}: {str(e)[:100]}")

if __name__ == "__main__":
    asyncio.run(check_genai_sdk())
