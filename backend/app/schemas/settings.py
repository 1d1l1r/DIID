import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

VisibilityMode = Literal["visible", "hidden_quick_reveal", "hidden_confirmed"]
VisibilityPreset = Literal["all_open", "balanced", "all_hidden", "custom"]


class VisibilityConfig(BaseModel):
    preset: VisibilityPreset = "balanced"
    fields: dict[str, VisibilityMode] = {}


class UserSettingsOut(BaseModel):
    id: uuid.UUID
    visibility: VisibilityConfig
    auto_lock_minutes: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AutoLockUpdate(BaseModel):
    minutes: int | None = None
