import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_session
from app.crud.card import card_crud
from app.crud.profile import profile_crud
from app.db.session import get_db
from app.models.session import Session as DBSession
from app.schemas.card import CardCreate, CardOut, CardUpdate

router = APIRouter(tags=["cards"])


@router.get("/profiles/{profile_id}/cards", response_model=list[CardOut])
def list_cards(
    profile_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    if not profile_crud.get(db, profile_id):
        raise HTTPException(status_code=404, detail="Profile not found")
    return card_crud.get_by_profile(db, profile_id)


@router.post(
    "/profiles/{profile_id}/cards",
    response_model=CardOut,
    status_code=status.HTTP_201_CREATED,
)
def create_card(
    profile_id: uuid.UUID,
    body: CardCreate,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    if not profile_crud.get(db, profile_id):
        raise HTTPException(status_code=404, detail="Profile not found")
    return card_crud.create_for_profile(db, profile_id=profile_id, obj_in=body)


@router.get("/cards/{card_id}", response_model=CardOut)
def get_card(
    card_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    card = card_crud.get(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.put("/cards/{card_id}", response_model=CardOut)
def update_card(
    card_id: uuid.UUID,
    body: CardUpdate,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    card = card_crud.get(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card_crud.update(db, db_obj=card, obj_in=body)


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    if not card_crud.delete(db, id=card_id):
        raise HTTPException(status_code=404, detail="Card not found")
