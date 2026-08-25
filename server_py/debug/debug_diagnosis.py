import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from server_py.core.diagnosis_ai import analyze_exam

async def debug_ai():
    mock_data = {
        "items": [{"question": "Q1", "answer": "A1", "type": "text"}]
    }
    
    print("DEBUG: Starting analysis...")
    try:
        # We manually call the function which has its own try/except
        result = analyze_exam("matematicas", mock_data)
        
        with open("debug_output.txt", "w", encoding="utf-8") as f:
            f.write(str(result))
            
    except Exception as e:
        with open("debug_error.txt", "w", encoding="utf-8") as f:
            f.write(f"CRITICAL ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(debug_ai())
