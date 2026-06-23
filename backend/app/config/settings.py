from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-backed runtime configuration for Module 4."""

    app_name: str = "AI Knowledge Assistant - Module 4"
    api_prefix: str = "/api/chat"
    cors_origins: List[str] = Field(default_factory=lambda: ["*"])

    mongodb_uri: str = Field(default="mongodb://localhost:27017", validation_alias="MONGODB_URI")
    mongodb_database: str = Field(default="ai_chatbot", validation_alias="MONGODB_DATABASE")

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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
