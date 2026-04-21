from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.key_entry import KeyEntry
from app.schemas.key_entry import KeyCreate, KeyUpdate


class CRUDKeyEntry(CRUDBase[KeyEntry, KeyCreate, KeyUpdate]):
    def get_list(self, db: Session) -> list[KeyEntry]:
        return db.query(KeyEntry).order_by(KeyEntry.name).all()


key_crud = CRUDKeyEntry(KeyEntry)
