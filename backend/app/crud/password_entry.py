import uuid

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.password_entry import PasswordEntry
from app.schemas.password_entry import PasswordCreate, PasswordUpdate


class CRUDPasswordEntry(CRUDBase[PasswordEntry, PasswordCreate, PasswordUpdate]):
    def get_list(
        self,
        db: Session,
        profile_id: uuid.UUID | None = None,
        shared: bool | None = None,
        category: str | None = None,
    ) -> list[PasswordEntry]:
        query = db.query(PasswordEntry)
        if profile_id is not None:
            query = query.filter(PasswordEntry.profile_id == profile_id)
        if shared is True:
            query = query.filter(PasswordEntry.is_shared.is_(True))
        if category:
            query = query.filter(PasswordEntry.category == category)
        return query.order_by(PasswordEntry.title).all()


password_crud = CRUDPasswordEntry(PasswordEntry)
