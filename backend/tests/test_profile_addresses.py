import pytest
from sqlalchemy import create_engine, text

from app.api.deps import get_current_session
from app.db.desktop_migrations import upgrade_profile_addresses
from app.main import app


@pytest.fixture
def authenticated_client(client):
    app.dependency_overrides[get_current_session] = lambda: object()
    yield client
    app.dependency_overrides.pop(get_current_session, None)


def test_address_round_trip_and_partial_updates(authenticated_client):
    client = authenticated_client
    response = client.post('/api/v1/profiles', json={
        'last_name': 'Test', 'first_name': 'Person', 'address': 'Original address',
    })
    assert response.status_code == 201
    profile = response.json()
    url = f"/api/v1/profiles/{profile['id']}"
    assert profile['addresses_match'] is True
    assert profile['residential_address'] is None
    response = client.put(url, json={'addresses_match': False, 'residential_address': 'Actual home'})
    assert response.status_code == 200
    assert response.json()['address'] == 'Original address'
    assert response.json()['residential_address'] == 'Actual home'
    # Editing unrelated fields from an older client must not reset the checkbox.
    response = client.put(url, json={'phone': '123'})
    assert response.json()['addresses_match'] is False
    assert response.json()['residential_address'] == 'Actual home'
    response = client.put(url, json={'addresses_match': True, 'address': 'New shared address'})
    assert response.json()['residential_address'] is None
    saved = client.get(url).json()
    assert saved['address'] == 'New shared address'
    assert saved['addresses_match'] is True


def test_create_different_addresses_and_reject_null_match(authenticated_client):
    client = authenticated_client
    data = {'last_name': 'Test', 'first_name': 'Person', 'address': 'Registration',
            'addresses_match': False, 'residential_address': 'Home'}
    response = client.post('/api/v1/profiles', json=data)
    assert response.status_code == 201
    assert response.json()['residential_address'] == 'Home'
    url = f"/api/v1/profiles/{response.json()['id']}"
    assert client.put(url, json={'addresses_match': None}).status_code == 422
    data['addresses_match'] = True
    assert client.post('/api/v1/profiles', json=data).json()['residential_address'] is None


def test_addresses_require_authentication(client):
    assert client.post('/api/v1/profiles', json={'last_name': 'T', 'first_name': 'P', 'address': 'Private'}).status_code == 401


def test_desktop_upgrade_preserves_existing_address_and_is_repeatable():
    engine = create_engine('sqlite://')
    with engine.begin() as connection:
        connection.execute(text('CREATE TABLE profiles (id TEXT PRIMARY KEY, address TEXT)'))
        connection.execute(text("INSERT INTO profiles VALUES ('old', 'Keep this address')"))
    upgrade_profile_addresses(engine)
    upgrade_profile_addresses(engine)
    with engine.connect() as connection:
        row = connection.execute(text('SELECT * FROM profiles')).mappings().one()
        assert row['address'] == 'Keep this address'
        assert row['addresses_match'] == 1
        assert row['residential_address'] is None


def test_alembic_upgrade_and_downgrade_preserve_legacy_address():
    import importlib.util
    from pathlib import Path
    from alembic.migration import MigrationContext
    from alembic.operations import Operations

    path = Path(__file__).parents[1] / 'alembic/versions/f6a7b8c9d0e1_profile_residential_address.py'
    spec = importlib.util.spec_from_file_location('address_migration', path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    engine = create_engine('sqlite://')
    with engine.begin() as connection:
        connection.execute(text('CREATE TABLE profiles (id TEXT PRIMARY KEY, address TEXT)'))
        connection.execute(text("INSERT INTO profiles VALUES ('legacy', 'Original address')"))
        with Operations.context(MigrationContext.configure(connection)):
            migration.upgrade()
            row = connection.execute(text('SELECT * FROM profiles')).mappings().one()
            assert row['address'] == 'Original address'
            assert row['addresses_match'] == 1
            assert row['residential_address'] is None
            migration.downgrade()
        assert connection.execute(text('SELECT address FROM profiles')).scalar_one() == 'Original address'
