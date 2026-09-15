import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

UserRole = Literal["master", "member"]


class LoginRequest(BaseModel):
    password: str


class SetupRequest(BaseModel):
    password: str

    @field_validator('password')
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class CreateUserRequest(BaseModel):
    password: str

    @field_validator('password')
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def new_password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('New password must be at least 8 characters')
        return v


class SessionOut(BaseModel):
    id: uuid.UUID
    device_name: str | None
    ip: str | None
    last_seen_at: datetime
    expires_at: datetime
    is_current: bool

    model_config = {"from_attributes": True}


class MeOut(BaseModel):
    id: uuid.UUID
    username: str
    role: UserRole
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListItem(BaseModel):
    id: uuid.UUID
    username: str
    role: UserRole
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateUserRequest(BaseModel):
    username: str | None = Field(default=None, min_length=1, max_length=64)
    password: str | None = Field(default=None, min_length=8)
    model_config = {"extra": "forbid"}

    @field_validator('username')
    @classmethod
    def nonblank_name(cls, value):
        if value is not None and not value.strip():
            raise ValueError('Username cannot be blank')
        return value.strip() if value is not None else None
