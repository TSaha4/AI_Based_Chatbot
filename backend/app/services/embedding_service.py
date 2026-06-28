from typing import List

from sentence_transformers import SentenceTransformer

from app.config.settings import get_settings


class EmbeddingService:
    """Generates query embeddings compatible with the ingestion module."""
    _model: SentenceTransformer = None

    def __init__(self, model_name: str = None):
        self.model_name = model_name or get_settings().embedding_model_name
        if EmbeddingService._model is None:
            EmbeddingService._model = SentenceTransformer(self.model_name)

    def embed_query(self, text: str) -> List[float]:
        embedding = EmbeddingService._model.encode(text, normalize_embeddings=True)
        return embedding.astype(float).tolist()
