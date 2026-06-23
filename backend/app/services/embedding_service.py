from functools import lru_cache
from typing import List

from sentence_transformers import SentenceTransformer

from app.config.settings import get_settings


@lru_cache
def _load_model(model_name: str) -> SentenceTransformer:
    return SentenceTransformer(model_name)


class EmbeddingService:
    """Generates query embeddings compatible with the ingestion module."""

    def __init__(self, model_name: str = None):
        self.model_name = model_name or get_settings().embedding_model_name

    def embed_query(self, text: str) -> List[float]:
        embedding = _load_model(self.model_name).encode(text, normalize_embeddings=True)
        return embedding.astype(float).tolist()
