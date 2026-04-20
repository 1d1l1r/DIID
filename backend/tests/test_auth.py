import uuid

from app.core.security import hash_password
from app.models.user import User
from app.models.user_settings import DEFAULT_VISIBILITY, UserSettings


def _seed_user(db, password="testpass123"):
    user = User(id=uuid.uuid4(), username="admin", hashed_password=hash_password(password))
    db.add(user)
    db.flush()
    db.add(UserSettings(id=uuid.uuid4(), user_id=user.id, visibility=DEFAULT_VISIBILITY))
    db.commit()
    return user


def test_login_success(client, db):
    _seed_user(db)
    resp = client.post("/api/v1/auth/login", json={"password": "testpass123"})
    assert resp.status_code == 200
    assert "session_id" in resp.json()
    assert "vault_session" in resp.cookies


def test_login_wrong_password(client, db):
    resp = client.post("/api/v1/auth/login", json={"password": "wrongpassword"})
    assert resp.status_code == 401


def test_me_unauthenticated(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_authenticated(client, db):
    _seed_user(db, "mypassword")
    login = client.post("/api/v1/auth/login", json={"password": "mypassword"})
    assert login.status_code == 200
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 200
    assert resp.json()["username"] == "admin"


def test_logout(client, db):
    _seed_user(db, "logoutpass")
    client.post("/api/v1/auth/login", json={"password": "logoutpass"})
    resp = client.post("/api/v1/auth/logout")
    assert resp.status_code == 204
    me = client.get("/api/v1/auth/me")
    assert me.status_code == 401
