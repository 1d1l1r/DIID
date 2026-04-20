import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_session
from app.crud.profile import profile_crud
from app.db.session import get_db
from app.models.session import Session as DBSession
from app.schemas.profile import ProfileCreate, ProfileListItem, ProfileOut, ProfileUpdate

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("", response_model=list[ProfileListItem])
def list_profiles(
    q: str | None = Query(default=None),
    tags: list[str] = Query(default=[]),
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    profiles = profile_crud.get_list(db, q=q, tags=tags)
    result = []
    for p in profiles:
        counts = profile_crud.get_counts(db, p.id)
        result.append(
            ProfileListItem(
                id=p.id,
                last_name=p.last_name,
                first_name=p.first_name,
                middle_name=p.middle_name,
                iin=p.iin,
                phone=p.phone,
                tags=p.tags,
                **counts,
            )
        )
    return result


@router.post("", response_model=ProfileOut, status_code=status.HTTP_201_CREATED)
def create_profile(
    body: ProfileCreate,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    return profile_crud.create(db, obj_in=body)


@router.get("/{profile_id}", response_model=ProfileOut)
def get_profile(
    profile_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    profile = profile_crud.get(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/{profile_id}", response_model=ProfileOut)
def update_profile(
    profile_id: uuid.UUID,
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    profile = profile_crud.get(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile_crud.update(db, db_obj=profile, obj_in=body)


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
    profile_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    if not profile_crud.delete(db, id=profile_id):
        raise HTTPException(status_code=404, detail="Profile not found")
