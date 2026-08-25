import os
import time
import google.generativeai as genai
from dotenv import load_dotenv

def test_gemini_v2():
    print("🔍 Diagnóstico Gemini v2 (Fijando modelo)...")
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=api_key, transport='rest')
    
    # Probaremos con el modelo 1.5 Flash (usando el prefijo correcto)
    # y el 2.0 Flash (que es "mayor")
    models_to_try = [
        "models/gemini-1.5-flash",
        "models/gemini-2.0-flash-exp",
        "models/gemini-1.0-pro"
    ]
    
    for model_name in models_to_try:
        print(f"\n--- Probando: {model_name} ---")
        try:
            model = genai.GenerativeModel(model_name)
            start_time = time.time()
            response = model.generate_content(
                "Di 'TEST OK'",
                request_options={'timeout': 15}
            )
            elapsed = time.time() - start_time
            print(f"✅ ÉXITO con {model_name} en {elapsed:.2f}s")
            print(f"Respuesta: {response.text.strip()}")
            # Si uno funciona, ya sabemos qué modelo usar
        except Exception as e:
            print(f"❌ FALLO con {model_name}: {e}")

if __name__ == "__main__":
    test_gemini_v2()
