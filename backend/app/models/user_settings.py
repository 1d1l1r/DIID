import uuid

from sqlalchemy import ForeignKey, Integer
from sqlalchemy import JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

DEFAULT_VISIBILITY: dict = {
    "preset": "balanced",
    "fields": {
        "cards.card_number": "hidden_quick_reveal",
        "cards.cvv": "hidden_confirmed",
        "passwords.password": "hidden_quick_reveal",
        "passwords.login": "visible",
        "documents.document_number": "visible",
        "profiles.iin": "visible",
    },
}


class UserSettings(Base, TimestampMixin):
    __tablename__ = "user_settings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    visibility: Mapped[dict] = mapped_column(JSON, nullable=False)
    auto_lock_minutes: Mapped[int | None] = mapped_column(Integer)
