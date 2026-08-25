import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy.orm import Session

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from server_py.core.gemini_pro_diagnostic import analyze_exam
from server_py.core.database import SessionLocal, UserSkill, ExamResult

def test_diag():
    area = "matematicas"
    quiz_data = {
        "examTitle": "Cálculo Diferencial",
        "area": "Matemáticas",
        "items": [
            {"questionId": 1, "question": "Q1", "answer": "A1", "type": "multiple-choice"},
            {"questionId": 2, "question": "Q2", "answer": "A2", "type": "multiple-choice"}
        ],
        "totalTime": 120
    }
    
    print("Testing analyze_exam...")
    try:
        result = analyze_exam(area, quiz_data)
        print("Analysis Result:", result)
        return result
    except Exception as e:
        print("Error in analyze_exam:", e)
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    test_diag()
