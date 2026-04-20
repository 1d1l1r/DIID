import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.api.deps import get_current_session, get_current_user
from app.core.config import settings
from app.core.security import generate_session_token, hash_password, hash_token, verify_password
from app.db.session import get_db
from app.models.session import Session as DBSession
from app.models.user import User
from app.models.user_settings import UserSettings, DEFAULT_VISIBILITY
from app.schemas.auth import ChangePasswordRequest, LoginRequest, MeOut, SessionOut, SetupRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/status")
def vault_status(db: Session = Depends(get_db)):
    """Public endpoint — returns whether the vault has been initialized."""
    initialized = db.query(User).first() is not None
    return {"initialized": initialized}


@router.post("/setup", status_code=status.HTTP_201_CREATED)
def setup_vault(body: SetupRequest, db: Session = Depends(get_db)):
    """Create the initial user. Fails with 409 if vault is already initialized."""
    if db.query(User).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vault already initialized")

    user = User(
        id=uuid.uuid4(),
        username="admin",
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    db.flush()
    db.add(UserSettings(id=uuid.uuid4(), user_id=user.id, visibility=DEFAULT_VISIBILITY))
    db.commit()
    return {"detail": "Vault initialized"}


@router.post("/login")
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.query(User).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

    token = generate_session_token()
    now = datetime.now(timezone.utc)
    session = DBSession(
        id=uuid.uuid4(),
        user_id=user.id,
        token_hash=hash_token(token),
        device_name=request.headers.get("X-Device-Name"),
        user_agent=(request.headers.get("user-agent") or "")[:512],
        ip=request.client.host if request.client else None,
        last_seen_at=now,
        expires_at=now + timedelta(days=settings.session_expire_days),
    )
    db.add(session)
    db.commit()

    response.set_cookie(
        key="vault_session",
        value=token,
        httponly=True,
        secure=settings.app_env == "production",
        samesite="strict",
        max_age=settings.session_expire_days * 86400,
    )
    return {"session_id": str(session.id), "expires_at": session.expires_at}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    session: DBSession = Depends(get_current_session),
    db: Session = Depends(get_db),
):
    db.delete(session)
    db.commit()
    response.delete_cookie("vault_session")


@router.get("/me", response_model=MeOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.get("/sessions", response_model=list[SessionOut])
def list_sessions(
    current: DBSession = Depends(get_current_session),
    db: Session = Depends(get_db),
):
    sessions = db.query(DBSession).filter(DBSession.user_id == current.user_id).all()
    return [
        SessionOut(
            id=s.id,
            device_name=s.device_name,
            ip=s.ip,
            last_seen_at=s.last_seen_at,
            expires_at=s.expires_at,
            is_current=(s.id == current.id),
        )
        for s in sessions
    ]


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    # Use a direct UPDATE to avoid any ORM session-tracking edge cases
    db.execute(
        update(User)
        .where(User.id == current_user.id)
        .values(hashed_password=hash_password(body.new_password))
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_session(
    session_id: uuid.UUID,
    current: DBSession = Depends(get_current_session),
    db: Session = Depends(get_db),
):
    session = (
        db.query(DBSession)
        .filter(DBSession.id == session_id, DBSession.user_id == current.user_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
