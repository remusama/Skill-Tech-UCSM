import os
import asyncio
from google import genai
from dotenv import load_dotenv

async def list_models_new_sdk():
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    
    print("📋 Listando modelos (NUEVO SDK)...")
    try:
        models = await client.aio.models.list()
        for m in models:
            print(f"- {m.name} (Capacidades: {m.supported_generation_methods})")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_models_new_sdk())
