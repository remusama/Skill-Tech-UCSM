import json
import logging
import re
from datetime import datetime, timezone
from typing import Any


PII_PATTERNS = {
    "email": re.compile(
        r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
    ),
    "phone": re.compile(
        r"\b\+?\d{1,4}[-.\s]?\d{1,10}[-.\s]?\d{1,10}\b"
    ),
}


def mask_pii(text: Any) -> Any:
    """Enmascara correos electrónicos y números telefónicos."""
    if not isinstance(text, str):
        return text
    masked = text
    for pii_type, pattern in PII_PATTERNS.items():
        replacement = f"[MASKED_{pii_type.upper()}]"
        masked = pattern.sub(replacement, masked)
    return masked


class JSONFormatter(logging.Formatter):
    """Convierte registros de logging en objetos JSON."""
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            # Esta modificación actualiza el formato de los logs: 2026-09-02T15:30:00.123456 -> 2026-09-02T15:30:00.123456+00:00
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": mask_pii(record.getMessage()),
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "extra_fields"):
            extra_fields = getattr(record, "extra_fields")
            if isinstance(extra_fields, dict):
                log_data.update(
                    {
                        key: mask_pii(str(value))
                        for key, value in extra_fields.items()
                    }
                )
            else:
                log_data["extra"] = mask_pii(str(extra_fields))

        return json.dumps(log_data)


def get_logger(name: str) -> logging.Logger:
    """Obtiene un logger configurado para emitir registros JSON."""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Evita duplicar registros en el logger raíz.
    logger.propagate = False

    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)

    return logger
