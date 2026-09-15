"""Shared, versioned migration for Alembic and existing desktop SQLite vaults."""
from sqlalchemy import inspect, text

TABLES = ('profiles', 'documents', 'cards', 'password_entries', 'key_entries', 'stashes')


def upgrade_ownership(connection) -> None:
    columns = {name: {c['name'] for c in inspect(connection).get_columns(name)} for name in TABLES}
    missing = [name for name in TABLES if 'owner_id' not in columns[name]]
    if not missing:
        return
    masters = connection.execute(text("SELECT id FROM users WHERE role = 'master'")).scalars().all()
    has_legacy_data = any(connection.execute(text(f'SELECT 1 FROM {name} LIMIT 1')).first() for name in missing)
    if has_legacy_data and len(masters) != 1:
        raise RuntimeError('Ownership migration requires exactly one master for the legacy vault')
    dialect = connection.dialect.name
    if dialect not in ('sqlite', 'postgresql'):
        raise RuntimeError('Unsupported vault database')
    for name in missing:
        kind = 'UUID' if dialect == 'postgresql' else 'CHAR(32)'
        connection.execute(text(f'ALTER TABLE {name} ADD COLUMN owner_id {kind} REFERENCES users(id) ON DELETE CASCADE'))
        if masters:
            connection.execute(text(f'UPDATE {name} SET owner_id = :owner WHERE owner_id IS NULL'), {'owner': masters[0]})
        if dialect == 'postgresql':
            connection.execute(text(f'ALTER TABLE {name} ALTER COLUMN owner_id SET NOT NULL'))
        else:
            # SQLite cannot ALTER a column to NOT NULL. Enforce it without rebuilding
            # parent tables (a rebuild with FK cascades could erase their children).
            for event in ('INSERT', 'UPDATE'):
                connection.execute(text(f'''CREATE TRIGGER {name}_owner_required_{event.lower()}
                    BEFORE {event} ON {name} WHEN NEW.owner_id IS NULL
                    BEGIN SELECT RAISE(ABORT, 'owner_id is required'); END'''))
        connection.execute(text(f'CREATE INDEX ix_{name}_owner_id ON {name} (owner_id)'))
    # Force old clients to reauthenticate and discard the formerly shared cache.
    connection.execute(text('DELETE FROM sessions'))
