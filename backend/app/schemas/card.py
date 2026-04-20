import uuid
from datetime import datetime

from pydantic import BaseModel


class CardCreate(BaseModel):
    bank_name: str
    card_number: str | None = None
    expiry_date: str | None = None
    cardholder_name: str | None = None
    cvv: str | None = None
    color_theme: str = "blue"
    note: str | None = None


class CardUpdate(BaseModel):
    bank_name: str | None = None
    card_number: str | None = None
    expiry_date: str | None = None
    cardholder_name: str | None = None
    cvv: str | None = None
    color_theme: str | None = None
    note: str | None = None


class CardOut(BaseModel):
    id: uuid.UUID
    profile_id: uuid.UUID
    bank_name: str
    card_number: str | None
    card_last_four: str | None
    expiry_date: str | None
    cardholder_name: str | None
    cvv: str | None
    color_theme: str
    note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
