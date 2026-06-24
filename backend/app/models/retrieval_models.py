from dataclasses import dataclass
from typing import List, Optional

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

    @property
    def combined_confidence(self) -> float:
        answerability = 1.0 if self.answerable else 0.0
        return (
            (0.35 * self.combined_score)
            + (0.25 * self.vector_score)
            + (0.25 * self.keyword_score)
            + (0.15 * answerability)
        )


@dataclass(frozen=True)
class RetrievalResult:
    processed: PreprocessedQuery
    sources: List[SourceDocument]
    context: List[str]
    mapped_topic: Optional[str]
    quality: RetrievalQuality
