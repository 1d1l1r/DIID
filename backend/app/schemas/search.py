import uuid

from pydantic import BaseModel

from app.models.document import DocumentType


class ProfileHit(BaseModel):
    id: uuid.UUID
    full_name: str
    iin: str | None
    phone: str | None
    matched_on: str


class DocumentHit(BaseModel):
    id: uuid.UUID
    profile_id: uuid.UUID
    type: DocumentType
    document_number: str | None
    matched_on: str


class CardHit(BaseModel):
    id: uuid.UUID
    profile_id: uuid.UUID
    bank_name: str
    card_last_four: str | None
    matched_on: str


class PasswordHit(BaseModel):
    id: uuid.UUID
    profile_id: uuid.UUID | None
    title: str
    login: str | None
    matched_on: str


class SearchResults(BaseModel):
    query: str
    profiles: list[ProfileHit]
    documents: list[DocumentHit]
    cards: list[CardHit]
    passwords: list[PasswordHit]
