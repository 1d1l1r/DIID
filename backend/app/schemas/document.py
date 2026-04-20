import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.document import DocumentType


class DocumentCreate(BaseModel):
    type: DocumentType
    country: str | None = None
    document_number: str | None = None
    iin: str | None = None
    issued_by: str | None = None
    issue_date: date | None = None
    expiry_date: date | None = None
    note: str | None = None


class DocumentUpdate(BaseModel):
    type: DocumentType | None = None
    country: str | None = None
    document_number: str | None = None
    iin: str | None = None
    issued_by: str | None = None
    issue_date: date | None = None
    expiry_date: date | None = None
    note: str | None = None


class DocumentOut(BaseModel):
    id: uuid.UUID
    profile_id: uuid.UUID
    type: DocumentType
    country: str | None
    document_number: str | None
    iin: str | None
    issued_by: str | None
    issue_date: date | None
    expiry_date: date | None
    note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
