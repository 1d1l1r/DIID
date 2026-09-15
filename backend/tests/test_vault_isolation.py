import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.models.session import Session as DBSession
from app.models.user import User
from app.core.security import hash_token, hash_password


@pytest.fixture
def vaults(client, db, tmp_path, monkeypatch):
    from app.api.v1 import documents, keys, stashes
    for module in (documents, keys, stashes):
        monkeypatch.setattr(module, 'UPLOADS_DIR', tmp_path)
    owners = {}
    for role, name in [('master', 'admin'), ('member', 'member1'), ('member', 'member2')]:
        user = User(id=uuid.uuid4(), username=name, role=role, hashed_password=hash_password(name + '-password'))
        db.add(user)
        db.flush()
        now = datetime.now(timezone.utc)
        db.add(DBSession(id=uuid.uuid4(), user_id=user.id, token_hash=hash_token(name), last_seen_at=now, expires_at=now + timedelta(days=1)))
        owners[name] = {'id': str(user.id), 'headers': {'Cookie': f'vault_session={name}'}}
    db.commit()
    def call(method, path, who='admin', **kwargs):
        return client.request(method, '/api/v1' + path, headers=owners[who]['headers'], **kwargs)
    def populate(who):
        def create(path, data):
            response = call('POST', path, who, json=data)
            assert response.status_code == 201, response.text
            return response.json()
        profile = create('/profiles', {'last_name': 'secret', 'first_name': who})
        doc = create(f"/profiles/{profile['id']}/documents", {'type': 'photo', 'issued_by': 'secret'})
        card = create(f"/profiles/{profile['id']}/cards", {'bank_name': 'secret bank', 'card_number': '1234567812345678'})
        password = create('/passwords', {'title': 'secret password', 'password': 'sensitive', 'profile_id': profile['id'], 'is_shared': True})
        key = create('/keys', {'name': 'secret key', 'profile_id': profile['id']})
        stash = create('/stashes', {'name': 'secret stash', 'latitude': 0, 'longitude': 0})
        assert call('POST', f"/documents/{doc['id']}/file", who, files={'file': ('scan.png', b'private image', 'image/png')}).status_code == 204
        assert call('POST', f"/keys/{key['id']}/file", who, files={'file': ('cert.p12', b'private key', 'application/octet-stream')}).status_code == 200
        image_response = call('POST', f"/stashes/{stash['id']}/images", who, files={'file': ('stash.png', b'private stash photo', 'image/png')})
        assert image_response.status_code == 200, image_response.text
        return dict(profile=profile['id'], document=doc['id'], card=card['id'], password=password['id'], key=key['id'], stash=stash['id'], image=image_response.json()['images'][0]['id'])
    return call, owners, populate


@pytest.mark.parametrize('owner,outsider', [('admin', 'member1'), ('member1', 'admin'), ('member1', 'member2')])
def test_private_lists_search_and_direct_record_access(vaults, owner, outsider):
    call, _, populate = vaults
    data = populate(owner)
    for path in ['/profiles', '/passwords', '/passwords?shared=true', '/keys', '/stashes']:
        assert call('GET', path, outsider).json() == []
    search = call('GET', '/search?q=secret', outsider).json()
    assert all(search[key] == [] for key in ('profiles', 'documents', 'cards', 'passwords'))
    assert call('GET', '/search?q=secret', owner).json()['profiles']
    for kind, collection in [('profile', 'profiles'), ('document', 'documents'), ('card', 'cards'), ('password', 'passwords'), ('key', 'keys'), ('stash', 'stashes')]:
        path = f'/{collection}/{data[kind]}'
        assert call('GET', path, outsider).status_code == 404
        assert call('PUT', path, outsider, json={}).status_code == 404
        assert call('DELETE', path, outsider).status_code == 404
        assert call('GET', path, owner).status_code == 200
    assert call('GET', f"/profiles/{data['profile']}/documents", outsider).status_code == 404
    assert call('GET', f"/profiles/{data['profile']}/cards", outsider).status_code == 404
    for collection in ('keys', 'passwords'):
        assert call('GET', f"/{collection}?profile_id={data['profile']}", outsider).json() == []


@pytest.mark.parametrize('owner,outsider', [('admin', 'member1'), ('member1', 'admin')])
def test_attachments_cannot_be_read_overwritten_or_deleted(vaults, owner, outsider):
    call, _, populate = vaults
    data = populate(owner)
    paths = [(f"/documents/{data['document']}/file", 'scan.png', 'image/png'),
             (f"/keys/{data['key']}/file", 'cert.p12', 'application/octet-stream')]
    image = f"/stashes/{data['stash']}/images/{data['image']}"
    for path, filename, mime in paths:
        assert call('GET', path, outsider).status_code == 404
        assert call('DELETE', path, outsider).status_code == 404
        assert call('POST', path, outsider, files={'file': (filename, b'overwrite', mime)}).status_code == 404
        response = call('GET', path, owner)
        assert response.status_code == 200
        assert response.headers['cache-control'] == 'no-store'
        assert response.content.startswith(b'private')
    assert call('GET', image, outsider).status_code == 404
    assert call('DELETE', image, outsider).status_code == 404
    assert call('POST', f"/stashes/{data['stash']}/images", outsider, files={'file': ('image.png', b'bad', 'image/png')}).status_code == 404
    assert call('GET', image, owner).status_code == 200
    own = populate(outsider)
    assert call('GET', f"/stashes/{own['stash']}/images/{data['image']}", outsider).status_code == 404
    # Old API accepted arbitrary disk paths, bypassing ownership through a new key.
    assert call('PUT', f"/keys/{own['key']}", outsider, json={'file_path': '/etc/passwd'}).status_code == 422


def test_cannot_create_or_move_records_into_someone_elses_profile(vaults):
    call, _, populate = vaults
    master = populate('admin')
    member = populate('member1')
    for path, data in [(f"/profiles/{master['profile']}/documents", {'type': 'passport'}),
                       (f"/profiles/{master['profile']}/cards", {'bank_name': 'test'}),
                       ('/passwords', {'title': 'test', 'profile_id': master['profile']}),
                       ('/keys', {'name': 'test', 'profile_id': master['profile']})]:
        assert call('POST', path, 'member1', json=data).status_code == 404
    for collection, kind in [('passwords', 'password'), ('keys', 'key')]:
        assert call('PUT', f'/{collection}/{member[kind]}', 'member1', json={'profile_id': master['profile']}).status_code == 404
    response = call('POST', '/profiles', 'member1', json={'last_name': 'mine', 'first_name': 'test', 'owner_id': 'forged'})
    assert response.status_code == 201
    assert call('GET', '/profiles/' + response.json()['id'], 'admin').status_code == 404


def test_new_user_really_logs_into_an_empty_vault(vaults, client):
    call, _, populate = vaults
    populate('admin')
    created = call('POST', '/auth/users', json={'password': 'new-unique-password'})
    assert created.status_code == 201
    login = client.post('/api/v1/auth/login', json={'password': 'new-unique-password'})
    assert login.status_code == 200
    assert client.get('/api/v1/auth/me').json()['id'] == created.json()['user_id']
    for path in ('profiles', 'passwords', 'keys', 'stashes'):
        assert client.get('/api/v1/' + path).json() == []


def test_management_roles_password_reset_and_session_revocation(vaults, client):
    call, owners, _ = vaults
    member_url = '/auth/users/' + owners['member1']['id']
    master_url = '/auth/users/' + owners['admin']['id']
    for method in ('PATCH', 'DELETE'):
        kwargs = {'json': {'username': 'renamed'}} if method == 'PATCH' else {}
        assert call(method, member_url, 'member2', **kwargs).status_code == 403
        assert call(method, master_url, **kwargs).status_code == 403
    assert call('PATCH', member_url, json={'role': 'master'}).status_code == 422
    assert call('PATCH', member_url, json={'username': '   '}).status_code == 422
    assert call('PATCH', member_url, json={'username': 'member2'}).status_code == 409
    assert call('PATCH', member_url, json={'password': 'admin-password'}).status_code == 409
    assert call('PATCH', member_url, json={'password': 'short'}).status_code == 422
    assert call('PATCH', member_url, json={'username': 'Renamed user'}).json()['username'] == 'Renamed user'
    assert call('GET', '/profiles', 'member1').status_code == 200
    assert call('PATCH', member_url, json={'password': 'replacement-password'}).status_code == 200
    assert call('GET', '/profiles', 'member1').status_code == 401
    assert client.post('/api/v1/auth/login', json={'password': 'member1-password'}).status_code == 401
    assert client.post('/api/v1/auth/login', json={'password': 'replacement-password'}).status_code == 200


@pytest.mark.parametrize('self_delete', [False, True])
def test_delete_account_removes_only_its_records_files_and_sessions(vaults, db, tmp_path, self_delete):
    from app.models.profile import Profile
    from app.models.key_entry import KeyEntry
    call, owners, populate = vaults
    master = populate('admin')
    member = populate('member1')
    member_id = uuid.UUID(owners['member1']['id'])
    assert len(list(tmp_path.iterdir())) == 6
    path = '/auth/me' if self_delete else '/auth/users/' + str(member_id)
    response = call('DELETE', path, 'member1' if self_delete else 'admin')
    assert response.status_code == 204
    assert db.query(User).filter(User.id == member_id).first() is None
    assert db.query(Profile).filter(Profile.owner_id == member_id).count() == 0
    assert db.query(KeyEntry).filter(KeyEntry.owner_id == member_id).count() == 0
    assert db.query(DBSession).filter(DBSession.user_id == member_id).count() == 0
    assert len(list(tmp_path.iterdir())) == 3
    assert call('GET', '/profiles', 'member1').status_code == 401
    assert call('GET', f"/profiles/{master['profile']}").status_code == 200
    assert call('GET', f"/stashes/{master['stash']}/images/{master['image']}").content == b'private stash photo'
    assert call('GET', f"/profiles/{member['profile']}").status_code == 404


def test_self_password_change_rejects_duplicate_and_revokes_sessions(vaults, client):
    call, _, _ = vaults
    assert call('POST', '/auth/change-password', 'member1', json={'current_password': 'member1-password', 'new_password': 'admin-password'}).status_code == 409
    assert call('POST', '/auth/change-password', 'member1', json={'current_password': 'member1-password', 'new_password': 'self-new-password'}).status_code == 204
    assert call('GET', '/profiles', 'member1').status_code == 401
    assert client.post('/api/v1/auth/login', json={'password': 'self-new-password'}).status_code == 200


def test_stale_tab_identity_cannot_use_another_accounts_cookie(vaults, client):
    _, owners, _ = vaults
    response = client.get('/api/v1/profiles', headers={'Cookie': 'vault_session=member1', 'X-Vault-User': owners['admin']['id']})
    assert response.status_code == 401


def test_legacy_duplicate_passwords_never_pick_an_arbitrary_account(vaults, db, client):
    _, _, _ = vaults
    duplicate = User(id=uuid.uuid4(), username='legacy-duplicate', role='member', hashed_password=hash_password('admin-password'))
    db.add(duplicate)
    db.commit()
    assert client.post('/api/v1/auth/login', json={'password': 'admin-password'}).status_code == 401
