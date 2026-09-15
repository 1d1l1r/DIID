import uuid

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.key_entry import KeyEntry
from app.schemas.key_entry import KeyCreate, KeyUpdate


class CRUDKeyEntry(CRUDBase[KeyEntry, KeyCreate, KeyUpdate]):
    def get_list(self, db: Session, profile_id: uuid.UUID | None = None, *, owner_id: uuid.UUID) -> list[KeyEntry]:
        q = db.query(KeyEntry).filter(KeyEntry.owner_id == owner_id)
        if profile_id is not None:
            q = q.filter(KeyEntry.profile_id == profile_id)
        return q.order_by(KeyEntry.name).all()


key_crud = CRUDKeyEntry(KeyEntry)
