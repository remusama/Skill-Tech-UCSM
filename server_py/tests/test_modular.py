import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import asyncio
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import from the NEW package
from server_py.core.gemini_pro_diagnostic import analyze_exam

async def test_modular_agents():
    print("🧪 Testing Modular Diagnostic Agents...")
    
    mock_data = {
        "items": [
            {
                "question": "Diseña un puente que soporte terremotos.",
                "answer": "Usaría amortiguadores de masa en la base y estructuras flexibles.",
                "type": "input-text"
            }
        ]
    }
    
    try:
        print("⏳ Sending request to Engineering Agent...")
        result = analyze_exam("ingenieria", mock_data)
        print("\n✅ Engineering Agent Response:")
        print(result)
        
        if result.get("nivel") is not None:
             print("\n🎉 Modular Architecture Works!")
        else:
             print("\n⚠️ Structure invalid.")
            
    except Exception as e:
        print(f"\n❌ Test FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_modular_agents())
