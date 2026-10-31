from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)

from server_py.memoria.database import Base


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MemoryAsset(Base):
    """
    Archivo compartido en el módulo Mis Recuerdos.

    El archivo físico NO se guarda en la base de datos.
    Aquí únicamente se almacenan sus metadatos.
    """

    __tablename__ = "memory_assets"

    __table_args__ = (
        Index(
            "ix_memory_assets_type_created_at",
            "media_type",
            "created_at",
        ),
        Index(
            "ix_memory_assets_uploader_id",
            "uploader_id",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    uploader_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    title = Column(
        String(150),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    # photo | video | document
    media_type = Column(
        String(20),
        nullable=False,
        index=True,
    )

    # Nombre que tenía el archivo al subirlo.
    original_filename = Column(
        String(255),
        nullable=False,
    )

    # Nombre interno generado por el servidor.
    stored_filename = Column(
        String(255),
        nullable=False,
        unique=True,
    )

    # image/jpeg, video/mp4, application/pdf, etc.
    content_type = Column(
        String(150),
        nullable=True,
    )

    size_bytes = Column(
        Integer,
        nullable=False,
        default=0,
    )

    created_at = Column(
        DateTime,
        default=_utc_now,
        nullable=False,
        index=True,
    )