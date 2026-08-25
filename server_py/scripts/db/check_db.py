import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from server_py.core.database import SessionLocal, ExamResult, UserSkill
import json

def check_db():
    db = SessionLocal()
    print("--- User Skills ---")
    skills = db.query(UserSkill).all()
    for s in skills:
        print(f"Area: {s.area}, Level: {s.level}")
    
    print("\n--- Latest Exam Result ---")
    latest = db.query(ExamResult).order_by(ExamResult.timestamp.desc()).first()
    if latest:
        print(f"Area: {latest.area}, Score: {latest.score}")
        print(f"Data: {json.dumps(latest.data, indent=2)}")
    else:
        print("No exams found.")
    db.close()

if __name__ == "__main__":
    check_db()
