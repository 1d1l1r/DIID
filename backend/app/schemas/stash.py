import uuid
from datetime import datetime

from pydantic import BaseModel


class StashImageOut(BaseModel):
    id: uuid.UUID
    stash_id: uuid.UUID
    file_name: str
    order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class StashCreate(BaseModel):
    name: str
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    note: str | None = None


class StashUpdate(BaseModel):
    name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    note: str | None = None


class StashOut(BaseModel):
    id: uuid.UUID
    name: str
    latitude: float | None
    longitude: float | None
    description: str | None
    note: str | None
    images: list[StashImageOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
