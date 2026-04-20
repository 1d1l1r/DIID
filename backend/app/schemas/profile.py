import uuid
from datetime import date, datetime

from pydantic import BaseModel


class ProfileCreate(BaseModel):
    last_name: str
    first_name: str
    middle_name: str | None = None
    iin: str | None = None
    birth_date: date | None = None
    phone: str | None = None
    address: str | None = None
    note: str | None = None
    tags: list[str] = []


class ProfileUpdate(BaseModel):
    last_name: str | None = None
    first_name: str | None = None
    middle_name: str | None = None
    iin: str | None = None
    birth_date: date | None = None
    phone: str | None = None
    address: str | None = None
    note: str | None = None
    tags: list[str] | None = None


class ProfileOut(BaseModel):
    id: uuid.UUID
    last_name: str
    first_name: str
    middle_name: str | None
    iin: str | None
    birth_date: date | None
    phone: str | None
    address: str | None
    note: str | None
    tags: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfileListItem(BaseModel):
    id: uuid.UUID
    last_name: str
    first_name: str
    middle_name: str | None
    iin: str | None
    phone: str | None
    tags: list[str]
    documents_count: int = 0
    cards_count: int = 0
    passwords_count: int = 0
