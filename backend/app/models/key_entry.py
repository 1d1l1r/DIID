import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.encryption import EncryptedString
from app.db.base import Base, TimestampMixin


class KeyEntry(Base, TimestampMixin):
    __tablename__ = "key_entries"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL")
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    password: Mapped[str | None] = mapped_column(EncryptedString(512))
    file_name: Mapped[str | None] = mapped_column(String(256))
    file_path: Mapped[str | None] = mapped_column(String(512))
    note: Mapped[str | None] = mapped_column(Text)
