import os
import asyncio
from google import genai
from dotenv import load_dotenv

async def list_all():
    load_dotenv()
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    print("Listing all models...")
    try:
        # En el nuevo SDK la forma de listar es client.models.list()
        # Pero es un iterador
        for m in client.models.list():
            print(f"- {m.name}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_all())
