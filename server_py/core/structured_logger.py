import json
import logging
import re
from datetime import datetime

PII_PATTERNS = {
    "email": re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
    "phone": re.compile(r"\b\+?\d{1,4}[-.\s]?\d{1,10}[-.\s]?\d{1,10}\b"),
}

def mask_pii(text: str) -> str:
    if not isinstance(text, str):
        return text
    masked = text
    for pii_type, pattern in PII_PATTERNS.items():
        masked = pattern.sub(f"[MASKED_{pii_type.upper()}]", masked)
    return masked

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": mask_pii(record.getMessage()),
        }
        
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
            
        if hasattr(record, "extra_fields"):
            # Ensure extra_fields is serializable and mask PII
            extra = getattr(record, "extra_fields")
            if isinstance(extra, dict):
                log_data.update({k: mask_pii(str(v)) for k, v in extra.items()})
            else:
                log_data["extra"] = mask_pii(str(extra))
                
        return json.dumps(log_data)

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Prevent propagation to root logger if custom logging is setup
    logger.propagate = False
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        
    return logger
