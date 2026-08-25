import os
import time
import google.generativeai as genai
from dotenv import load_dotenv

def test_gemini():
    print("🔍 Iniciando Diagnóstico de Google Gemini...")
    
    # 1. Cargar .env
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("❌ ERROR: No se encontró GEMINI_API_KEY en el archivo .env")
        return

    print(f"🔑 API Key detectada: {api_key[:5]}...{api_key[-4:]}")

    # 2. Configurar SDK
    try:
        # Forzar transporte REST para evitar bloqueos de red gRPC
        genai.configure(api_key=api_key, transport='rest')
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("✅ SDK configurado correctamente (Transporte forzado a REST).")
    except Exception as e:
        print(f"❌ ERROR al configurar SDK: {e}")
        return

    # 3. Intentar una consulta simple
    print("📡 Enviando ping a Google AI (Gemini 1.5 Flash - REST)...")
    start_time = time.time()
    try:
        # Añadir un tiempo de espera explícito de 15 segundos
        response = model.generate_content(
            "Hola, responde con la palabra 'OK' si me escuchas.",
            request_options={'timeout': 15}
        )
        elapsed = time.time() - start_time
        
        if response.text:
            print(f"✨ ¡ÉXITO! Google respondió: '{response.text.strip()}'")
            print(f"⏱️ Tiempo de respuesta: {elapsed:.2f}s")
        else:
            print("⚠️ El modelo respondió pero el texto está vacío.")
            
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"\n❌ FALLO CRÍTICO después de {elapsed:.2f}s:")
        error_msg = str(e)
        
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            print("👉 MOTIVO: Rate Limit (429). Estás haciendo demasiadas peticiones o has superado la cuota gratuita.")
        elif "400" in error_msg or "API_KEY_INVALID" in error_msg:
            print("👉 MOTIVO: API Key Inválida (400). Revisa que tu llave en el .env sea correcta.")
        elif "403" in error_msg:
            print("👉 MOTIVO: Acceso Denegado (403). Tu API Key no tiene permiso para este modelo o región.")
        elif "500" in error_msg or "503" in error_msg:
            print("👉 MOTIVO: Error del Servidor de Google (500/503). El servicio de Google está caído temporalmente.")
        else:
            print(f"👉 DETALLE TÉCNICO: {error_msg}")

    print("\n🏁 Fin del diagnóstico.")

if __name__ == "__main__":
    test_gemini()
