import os
import asyncio
from google import genai
from dotenv import load_dotenv

async def check_models():
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    
    # Probaremos los nombres exactos que suelen funcionar en el nuevo SDK
    models = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-flash-8b"]
    
    results = {}
    for m in models:
        print(f"Testing {m}...")
        try:
            # Una llamada muy corta
            resp = await client.aio.models.generate_content(model=m, contents="hi")
            results[m] = "OK"
            print(f"  Result: OK")
        except Exception as e:
            results[m] = str(e)
            print(f"  Result: Error ({str(e)[:50]}...)")
            
    print("\nResumen:")
    for m, res in results.items():
        print(f"{m}: {res}")

if __name__ == "__main__":
    asyncio.run(check_models())
