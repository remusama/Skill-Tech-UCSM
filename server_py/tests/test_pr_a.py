import sys
import os
from datetime import datetime
from uuid import uuid4

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from server_py.config import settings
from server_py.schemas.models import (
    UserSummary, SessionSchema, MessageSchema,
    DiagnosisSchema, MediaRefSchema, JobSchema
)
from server_py.db.models import Session, Message, Diagnosis, MediaRef, Job
from server_py.core.structured_logger import mask_pii, get_logger

def test_settings_import():
    assert settings.ALLOWED_ORIGINS is not None
    assert isinstance(settings.ENABLE_DB_SESSION, bool)

def test_pydantic_schemas_validation():
    # UserSummary
    user_data = {"id": 1, "email": "test@example.com", "display_name": "Test User"}
    user = UserSummary(**user_data)
    assert user.id == 1
    assert user.email == "test@example.com"
    
    # SessionSchema
    session_id = uuid4()
    session_data = {
        "id": session_id,
        "user_id": 1,
        "valence": "neutra",
        "tension": 0.5,
        "engagement": 0.8,
        "created_at": datetime.utcnow(),
        "last_active_at": datetime.utcnow()
    }
    session = SessionSchema(**session_data)
    assert session.id == session_id
    assert session.engagement == 0.8
    
    # MessageSchema
    msg_id = uuid4()
    msg_data = {
        "id": msg_id,
        "session_id": session_id,
        "role": "user",
        "content": "Hola Eleonor",
        "timestamp": datetime.utcnow()
    }
    msg = MessageSchema(**msg_data)
    assert msg.role == "user"
    assert msg.content == "Hola Eleonor"

def test_sqlalchemy_models_importable():
    # Verify we can instantiate them and they have class attributes
    session = Session(id="some-uuid", user_id=1, valence="positiva", tension=0.1, engagement=0.9)
    assert session.valence == "positiva"
    
    message = Message(id="msg-uuid", session_id="some-uuid", role="assistant", content="Response")
    assert message.role == "assistant"
    
    job = Job(id="job-uuid", user_id=1, type="stt", status="queued", attempts=0)
    assert job.status == "queued"

def test_logger_pii_masking():
    raw_text = "Contact me at test.user@example.com or call +1-555-0199."
    masked_text = mask_pii(raw_text)
    
    assert "test.user@example.com" not in masked_text
    assert "+1-555-0199" not in masked_text
    assert "[MASKED_EMAIL]" in masked_text
    assert "[MASKED_PHONE]" in masked_text
