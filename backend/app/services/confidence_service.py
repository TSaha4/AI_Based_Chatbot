from app.config.settings import Settings
from app.models.response_models import ConfidenceResult
from app.models.retrieval_models import RetrievalQuality


class ConfidenceService:
    """Classifies retrieval confidence from hybrid retrieval quality."""

    def __init__(self, settings: Settings):
        self.settings = settings

    def evaluate(self, quality: RetrievalQuality) -> ConfidenceResult:
        # Base signals
        semantic = quality.vector_score or 0.0
        keyword = quality.keyword_score or 0.0
        context = quality.context_keyword_score or 0.0

        # Semantic similarity should dominate confidence.
        score = (semantic * 0.80) + (context * 0.15) + (keyword * 0.05)

        # Penalize weak semantic matches heavily.
        if semantic < 0.30:
            score *= 0.20

        # Completely unrelated queries should stay below ~10%.
        if semantic < 0.20:
            score = min(score, 0.08)

        # Keep score within [0, 1]
        score = max(0.0, min(score, 1.0))

        relevance = max(keyword, context)

        # Retrieval itself indicates the answer is unreliable.
        if not quality.answerable or quality.weak_retrieval:
            return ConfidenceResult(
                label="low",
                score=score,
                ticket_required=True,
            )

        # High confidence requires BOTH strong semantic similarity
        # and sufficient contextual relevance.
        if (
            semantic >= 0.85
            and relevance >= self.settings.min_high_confidence_keyword_score
            and score >= self.settings.high_confidence_threshold
        ):
            return ConfidenceResult(
                label="high",
                score=score,
                ticket_required=False,
            )

        if score >= self.settings.medium_confidence_threshold:
            return ConfidenceResult(
                label="medium",
                score=score,
                ticket_required=False,
            )

        return ConfidenceResult(
            label="low",
            score=score,
            ticket_required=True,
        )