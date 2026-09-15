import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_session
from app.crud.password_entry import password_crud
from app.db.session import get_db
from app.crud.profile import profile_crud
from app.models.session import Session as DBSession
from app.schemas.password_entry import PasswordCreate, PasswordOut, PasswordUpdate

router = APIRouter(prefix="/passwords", tags=["passwords"])


@router.get("", response_model=list[PasswordOut])
def list_passwords(
    profile_id: uuid.UUID | None = Query(default=None),
    shared: bool | None = Query(default=None),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current: DBSession = Depends(get_current_session),
):
    return password_crud.get_list(db, profile_id=profile_id, shared=shared, category=category, owner_id=current.user_id)


@router.post("", response_model=PasswordOut, status_code=status.HTTP_201_CREATED)
def create_password(
    body: PasswordCreate,
    db: Session = Depends(get_db),
    current: DBSession = Depends(get_current_session),
):
    if body.profile_id is not None and not profile_crud.get(db, body.profile_id, owner_id=current.user_id):
        raise HTTPException(status_code=404, detail="Profile not found")
    return password_crud.create(db, obj_in=body, owner_id=current.user_id)


@router.get("/{password_id}", response_model=PasswordOut)
def get_password(
    password_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: DBSession = Depends(get_current_session),
):
    entry = password_crud.get(db, password_id, owner_id=current.user_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Password entry not found")
    return entry


@router.put("/{password_id}", response_model=PasswordOut)
def update_password(
    password_id: uuid.UUID,
    body: PasswordUpdate,
    db: Session = Depends(get_db),
    current: DBSession = Depends(get_current_session),
):
    if body.profile_id is not None and not profile_crud.get(db, body.profile_id, owner_id=current.user_id):
        raise HTTPException(status_code=404, detail="Profile not found")
    entry = password_crud.get(db, password_id, owner_id=current.user_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Password entry not found")
    return password_crud.update(db, db_obj=entry, obj_in=body, owner_id=current.user_id)


@router.delete("/{password_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_password(
    password_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: DBSession = Depends(get_current_session),
):
    if not password_crud.delete(db, id=password_id, owner_id=current.user_id):
        raise HTTPException(status_code=404, detail="Password entry not found")
