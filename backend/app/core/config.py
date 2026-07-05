"""Application configuration loaded from environment variables."""
import secrets
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    project_name: str = "LeadCRM"
    api_v1_prefix: str = "/api"

    # Security
    secret_key: str = secrets.token_urlsafe(32)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Database — defaults to local SQLite; set DATABASE_URL in production.
    database_url: str = "sqlite:///./leadcrm.db"

    # CORS — comma-separated origins. Set CORS_ORIGINS in production.
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def normalized_database_url(self) -> str:
        # Render hands out postgres:// URLs. SQLAlchemy needs a driver-qualified
        # scheme; we use psycopg v3 (the "psycopg" package), so target
        # postgresql+psycopg://. SQLite is left untouched.
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url
    


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
