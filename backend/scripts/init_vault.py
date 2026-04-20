"""
Initialize the vault: create the single admin user and default settings.

Usage (from backend/ directory):
    python -m scripts.init_vault
    python -m scripts.init_vault --password mysecretpassword
"""
import argparse
import sys
import uuid
from getpass import getpass

from app.db.session import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.user_settings import UserSettings, DEFAULT_VISIBILITY


def init(password: str | None = None) -> None:
    db = SessionLocal()
    try:
        if db.query(User).first():
            print("Vault already initialized. User exists.")
            return

        if not password:
            password = getpass("Set master password: ")
            confirm = getpass("Confirm master password: ")
            if password != confirm:
                print("Passwords do not match.")
                sys.exit(1)

        if len(password) < 8:
            print("Password must be at least 8 characters.")
            sys.exit(1)

        user = User(
            id=uuid.uuid4(),
            username="admin",
            hashed_password=hash_password(password),
        )
        db.add(user)
        db.flush()

        db.add(
            UserSettings(
                id=uuid.uuid4(),
                user_id=user.id,
                visibility=DEFAULT_VISIBILITY,
            )
        )
        db.commit()
        print("Vault initialized successfully. Username: admin")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--password", help="Master password (omit for interactive prompt)")
    args = parser.parse_args()
    init(args.password)
