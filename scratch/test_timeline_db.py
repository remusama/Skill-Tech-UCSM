import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from server_py.memoria.database import SessionLocal, PracticalTimelineSnapshot, init_db

def test_timeline_table():
    init_db()
    db = SessionLocal()
    try:
        # Try inserting a test snapshot and retrieving it, then deleting it
        test_snap = PracticalTimelineSnapshot(
            user_id=1,
            snapshot_id="test-snap-verification-123",
            date="29/10/2026 18:50",
            average=4.2,
            scores={"escucha_activa": 4.5, "trabajo_equipo": 4.0}
        )
        db.add(test_snap)
        db.commit()
        db.refresh(test_snap)
        print(f"Snapshot inserted with ID: {test_snap.id}")

        found = db.query(PracticalTimelineSnapshot).filter_by(snapshot_id="test-snap-verification-123").first()
        print(f"Retrieved snapshot from Supabase: {found.snapshot_id}, avg: {found.average}")

        db.delete(found)
        db.commit()
        print("Test snapshot cleaned up successfully!")
    finally:
        db.close()

if __name__ == '__main__':
    test_timeline_table()

