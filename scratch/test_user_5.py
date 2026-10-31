from server_py.memoria.database import SessionLocal, User
import traceback

db = SessionLocal()
u = db.query(User).filter(User.id == 5).first()
print("Found user 5:", u.username if u else None)

steps = [
    ("ChatMessage", "DELETE FROM chat_messages WHERE user_id = 5"),
    ("EleonorHistory", "DELETE FROM eleonor_history WHERE user_id = 5"),
    ("EleonorSession", "DELETE FROM eleonor_sessions WHERE user_id = 5"),
    ("ExamResult", "DELETE FROM exam_results WHERE user_id = 5"),
    ("UserSkill", "DELETE FROM user_skills WHERE user_id = 5"),
    ("PracticalTimeline", "DELETE FROM practical_timeline_snapshots WHERE user_id = 5"),
    ("LearningJourney", "DELETE FROM learning_journeys WHERE user_id = 5"),
    ("MylLedger", "DELETE FROM myl_ledger_entries WHERE user_id = 5"),
    ("MylImpulse", "DELETE FROM myl_active_impulses WHERE user_id = 5"),
    ("MylP2P", "DELETE FROM myl_p2p_orders WHERE seller_user_id = 5 OR buyer_user_id = 5"),
    ("MylContrib", "DELETE FROM myl_order_contributions WHERE user_id = 5"),
    ("MentorGroupStudent", "DELETE FROM mentor_group_students WHERE student_id = 5"),
    ("AttendanceRecord", "DELETE FROM attendance_records WHERE student_id = 5"),
    ("Users", "DELETE FROM users WHERE id = 5"),
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

