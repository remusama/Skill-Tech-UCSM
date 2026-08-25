import os
from google import genai
from dotenv import load_dotenv

def check_gemini_status():
    """
    Script rapido para verificar el estado de la API de Gemini,
    listar modelos y comprobar si hay cuota disponible.
    """
    # Intentar cargar .env desde el directorio actual
    load_dotenv()
    
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("[!] ERROR: No se encontro la variable GEMINI_API_KEY en el entorno o archivo .env")
        return

    print("="*50)
    print("VERIFICANDO ESTADO DE GEMINI API")
    print("="*50)
    print(f"API Key: {api_key[:8]}...{api_key[-4:]}")
    
    try:
        client = genai.Client(api_key=api_key)
        
        print("\nMODELOS Y LIMITES DE TOKENS:")
        print(f"{'Modelo':<35} | {'Max Input Tokens':<15}")
        print("-" * 55)
        
        models = client.models.list()
        available_models = []
        for m in models:
            # En la versión actual del SDK (google-genai), el atributo es 'supported_methods' o simplemente listar todos
            try:
                if 'generateContent' in m.supported_methods:
                    print(f"- {m.name:<32} | {m.input_token_limit:>15,}")
                    available_models.append(m.name)
            except AttributeError:
                # Fallback por si la estructura cambia o es distinta
                if "gemini" in m.name:
                    print(f"- {m.name:<32} | {m.input_token_limit:>15,}")
                    available_models.append(m.name)
        
        print("\nREALIZANDO PRUEBA DE LLAMADA (TEST)...")
        # Usamos flash por ser mas ligero y comun
        test_model = 'gemini-1.5-flash'
        
        # Verificar si el modelo esta en la lista (quitando el prefijo 'models/')
        model_names = [name.replace('models/', '') for name in available_models]
        if test_model not in model_names and available_models:
             test_model = available_models[0].replace('models/', '')

        try:
            response = client.models.generate_content(
                model=test_model,
                contents="Di 'Conexion activa' y nada mas."
            )
            print(f"OK - ESTADO: ACTIVO")
            print(f"Resultado: {response.text.strip()}")
            
        except Exception as test_err:
            error_msg = str(test_err)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                print("ADVERTENCIA: LIMITE EXCEDIDO (Rate Limit / Quota Exhausted)")
                print("Sugerencia: Estas enviando demasiadas peticiones o te has quedado sin tokens gratuitos.")
            elif "401" in error_msg or "API_KEY_INVALID" in error_msg:
                print("ERROR: API KEY INVALIDA")
            else:
                print(f"ERROR EN PRUEBA: {test_err}")

    except Exception as e:
        print(f"ERROR CRITICO AL CONECTAR: {e}")
    
    print("\n" + "="*50)
    print("Nota: El uso exacto de tokens se consulta en:")
    print("https://aistudio.google.com/app/plan_information")
    print("="*50)

if __name__ == "__main__":
    check_gemini_status()
