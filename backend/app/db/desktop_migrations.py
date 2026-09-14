from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def upgrade_profile_addresses(engine: Engine) -> None:
    """Idempotent SQLite upgrade for desktop vaults (which don't run Alembic)."""
    columns = {column['name'] for column in inspect(engine).get_columns('profiles')}
    with engine.begin() as connection:
        if 'addresses_match' not in columns:
            connection.execute(text('ALTER TABLE profiles ADD COLUMN addresses_match BOOLEAN NOT NULL DEFAULT 1'))
        if 'residential_address' not in columns:
            connection.execute(text('ALTER TABLE profiles ADD COLUMN residential_address TEXT'))
