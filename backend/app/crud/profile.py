import uuid

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.card import Card
from app.models.document import Document
from app.models.password_entry import PasswordEntry
from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileUpdate


class CRUDProfile(CRUDBase[Profile, ProfileCreate, ProfileUpdate]):
    def get_list(
        self, db: Session, q: str | None = None, tags: list[str] | None = None
    ) -> list[Profile]:
        query = db.query(Profile)
        if q:
            pattern = f"%{q}%"
            query = query.filter(
                or_(
                    Profile.last_name.ilike(pattern),
                    Profile.first_name.ilike(pattern),
                    Profile.middle_name.ilike(pattern),
                    Profile.iin.ilike(pattern),
                    Profile.phone.ilike(pattern),
                )
            )
        if tags:
            for tag in tags:
                query = query.filter(Profile.tags.contains([tag]))
        return query.order_by(Profile.last_name, Profile.first_name).all()

    def get_counts(self, db: Session, profile_id: uuid.UUID) -> dict:
        return {
            "documents_count": db.query(func.count(Document.id))
            .filter(Document.profile_id == profile_id)
            .scalar(),
            "cards_count": db.query(func.count(Card.id))
            .filter(Card.profile_id == profile_id)
            .scalar(),
            "passwords_count": db.query(func.count(PasswordEntry.id))
            .filter(PasswordEntry.profile_id == profile_id)
            .scalar(),
        }


profile_crud = CRUDProfile(Profile)
