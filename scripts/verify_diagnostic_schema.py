import asyncio
import sys
import os
import json

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server_py.diagnostico.agents import analyze_exam, AGENTS

async def test_schema():
    print("🚀 Starting Diagnostic Schema Verification...")
    
    # Mock quiz data
    quiz_data = {
        "items": [
            {"question": "2+2", "answer": "4"},
            {"question": "3*3", "answer": "9"}
        ],
        "totalTime": 15
    }

    # Mock BaseAgent._generate to avoid actual API calls
    from server_py.diagnostico.agents.base_agent import BaseAgent
    original_generate = BaseAgent._generate
    
    mock_response = {
        "area": "Matemáticas",
        "nivel": 95,
        "razonamiento_tipo": "analitico",
        "razonamiento_vector": {
            "analitico": 0.9,
            "divergente": 0.1,
            "intuitivo": 0.0,
            "mecanico": 0.8,
            "estrategico": 0.5
        },
        "analisis_profundo": "El usuario demuestra una excelente capacidad de cálculo y precisión.",
        "puntos_fuertes": ["Precisión", "Rapidez"],
        "recomendaciones": ["Seguir practicando", "Desafíos de nivel superior"],
        "errores": [],
        "confianza_score": 0.98,
        "fatiga_score": 0.1,
        "potencial_score": 0.95,
        "metricas_base": {
            "precision": 1.0,
            "velocidad_normalizada": 0.85,
            "consistencia": 0.9,
            "tasa_error_conceptual": 0.0
        },
        "observaciones": "Usuario de alto rendimiento."
    }

    async def mock_generate(self, system, prompt, json_output=True):
        if json_output:
            return mock_response
        return json.dumps(mock_response)

    BaseAgent._generate = mock_generate

    try:
        # Test MathAgent through the router logic
        result = await analyze_exam("matematicas", quiz_data)
        
        print("\n✅ Sample Output Structure:")
        print(json.dumps(result, indent=2))
        
        # Validate fields
        required_fields = [
            "area", "nivel", "razonamiento_tipo", "razonamiento_vector",
            "analisis_profundo", "puntos_fuertes", "recomendaciones",
            "errores", "confianza_score", "fatiga_score", "potencial_score",
            "metricas_base", "observaciones"
        ]
        
        missing = [f for f in required_fields if f not in result]
        if missing:
            print(f"❌ Missing fields: {missing}")
        else:
            print("✅ All required fields present.")
            
        # Validate types
        if not isinstance(result["confianza_score"], (int, float)):
            print(f"❌ confianza_score should be a number (float), got {type(result['confianza_score'])}")
        
        print("\n🎉 Schema verification logic complete.")
        
    finally:
        BaseAgent._generate = original_generate

if __name__ == "__main__":
    asyncio.run(test_schema())
