from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.user_settings import DEFAULT_VISIBILITY, UserSettings
from app.schemas.settings import AutoLockUpdate, UserSettingsOut, VisibilityConfig

router = APIRouter(prefix="/settings", tags=["settings"])


def _get_or_create(db: Session, user: User) -> UserSettings:
    s = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not s:
        s = UserSettings(user_id=user.id, visibility=DEFAULT_VISIBILITY)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@router.get("", response_model=UserSettingsOut)
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _get_or_create(db, user)


@router.put("/visibility", response_model=VisibilityConfig)
def update_visibility(
    body: VisibilityConfig,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = _get_or_create(db, user)
    s.visibility = body.model_dump()
    db.commit()
    db.refresh(s)
    return s.visibility


@router.put("/auto-lock", status_code=status.HTTP_204_NO_CONTENT)
def update_auto_lock(
    body: AutoLockUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = _get_or_create(db, user)
    s.auto_lock_minutes = body.minutes
    db.commit()
