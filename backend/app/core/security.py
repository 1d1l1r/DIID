import hashlib
import logging
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError

_ph = PasswordHasher()
_log = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """Return True if *password* matches *hashed*. Any argon2 error → False."""
    try:
        return _ph.verify(hashed, password)
    except VerifyMismatchError:
        return False
    except VerificationError as exc:
        _log.warning("argon2 VerificationError (hash may need rehash): %s", exc)
        return False
    except Exception as exc:  # noqa: BLE001
        _log.error("Unexpected error in verify_password: %s", exc)
        return False


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
