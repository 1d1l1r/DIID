import enum
import uuid
from datetime import date

from sqlalchemy import Column, Date, Enum as SAEnum, ForeignKey, String, Text
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class DocumentType(str, enum.Enum):
    id_card = "id_card"
    passport = "passport"
    foreign_passport = "foreign_passport"
    driver_license = "driver_license"
    diploma = "diploma"
    birth_certificate = "birth_certificate"
    power_of_attorney = "power_of_attorney"
    scan = "scan"
    photo = "photo"


class Document(Base, TimestampMixin):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[DocumentType] = mapped_column(
        SAEnum(DocumentType, name="document_type"), nullable=False
    )
    country: Mapped[str | None] = mapped_column(String(64))
    document_number: Mapped[str | None] = mapped_column(String(64))
    iin: Mapped[str | None] = mapped_column(String(12))
    issued_by: Mapped[str | None] = mapped_column(String(256))
    issue_date: Mapped[date | None] = mapped_column(Date)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    note: Mapped[str | None] = mapped_column(Text)
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(512), nullable=True)
