from functools import lru_cache
from pathlib import Path
from pydantic import BaseSettings, Field

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    app_name: str = Field(default="Serkor Dental API")
    sqlite_path: Path = Field(default=DATA_DIR / "app.db")
    database_url: str | None = None
    debug: bool = Field(default=False)

    class Config:
        env_file = BASE_DIR / ".env"
        env_file_encoding = "utf-8"

    @property
    def sql_url(self) -> str:
        if self.database_url:
            return self.database_url
        return f"sqlite:///{self.sqlite_path}"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

