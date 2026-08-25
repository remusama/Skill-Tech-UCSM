import os
import sys
# Permitir ejecutar como script desde server_py/ o desde root
# Estamos en server_py/tests/, necesitamos subir 3 niveles para llegar a la raíz (o 2 para llegar a donde está server_py)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import asyncio
import json
from server_py.diagnostico.agents.math_agent import MathAgent
from dotenv import load_dotenv

async def verify_openai_agent():
    print("🧪 Verificando Migración a OpenAI...")
    load_dotenv()
    
    agent = MathAgent()
    
    # Datos de prueba mínimos
    quiz_data = {
        "items": [
            {"question": "¿Cuánto es 2+2?", "answer": "4"},
            {"question": "Si tengo 3 manzanas y me quitan 1, ¿cuántas quedan?", "answer": "2"}
        ],
        "totalTime": 10
    }
    
    try:
        print(f"📡 Enviando diagnóstico de prueba a OpenAI ({agent.model_name})...")
        result = await agent.analyze(quiz_data)
        
        print("\n✅ RESPUESTA RECIBIDA:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        if "area" in result and result["area"] != "error":
            print("\n🎉 ¡MIGRACIÓN EXITOSA! OpenAI generó el diagnóstico correctamente.")
        else:
            print("\n⚠️ La respuesta contiene un error o no tiene el formato esperado.")
            
    except Exception as e:
        print(f"\n❌ FALLO en la verificación: {e}")

if __name__ == "__main__":
    asyncio.run(verify_openai_agent())
