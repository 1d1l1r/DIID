"""
DIID Desktop — backend launcher

Responsibilities:
  1. Retrieve (or generate) the Fernet encryption key from the OS keychain
     - Windows: Windows Credential Manager
     - macOS: Keychain
     - Linux: Secret Service / GNOME Keyring
  2. Set up environment for the FastAPI backend (SQLite, port, etc.)
  3. Run Alembic migrations via create_all (no Postgres-specific DDL)
  4. Start uvicorn on localhost:38291
"""

import os
import sys
import secrets
import socket
import threading
import webbrowser
import time

# ── Determine base paths ──────────────────────────────────────────────────────
# When frozen by PyInstaller, sys._MEIPASS is the temp extraction dir.
# Unpacked files (DB, uploads) live next to the .exe in APPDATA.

if getattr(sys, "frozen", False):
    BUNDLE_DIR = sys._MEIPASS  # type: ignore[attr-defined]
    _sys = sys.platform
    if _sys == "win32":
        DATA_DIR = os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "DIID")
    elif _sys == "darwin":
        DATA_DIR = os.path.join(os.path.expanduser("~"), "Library", "Application Support", "DIID")
    else:
        DATA_DIR = os.path.join(os.environ.get("XDG_DATA_HOME", os.path.join(os.path.expanduser("~"), ".local", "share")), "DIID")
else:
    BUNDLE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(os.path.dirname(BUNDLE_DIR), "desktop_data")

os.makedirs(DATA_DIR, exist_ok=True)
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "diid.db")

PORT = 38291
KEYRING_SERVICE = "DIID-Vault"
KEYRING_USERNAME = "encryption-key"

# ── Encryption key via OS keychain ────────────────────────────────────────────

def get_or_create_key() -> str:
    try:
        import keyring
        key = keyring.get_password(KEYRING_SERVICE, KEYRING_USERNAME)
        if not key:
            from cryptography.fernet import Fernet
            key = Fernet.generate_key().decode()
            keyring.set_password(KEYRING_SERVICE, KEYRING_USERNAME, key)
        return key
    except Exception as e:
        # Fallback: store key in a local file (less secure but always works)
        key_file = os.path.join(DATA_DIR, ".vault_key")
        if os.path.exists(key_file):
            with open(key_file) as f:
                return f.read().strip()
        from cryptography.fernet import Fernet
        key = Fernet.generate_key().decode()
        with open(key_file, "w") as f:
            f.write(key)
        return key

# ── Configure environment ─────────────────────────────────────────────────────

encryption_key = get_or_create_key()

os.environ.update({
    "DATABASE_URL": f"sqlite:///{DB_PATH}",
    "VAULT_ENCRYPTION_KEY": encryption_key,
    "UPLOADS_DIR": UPLOADS_DIR,
    "APP_ENV": "desktop",
    "CORS_ORIGINS": '["tauri://localhost", "http://localhost", "http://tauri.localhost"]',
    "SESSION_EXPIRE_DAYS": "365",
    "SECRET_KEY": encryption_key[:32].ljust(32, "0"),
})

# Add bundle dir to path so app package is importable
if BUNDLE_DIR not in sys.path:
    sys.path.insert(0, BUNDLE_DIR)

# ── Init DB (create_all instead of Alembic for SQLite) ───────────────────────

def init_db():
    from sqlalchemy import create_engine
    from app.db.base import Base
    # Import all models so metadata is populated
    import app.models.user          # noqa
    import app.models.session       # noqa
    import app.models.profile       # noqa
    import app.models.document      # noqa
    import app.models.card          # noqa
    import app.models.password_entry  # noqa
    import app.models.key_entry     # noqa
    import app.models.stash         # noqa
    import app.models.user_settings  # noqa

    engine = create_engine(os.environ["DATABASE_URL"], connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)

# ── Start uvicorn ─────────────────────────────────────────────────────────────

def main():
    init_db()

    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=PORT,
        log_level="warning",
    )

if __name__ == "__main__":
    main()
