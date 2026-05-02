import uuid
from datetime import date

from sqlalchemy import Date, String, Text, text
from sqlalchemy import JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    last_name: Mapped[str] = mapped_column(String(128), nullable=False)
    first_name: Mapped[str] = mapped_column(String(128), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(128))
    iin: Mapped[str | None] = mapped_column(String(12))
    birth_date: Mapped[date | None] = mapped_column(Date)
    phone: Mapped[str | None] = mapped_column(String(32))
    address: Mapped[str | None] = mapped_column(Text)
    note: Mapped[str | None] = mapped_column(Text)
    tags: Mapped[list] = mapped_column(JSON, nullable=False, server_default=text("'[]'"))
