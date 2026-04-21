import uuid
from datetime import datetime

from pydantic import BaseModel


class KeyCreate(BaseModel):
    profile_id: uuid.UUID | None = None
    name: str
    password: str | None = None
    note: str | None = None


class KeyUpdate(BaseModel):
    profile_id: uuid.UUID | None = None
    name: str | None = None
    password: str | None = None
    note: str | None = None
    file_name: str | None = None
    file_path: str | None = None


class KeyOut(BaseModel):
    id: uuid.UUID
    profile_id: uuid.UUID | None
    name: str
    password: str | None
    file_name: str | None
    note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
