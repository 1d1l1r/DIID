from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    database_url: str = Field(alias="DATABASE_URL")
    vault_encryption_key: str = Field(alias="VAULT_ENCRYPTION_KEY")
    session_expire_days: int = Field(default=30, alias="SESSION_EXPIRE_DAYS")
    app_env: str = Field(default="production", alias="APP_ENV")
    cors_origins: list[str] = Field(default=["http://localhost:5173"], alias="CORS_ORIGINS")


settings = Settings()
