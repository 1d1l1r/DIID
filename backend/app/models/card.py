import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.encryption import EncryptedString
from app.db.base import Base, TimestampMixin


class Card(Base, TimestampMixin):
    __tablename__ = "cards"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    bank_name: Mapped[str] = mapped_column(String(128), nullable=False)
    card_number: Mapped[str | None] = mapped_column(EncryptedString(512))
    card_last_four: Mapped[str | None] = mapped_column(String(4))
    expiry_date: Mapped[str | None] = mapped_column(String(7))
    cardholder_name: Mapped[str | None] = mapped_column(String(128))
    cvv: Mapped[str | None] = mapped_column(EncryptedString(512))
    color_theme: Mapped[str] = mapped_column(String(32), nullable=False, server_default="'blue'")
    note: Mapped[str | None] = mapped_column(Text)
