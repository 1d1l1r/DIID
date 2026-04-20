import uuid
from datetime import datetime

from pydantic import BaseModel


class PasswordCreate(BaseModel):
    profile_id: uuid.UUID | None = None
    title: str
    login: str | None = None
    password: str | None = None
    url: str | None = None
    category: str | None = None
    note: str | None = None
    is_shared: bool = False


class PasswordUpdate(BaseModel):
    profile_id: uuid.UUID | None = None
    title: str | None = None
    login: str | None = None
    password: str | None = None
    url: str | None = None
    category: str | None = None
    note: str | None = None
    is_shared: bool | None = None


class PasswordOut(BaseModel):
    id: uuid.UUID
    profile_id: uuid.UUID | None
    title: str
    login: str | None
    password: str | None
    url: str | None
    category: str | None
    note: str | None
    is_shared: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
