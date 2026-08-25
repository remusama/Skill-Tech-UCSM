import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from server_py.core.database import SessionLocal, init_db, UserSkill, ExamResult
from server_py.core.skill_logic import update_user_skills, get_skill_snapshot, get_trends
import json

def test_skill_engine():
    print("🧪 Testing Skill Logic Engine...")
    init_db()
    db = SessionLocal()
    
    # Mock AI Diagnosis
    mock_ai = {
        "area": "Razonamiento",
        "nivel": 85,
        "razonamiento": "Estructurado",
        "errores": [],
        "confianza": "Alta",
        "observaciones": "Excelente manejo de lógica proposicional."
    }
    
    print(f"Updating skills for test user in area: {mock_ai['area']}...")
    update_user_skills(db, mock_ai['area'], mock_ai)
    
    # Verify UserSkill
    skill = db.query(UserSkill).filter(UserSkill.area == "Pensamiento Crítico").first()
    if skill and skill.level > 0:
        print(f"✅ UserSkill updated: {skill.area} = {skill.level}")
    else:
        print("❌ UserSkill update failed or mapping incorrect.")
        
    # Verify snapshot
    snapshot = get_skill_snapshot(db)
    print(f"✅ Skill Snapshot: {json.dumps(snapshot)}")
    
    # Verify history
    history = db.query(ExamResult).order_by(ExamResult.timestamp.desc()).first()
    if history and history.score == 85:
        print(f"✅ ExamResult persisted: {history.area} score {history.score}")
    else:
        print("❌ ExamResult persistence failed.")

    db.close()
    print("🧪 Test complete.")

if __name__ == "__main__":
    test_skill_engine()
