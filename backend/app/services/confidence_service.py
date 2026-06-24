from app.config.settings import Settings
from app.models.response_models import ConfidenceResult
from app.models.retrieval_models import RetrievalQuality


class ConfidenceService:
    """Classifies retrieval confidence from hybrid retrieval quality."""

    def __init__(self, settings: Settings):
        self.settings = settings

    def evaluate(self, quality: RetrievalQuality) -> ConfidenceResult:
        score = quality.combined_confidence
        if not quality.answerable or quality.weak_retrieval:
            return ConfidenceResult(label="low", score=score, ticket_required=True)
        if score >= self.settings.high_confidence_threshold:
            return ConfidenceResult(label="high", score=score, ticket_required=False)
        if score >= self.settings.medium_confidence_threshold:
            return ConfidenceResult(label="medium", score=score, ticket_required=False)
        return ConfidenceResult(label="low", score=score, ticket_required=True)
