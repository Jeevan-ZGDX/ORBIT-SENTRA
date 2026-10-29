from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True)

    PROJECT_NAME: str = "ASTRA-Guard Mission Health Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "astra-guard-mission-secret-key-2026-deepspace"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # PostgreSQL Configuration
    POSTGRES_USER: str = "astra_user"
    POSTGRES_PASSWORD: str = "astra_password"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "astra_guard_db"

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ]

settings = Settings()
