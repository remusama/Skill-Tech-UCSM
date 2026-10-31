from server_py.memoria.database import SessionLocal, User
from server_py.user.service import delete_user_account
import traceback

db = SessionLocal()
u = db.query(User).filter(User.id == 6).first()
print("Found user 6:", u.username if u else None)

steps = [
    ("ChatMessage", "DELETE FROM chat_messages WHERE user_id = 6"),
    ("EleonorHistory", "DELETE FROM eleonor_history WHERE user_id = 6"),
    ("EleonorSession", "DELETE FROM eleonor_sessions WHERE user_id = 6"),
    ("ExamResult", "DELETE FROM exam_results WHERE user_id = 6"),
    ("UserSkill", "DELETE FROM user_skills WHERE user_id = 6"),
    ("PracticalTimeline", "DELETE FROM practical_timeline_snapshots WHERE user_id = 6"),
    ("LearningJourney", "DELETE FROM learning_journeys WHERE user_id = 6"),
    ("MylLedger", "DELETE FROM myl_ledger_entries WHERE user_id = 6"),
    ("MylImpulse", "DELETE FROM myl_active_impulses WHERE user_id = 6"),
    ("MylP2P", "DELETE FROM myl_p2p_orders WHERE seller_user_id = 6 OR buyer_user_id = 6"),
    ("MylContrib", "DELETE FROM myl_order_contributions WHERE user_id = 6"),
    ("GroupStudent", "DELETE FROM group_students WHERE student_id = 6"),
    ("AttendanceRecord", "DELETE FROM attendance_records WHERE student_id = 6"),
    ("Users", "DELETE FROM users WHERE id = 6"),
]

for name, sql in steps:
    try:
        from sqlalchemy import text
        db.execute(text(sql))
        db.commit()
        print(f"Step {name}: OK")
    except Exception as e:
        db.rollback()
        print(f"Step {name} FAILED: {e}")

db.close()

