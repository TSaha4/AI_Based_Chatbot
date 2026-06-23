from app.config.settings import Settings
from app.models.response_models import ConfidenceResult


class ConfidenceService:
    """Classifies retrieval confidence from the top similarity score."""

    def __init__(self, settings: Settings):
        self.settings = settings

    def evaluate(self, score: float) -> ConfidenceResult:
        if score >= self.settings.high_confidence_threshold:
            return ConfidenceResult(label="high", score=score, ticket_required=False)
        if score >= self.settings.medium_confidence_threshold:
            return ConfidenceResult(label="medium", score=score, ticket_required=False)
        return ConfidenceResult(label="low", score=score, ticket_required=True)
