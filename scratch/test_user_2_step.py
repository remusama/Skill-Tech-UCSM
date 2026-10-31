from server_py.memoria.database import SessionLocal, User
from sqlalchemy import text

db = SessionLocal()

tables_to_clean = [
    ("journey_sessions", "DELETE FROM journey_sessions WHERE journey_id IN (SELECT id FROM learning_journeys WHERE user_id = 2)"),
    ("mentor_exam_answers", "DELETE FROM mentor_exam_answers WHERE assignment_id IN (SELECT id FROM mentor_exam_assignments WHERE student_id = 2)"),
    ("mentor_exam_questions", "DELETE FROM mentor_exam_questions WHERE exam_id IN (SELECT id FROM mentor_exams WHERE mentor_id = 2)"),
    ("mentor_exam_assignments", "DELETE FROM mentor_exam_assignments WHERE student_id = 2 OR exam_id IN (SELECT id FROM mentor_exams WHERE mentor_id = 2)"),
    ("chat_messages", "DELETE FROM chat_messages WHERE user_id = 2"),
    ("eleonor_history", "DELETE FROM eleonor_history WHERE user_id = 2"),
    ("eleonor_sessions", "DELETE FROM eleonor_sessions WHERE user_id = 2"),
    ("user_skills", "DELETE FROM user_skills WHERE user_id = 2"),
    ("exam_results", "DELETE FROM exam_results WHERE user_id = 2"),
    ("practical_timeline_snapshots", "DELETE FROM practical_timeline_snapshots WHERE user_id = 2"),
    ("learning_journeys", "DELETE FROM learning_journeys WHERE user_id = 2"),
    ("attendance_records", "DELETE FROM attendance_records WHERE student_id = 2"),
    ("attendance_classes", "DELETE FROM attendance_classes WHERE mentor_id = 2"),
    ("mentor_group_students", "DELETE FROM mentor_group_students WHERE student_id = 2"),
    ("mentor_groups", "DELETE FROM mentor_groups WHERE mentor_id = 2"),
    ("mentor_exams", "DELETE FROM mentor_exams WHERE mentor_id = 2"),
    ("memory_assets", "DELETE FROM memory_assets WHERE uploader_id = 2"),
    ("myl_ledger_entries", "DELETE FROM myl_ledger_entries WHERE user_id = 2"),
    ("myl_active_impulses", "DELETE FROM myl_active_impulses WHERE user_id = 2"),
    ("myl_order_contributions", "DELETE FROM myl_order_contributions WHERE user_id = 2"),
    ("myl_p2p_orders", "DELETE FROM myl_p2p_orders WHERE seller_user_id = 2 OR buyer_user_id = 2"),
    ("agents", "UPDATE agents SET creator_id = NULL WHERE creator_id = 2"),
    ("users", "DELETE FROM users WHERE id = 2")
]

for name, q in tables_to_clean:
    try:
        db.execute(text(q))
        print(f"Table {name}: SUCCESS")
    except Exception as e:
        print(f"Table {name}: ERROR -> {e}")
        db.rollback()
        break

db.commit()
db.close()

