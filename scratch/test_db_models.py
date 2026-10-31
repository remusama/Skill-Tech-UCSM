import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from server_py.memoria.database import SessionLocal, PracticalTimelineSnapshot, User, ExamResult, UserSkill

def test_db():
    db = SessionLocal()
    try:
        users_count = db.query(User).count()
        snaps_count = db.query(PracticalTimelineSnapshot).count()
        exam_results_count = db.query(ExamResult).count()
        skills_count = db.query(UserSkill).count()
        print(f"Database connected OK!")
        print(f"Users in DB: {users_count}")
        print(f"Timeline Snapshots in DB: {snaps_count}")
        print(f"Exam Results (Notas) in DB: {exam_results_count}")
        print(f"User Skills in DB: {skills_count}")
    finally:
        db.close()

if __name__ == '__main__':
    test_db()
