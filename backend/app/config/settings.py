from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Environment-backed runtime configuration for Module 4."""

    app_name: str = "AI Knowledge Assistant - Module 4"
    api_prefix: str = "/api/chat"
    cors_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            "http://localhost:8080",
            "http://localhost:8081",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8080",
            "http://127.0.0.1:8081",
        ],
        validation_alias=AliasChoices("CORS_ORIGINS"),
    )

    mongodb_uri: str = Field(
        default="mongodb://localhost:27017",
        validation_alias=AliasChoices("MONGO_URI", "MONGODB_URI"),
    )
    mongodb_database: str = Field(
        default="ai_chatbot_db",
        validation_alias=AliasChoices("MONGO_DB", "MONGODB_DATABASE", "DATABASE_NAME"),
    )

    local_pdf_dir: str = Field(default="data/knowledge", validation_alias="LOCAL_PDF_DIR")
    auto_ingest_local_pdfs: bool = Field(default=True, validation_alias="AUTO_INGEST_LOCAL_PDFS")

    embedding_model_name: str = Field(default="sentence-transformers/all-MiniLM-L6-v2")
    vector_index_name: str = Field(default="vector_index", validation_alias="VECTOR_INDEX_NAME")
    top_k: int = Field(default=5, ge=1, le=20)

    high_confidence_threshold: float = Field(default=0.80, ge=0, le=1)
    medium_confidence_threshold: float = Field(default=0.60, ge=0, le=1)

    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", validation_alias="GEMINI_MODEL")
    gemini_temperature: float = Field(default=0.2, ge=0, le=2)

    cache_similarity_floor: float = Field(default=0.92, ge=0, le=1)
    alias_learning_min_frequency: int = Field(default=3, ge=1)

    smtp_host: str = Field(default="", validation_alias="SMTP_HOST")
    smtp_port: int = Field(default=587, validation_alias="SMTP_PORT")
    smtp_username: str = Field(default="", validation_alias="SMTP_USERNAME")
    smtp_password: str = Field(default="", validation_alias="SMTP_PASSWORD")
    smtp_from_email: str = Field(default="", validation_alias="SMTP_FROM_EMAIL")
    smtp_use_tls: bool = Field(default=True, validation_alias="SMTP_USE_TLS")

    model_config = SettingsConfigDict(
        env_file=(
            Path(".env"),
            Path("../.env"),
            Path("backend/.env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def normalize_cors_origins(cls, value):
        if value is None:
            return value
        if isinstance(value, str):
            items = [item.strip() for item in value.split(",")]
            return [item for item in items if item]
        return value

    @property
    def resolved_local_pdf_dir(self) -> Path:
        path = Path(self.local_pdf_dir)
        if path.is_absolute():
            return path
        return (PROJECT_ROOT / path).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
