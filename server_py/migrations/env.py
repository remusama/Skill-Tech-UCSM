import os
import sys
from logging.config import fileConfig

from alembic import context

# Add project root to sys.path to find our models and config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import model's MetaData object for 'autogenerate' support
from server_py.memoria.database import Base  # noqa: E402

target_metadata = Base.metadata


def get_url():
    from server_py.config import settings
    # Supabase a veces entrega URLs con "postgres://" (sin ql), SQLAlchemy requiere "postgresql://"
    url = settings.DATABASE_URL or "sqlite:///skill_tech_v2.db"
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Use database.py connection engine directly to preserve pool/reconnect configurations
    from server_py.memoria.database import engine

    with engine.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
