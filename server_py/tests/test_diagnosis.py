import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import asyncio
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from server_py.core.diagnosis_ai import analyze_exam

async def test_ai():
    print("🧪 Testing Diagnosis AI Module...")
    
    mock_data = {
        "items": [
            {
                "question": "Imagine que tiene recursos ilimitados, ¿qué problema global resolvería?",
                "answer": "Me enfocaría en la crisis energética creando reactores de fusión accesibles.",
                "type": "input-text"
            },
             {
                "question": "¿Qué rol prefieres asumir en un equipo?",
                "answer": "Visión y Estrategia",
                "type": "multiple-choice"
            }
        ]
    }
    
    try:
        print("⏳ Sending request to Gemini...")
        result = analyze_exam("matematicas", mock_data)
        print("\n✅ API Response Received:")
        print(result)
        
        if result.get("nivel") is not None:
            print("\n🎉 Test PASSED: Structure is correct.")
        else:
            print("\n⚠️ Test WARNING: Response structure might be invalid.")
            
    except Exception as e:
        print(f"\n❌ Test FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_ai())
