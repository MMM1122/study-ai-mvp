from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "StudyAI"
    database_url: str = "sqlite:///./studyai.db"
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.6-luna"
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
