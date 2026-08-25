import os
import sys

# Add the project root to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from server_py.core.database import SessionLocal, ExamResult, User

def test_db_connection():
    db = SessionLocal()
    try:
        # Check if there are any users
        user_count = db.query(User).count()
        print(f"📊 [TEST] Total usuarios en DB: {user_count}")
        
        # Check for exam results
        exam_count = db.query(ExamResult).count()
        print(f"📊 [TEST] Total resultados de exámenes: {exam_count}")
        
        if exam_count > 0:
            latest_exam = db.query(ExamResult).order_by(ExamResult.timestamp.desc()).first()
            print(f"✅ [TEST] Conexión exitosa. Último examen del usuario {latest_exam.user_id} en el área '{latest_exam.area}'")
        else:
            print("ℹ️ [TEST] Conexión exitosa, pero no se encontraron exámenes en la BD.")
            
    except Exception as e:
        print(f"❌ [TEST] Error de conexión: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_db_connection()
