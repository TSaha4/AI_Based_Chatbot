from dataclasses import dataclass
from typing import Dict, List, Optional

from app.models.response_models import SourceDocument
from app.services.nlp_service import PreprocessedQuery


@dataclass(frozen=True)
class RetrievalQuality:
    """Combined retrieval metrics used for confidence and Gemini guardrails."""

    vector_score: float
    keyword_score: float
    combined_score: float
    answerable: bool
    weak_retrieval: bool
    context_keyword_score: float = 0.0

    @property
    def combined_confidence(self) -> float:
        if not self.answerable or self.weak_retrieval:
            return min(
                (0.35 * self.combined_score)
                + (0.25 * self.vector_score)
                + (0.25 * self.keyword_score),
                0.59,
            )
        relevance = max(self.keyword_score, self.context_keyword_score)
        return (
            (0.30 * self.combined_score)
            + (0.20 * self.vector_score)
            + (0.35 * relevance)
            + (0.15 * 1.0)
        )


@dataclass(frozen=True)
class RetrievalResult:
    processed: PreprocessedQuery
    sources: List[SourceDocument]
    context: List[str]
    mapped_topic: Optional[str]
    quality: RetrievalQuality
    query_embedding: Optional[List[float]] = None
    timings_ms: Optional[Dict[str, float]] = None
