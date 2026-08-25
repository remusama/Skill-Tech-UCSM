import sys
import os

# Safely reconfigure stdout/stderr for Windows terminal UTF-8 support
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import json
import jwt
import asyncio
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from server_py.chat.ws_router import websocket_chat
from server_py.memoria.database import SessionLocal, User, ExamResult, EleonorSession, ChatMessage
from server_py.auth.router import SECRET_KEY, ALGORITHM

# Custom Duck-Typed Mock for WebSocket to bypass library incompatibilities
class MockWebSocket:
    def __init__(self, receive_queue):
        self.receive_queue = receive_queue
        self.sent_messages = []
        self.is_accepted = False
        self.is_closed = False

    async def accept(self):
        self.is_accepted = True
        print("[MOCK WS] Connection accepted.")

    async def receive_text(self):
        if not self.receive_queue:
            from fastapi import WebSocketDisconnect
            raise WebSocketDisconnect()
        msg = self.receive_queue.pop(0)
        print(f"[MOCK WS] Received: {msg[:100]}")
        return msg

    async def send_json(self, data):
        self.sent_messages.append(data)
        print(f"[MOCK WS] Sent: type={data.get('type')}, content={str(data.get('content'))[:100]}")

    async def close(self):
        self.is_closed = True
        print("[MOCK WS] Connection closed.")

async def run_explain_errors_test():
    print("Testing WebSocket Error Review Tutor Test via Handler Mock...")
    db = SessionLocal()
    
    # 1. Setup temporary test user
    test_username = f"test_tutor_{int(datetime.utcnow().timestamp())}"
    test_user = User(
        username=test_username,
        email=f"{test_username}@example.com",
        hashed_password="mocked_password",
        has_onboarded=1
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    user_id = test_user.id
    print(f"Created test user: {test_username} (ID: {user_id})")
    
    # 2. Seed mock ExamResult with incorrect answers and telemetry
    mock_data = {
        "graded_items": [
            {"questionId": 1, "question": "Cuánto es 2 + 2", "correct": True},
            {"questionId": 2, "question": "Cual es la derivada de x^2", "correct": False},
            {"questionId": 3, "question": "Quien formulo la teoria de la relatividad", "correct": False}
        ],
        "raw_responses": [
            {
                "questionId": 1,
                "question": "Cuánto es 2 + 2",
                "answer": "4",
                "type": "multiple-choice",
                "telemetry": {
                    "time_spent_ms": 5000,
                    "keystrokes": 0,
                    "deletions": 0,
                    "focus_lost_count": 0
                }
            },
            {
                "questionId": 2,
                "question": "Cual es la derivada de x^2",
                "answer": "x",
                "type": "multiple-choice",
                "telemetry": {
                    "time_spent_ms": 45000, 
                    "keystrokes": 5,
                    "deletions": 4, 
                    "focus_lost_count": 2
                }
            },
            {
                "questionId": 3,
                "question": "Quien formulo la teoria de la relatividad",
                "answer": "Isaac Newton",
                "type": "multiple-choice",
                "telemetry": {
                    "time_spent_ms": 12000,
                    "keystrokes": 12,
                    "deletions": 0,
                    "focus_lost_count": 0
                }
            }
        ]
    }
    
    exam_record = ExamResult(
        user_id=user_id,
        area="matematicas",
        score=33.3,
        data=mock_data,
        csat_score=4,
        rage_clicks=1,
        score_tri=35.0
    )
    db.add(exam_record)
    
    # Also initialize EleonorSession
    session = EleonorSession(id=f"sess_{user_id}", user_id=user_id, valence="neutra", tension=0.5, engagement=0.5)
    db.add(session)
    db.commit()
    print("Seeded mock ExamResult and EleonorSession.")
    
    # 3. Generate Auth JWT Token
    to_encode = {"user_id": user_id, "exp": datetime.utcnow().timestamp() + 3600}
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # 4. Prepare message queue
    # Message 1: Auth Token
    # Message 2: Request Explain Errors
    msg_auth = json.dumps({"token": token})
    msg_explain = json.dumps({"type": "explain_errors"})
    
    ws_mock = MockWebSocket([msg_auth, msg_explain])
    
    try:
        # Run the websocket chat loop handler directly
        await websocket_chat(ws_mock)
        
        # 5. Assertions on Sent Messages
        sent = ws_mock.sent_messages
        
        # Find all sent texts
        texts = [m.get("content") for m in sent if m.get("type") == "text"]
        full_text = "".join(texts)
        
        print(f"\nFinal Explanation from Eleonor:\n{full_text}\n")
        
        # Verify correctness
        assert len(full_text) > 0, "Eleonor should return a textual explanation"
        assert "derivada" in full_text.lower() or "x^2" in full_text.lower(), "Should mention incorrect math question"
        assert "relatividad" in full_text.lower() or "newton" in full_text.lower(), "Should mention incorrect physics question"
        
        print("All test assertions PASSED successfully!")
        
    finally:
        # 6. Cleanup DB to keep it pristine
        db.delete(session)
        db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
        db.delete(exam_record)
        db.delete(test_user)
        db.commit()
        db.close()
        print("Database cleaned up.")

if __name__ == "__main__":
    asyncio.run(run_explain_errors_test())
