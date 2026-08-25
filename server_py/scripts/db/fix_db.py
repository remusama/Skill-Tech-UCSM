import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from server_py.core.database import SessionLocal, UserSkill

def fix_db():
    db = SessionLocal()
    # Fix 'Autonomía' to 'Autogestión' to match AREA_MAPPING and SkillMap
    s = db.query(UserSkill).filter(UserSkill.area == 'Autonomía').first()
    if s:
        s.area = 'Autogestión'
        print("Updated 'Autonomía' to 'Autogestión'")
    
    # Also ensure others are correct if needed
    db.commit()
    db.close()

if __name__ == "__main__":
    fix_db()
