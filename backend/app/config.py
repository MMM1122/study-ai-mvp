from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "StudyAI"
    database_url: str = "sqlite:///./studyai.db"
    openrouter_api_key: str | None = None
    openrouter_model: str = "nvidia/nemotron-3-ultra-550b-a55b:free"
    ai_max_tokens: int = Field(default=16000, ge=1024, le=65536)
    ai_timeout_seconds: int = Field(default=180, ge=10, le=600)
    cors_origins: str = "http://localhost:3000"
    upload_dir: str = "./data/uploads"
    max_ai_chars: int = 90000

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def origins(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]

    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()
