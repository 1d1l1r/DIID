from cryptography.fernet import Fernet, MultiFernet
from sqlalchemy import String
from sqlalchemy.types import TypeDecorator

from app.core.config import settings

_fernet: MultiFernet | None = None


def get_fernet() -> MultiFernet:
    global _fernet
    if _fernet is None:
        keys = [k.strip() for k in settings.vault_encryption_key.split(",") if k.strip()]
        if not keys:
            raise RuntimeError("VAULT_ENCRYPTION_KEY is not set or empty")
        _fernet = MultiFernet([Fernet(k) for k in keys])
    return _fernet


class EncryptedString(TypeDecorator):
    """Transparently encrypts on write, decrypts on read using Fernet (AES-128-CBC + HMAC).
    Key rotation: set VAULT_ENCRYPTION_KEY=new_key,old_key — old records decrypt fine."""

    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return get_fernet().encrypt(value.encode()).decode()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return get_fernet().decrypt(value.encode()).decode()
