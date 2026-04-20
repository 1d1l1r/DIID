import uuid

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.card import Card
from app.schemas.card import CardCreate, CardUpdate


class CRUDCard(CRUDBase[Card, CardCreate, CardUpdate]):
    def get_by_profile(self, db: Session, profile_id: uuid.UUID) -> list[Card]:
        return db.query(Card).filter(Card.profile_id == profile_id).all()

    def create_for_profile(
        self, db: Session, *, profile_id: uuid.UUID, obj_in: CardCreate
    ) -> Card:
        data = obj_in.model_dump()
        card_number = data.get("card_number")
        last_four = card_number[-4:] if card_number and len(card_number) >= 4 else None
        card = Card(profile_id=profile_id, card_last_four=last_four, **data)
        db.add(card)
        db.commit()
        db.refresh(card)
        return card

    def update(self, db: Session, *, db_obj: Card, obj_in: CardUpdate) -> Card:
        data = obj_in.model_dump(exclude_unset=True)
        if "card_number" in data and data["card_number"]:
            data["card_last_four"] = data["card_number"][-4:]
        for field, value in data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj


card_crud = CRUDCard(Card)
