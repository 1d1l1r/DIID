from datetime import datetime, timezone

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_token
from app.db.session import get_db
from app.models.session import Session as DBSession
from app.models.user import User


def get_current_session(
    vault_session: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> DBSession:
    if not vault_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    session = db.query(DBSession).filter(DBSession.token_hash == hash_token(vault_session)).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    if session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        db.delete(session)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    session.last_seen_at = datetime.now(timezone.utc)
    db.commit()
    return session


def get_current_user(
    session: DBSession = Depends(get_current_session),
    db: Session = Depends(get_db),
) -> User:
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_master(user: User = Depends(get_current_user)) -> User:
    if user.role != "master":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Master role required")
    return user
