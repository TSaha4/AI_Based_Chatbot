from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Environment-backed runtime configuration."""

    # =========================
    # APP
    # =========================

    app_name: str = "NTPC AI Chatbot"
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

    # =========================
    # MONGODB
    # =========================

    mongodb_uri: str = Field(
        default="mongodb://localhost:27017",
        validation_alias=AliasChoices("MONGO_URI", "MONGODB_URI"),
    )

    mongodb_database: str = Field(
        default="ntpc_ai_chatbot",
        validation_alias=AliasChoices(
            "MONGO_DB",
            "MONGODB_DATABASE",
            "DATABASE_NAME",
        ),
    )

    # =========================
    # PDF INGESTION
    # =========================

    local_pdf_dir: str = Field(
        default="data/knowledge",
        validation_alias="LOCAL_PDF_DIR",
    )

    auto_ingest_local_pdfs: bool = Field(
        default=True,
        validation_alias="AUTO_INGEST_LOCAL_PDFS",
    )

    # =========================
    # EMBEDDINGS
    # =========================

    embedding_model_name: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2"
    )

    vector_index_name: str = Field(
        default="vector_index",
        validation_alias="VECTOR_INDEX_NAME",
    )

    top_k: int = Field(default=5, ge=1, le=20)

    retrieval_candidate_limit: int = Field(
        default=20,
        ge=5,
        le=50,
        validation_alias="RETRIEVAL_CANDIDATE_LIMIT",
    )

    hybrid_vector_weight: float = Field(
        default=0.7,
        ge=0,
        le=1,
        validation_alias="HYBRID_VECTOR_WEIGHT",
    )

    hybrid_keyword_weight: float = Field(
        default=0.3,
        ge=0,
        le=1,
        validation_alias="HYBRID_KEYWORD_WEIGHT",
    )

    weak_retrieval_threshold: float = Field(
        default=0.35,
        ge=0,
        le=1,
        validation_alias="WEAK_RETRIEVAL_THRESHOLD",
    )

    min_answerability_keyword_score: float = Field(
        default=0.40,
        ge=0,
        le=1,
        validation_alias="MIN_ANSWERABILITY_KEYWORD_SCORE",
    )

    min_high_confidence_keyword_score: float = Field(
        default=0.50,
        ge=0,
        le=1,
        validation_alias="MIN_HIGH_CONFIDENCE_KEYWORD_SCORE",
    )

    retrieval_debug: bool = Field(
        default=False,
        validation_alias="RETRIEVAL_DEBUG",
    )

    high_confidence_threshold: float = Field(
        default=0.90,
        ge=0,
        le=1,
    )

    medium_confidence_threshold: float = Field(
        default=0.75,
        ge=0,
        le=1,
    )

    # =========================
    # GEMINI
    # =========================

    gemini_api_key: str = Field(
        default="",
        validation_alias="GEMINI_API_KEY",
    )

    gemini_model: str = Field(
        default="gemini-2.5-flash",
        validation_alias="GEMINI_MODEL",
    )

    gemini_temperature: float = Field(
        default=0.2,
        ge=0,
        le=2,
    )

    # =========================
    # CACHE
    # =========================

    cache_similarity_floor: float = Field(default=0.86, ge=0, le=1)

    alias_learning_min_frequency: int = Field(default=3, ge=1)

    # =========================
    # SMTP
    # =========================

    smtp_host: str = Field(default="", validation_alias="SMTP_HOST")
    smtp_port: int = Field(default=587, validation_alias="SMTP_PORT")
    smtp_username: str = Field(default="", validation_alias="SMTP_USERNAME")
    smtp_password: str = Field(default="", validation_alias="SMTP_PASSWORD")
    smtp_from_email: str = Field(default="", validation_alias="SMTP_FROM_EMAIL")
    smtp_use_tls: bool = Field(default=True, validation_alias="SMTP_USE_TLS")

    # =========================
    # JWT
    # =========================

    jwt_secret_key: str = Field(
        default="change_me",
        validation_alias="JWT_SECRET_KEY",
    )

    jwt_algorithm: str = Field(
        default="HS256",
        validation_alias="JWT_ALGORITHM",
    )

    jwt_access_token_expire_minutes: int = Field(
        default=60,
        validation_alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    # =========================
    # DEFAULT ADMIN
    # =========================

    default_admin_username: str = Field(
        default="admin",
        validation_alias="DEFAULT_ADMIN_USERNAME",
    )

    default_admin_password: str = Field(
        default="admin123",
        validation_alias="DEFAULT_ADMIN_PASSWORD",
    )

    default_admin_role: str = Field(
        default="super_admin",
        validation_alias="DEFAULT_ADMIN_ROLE",
    )

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
        import json

        if value is None:
            return value

        if isinstance(value, list):
            return value

        if isinstance(value, str):
            stripped = value.strip()
            # Try JSON array first (e.g. ["http://localhost:3000",...])
            if stripped.startswith("["):
                try:
                    return json.loads(stripped)
                except json.JSONDecodeError:
                    pass
            # Fall back to comma-separated plain strings
            return [item.strip() for item in stripped.split(",") if item.strip()]

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
