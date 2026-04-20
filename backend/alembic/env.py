from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from sqlalchemy import String

from app.core.config import settings
from app.core.encryption import EncryptedString
from app.db.base import Base
import app.models  # noqa: F401 — registers all models with Base.metadata


def render_item(obj_type, obj, autogen_context):
    """Render EncryptedString as String in migration files."""
    if obj_type == "type" and isinstance(obj, EncryptedString):
        autogen_context.imports.add("import sqlalchemy as sa")
        return f"sa.String(length={obj.impl.length})"
    return False

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_item=render_item,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
