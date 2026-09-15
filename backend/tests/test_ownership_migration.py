import pytest
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import IntegrityError
from app.db.ownership_v1 import TABLES, upgrade_ownership


def legacy_database(master_count=1):
    engine = create_engine('sqlite://')
    with engine.begin() as connection:
        connection.exec_driver_sql('PRAGMA foreign_keys=ON')
        connection.execute(text('CREATE TABLE users (id CHAR(32) PRIMARY KEY, role TEXT)'))
        connection.execute(text('CREATE TABLE sessions (id TEXT PRIMARY KEY)'))
        connection.execute(text("INSERT INTO sessions VALUES ('old-session')"))
        for index in range(master_count):
            connection.execute(text("INSERT INTO users VALUES (:id, 'master')"), {'id': f'{index + 1:032x}'})
        connection.execute(text("INSERT INTO users VALUES (:id, 'member')"), {'id': 'f' * 32})
        for name in TABLES:
            reference = ', profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE' if name in ('documents', 'cards', 'password_entries', 'key_entries') else ''
            connection.execute(text(f'CREATE TABLE {name} (id TEXT PRIMARY KEY, content TEXT{reference})'))
            values = ", 'old-profile'" if reference else ''
            record_id = 'old-profile' if name == 'profiles' else name
            connection.execute(text(f"INSERT INTO {name} VALUES (:id, 'Preserve exact legacy data'{values})"), {'id': record_id})
        connection.execute(text('CREATE TABLE stash_images (id TEXT PRIMARY KEY, stash_id TEXT REFERENCES stashes(id) ON DELETE CASCADE)'))
        connection.execute(text("INSERT INTO stash_images VALUES ('image', 'stashes')"))
    return engine


def test_legacy_records_and_children_survive_and_belong_only_to_master():
    engine = legacy_database()
    with engine.begin() as connection:
        upgrade_ownership(connection)
        upgrade_ownership(connection)  # desktop starts repeatedly
        for name in TABLES:
            row = connection.execute(text(f'SELECT * FROM {name}')).mappings().one()
            assert row['owner_id'] == '0' * 31 + '1'
            assert row['content'] == 'Preserve exact legacy data'
            assert any(index['column_names'] == ['owner_id'] for index in inspect(connection).get_indexes(name))
        assert connection.execute(text('SELECT count(*) FROM stash_images')).scalar_one() == 1
        assert connection.execute(text('SELECT count(*) FROM sessions')).scalar_one() == 0
        connection.execute(text("DELETE FROM users WHERE role = 'member'"))
        assert connection.execute(text('SELECT count(*) FROM profiles')).scalar_one() == 1
        for name in TABLES:
            with pytest.raises(IntegrityError):
                connection.execute(text(f"INSERT INTO {name} (id, content) VALUES ('missing-owner', 'test')"))
            with pytest.raises(IntegrityError):
                connection.execute(text(f'UPDATE {name} SET owner_id = NULL'))
        connection.execute(text("DELETE FROM users WHERE role = 'master'"))
        assert connection.execute(text('SELECT count(*) FROM stash_images')).scalar_one() == 0
        assert all(connection.execute(text(f'SELECT count(*) FROM {name}')).scalar_one() == 0 for name in TABLES)


@pytest.mark.parametrize('master_count', [0, 2])
def test_ambiguous_legacy_ownership_fails_without_mutating_data(master_count):
    engine = legacy_database(master_count)
    with engine.begin() as connection:
        with pytest.raises(RuntimeError, match='exactly one master'):
            upgrade_ownership(connection)
        assert 'owner_id' not in {column['name'] for column in inspect(connection).get_columns('profiles')}
        assert connection.execute(text('SELECT count(*) FROM profiles')).scalar_one() == 1


def test_new_empty_installation_needs_no_master_backfill():
    engine = legacy_database(0)
    with engine.begin() as connection:
        for name in reversed(TABLES):
            connection.execute(text(f'DELETE FROM {name}'))
        upgrade_ownership(connection)
        assert 'owner_id' in {column['name'] for column in inspect(connection).get_columns('profiles')}
