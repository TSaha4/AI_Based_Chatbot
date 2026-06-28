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

        # Semantic similarity dominates the confidence score
        score = (semantic * 0.90) + (context * 0.10)
        score = max(0.0, min(score, 1.0))

        # If retriever determined no evidence exists, trigger ticket creation
        if not quality.answerable:
            return ConfidenceResult(
                label="low",
                score=score,
                ticket_required=True,
            )

        # Classify confidence label based primarily on embedding similarity
        # High: solid semantic match
        if semantic >= 0.80 or (score >= 0.80 and semantic >= 0.75):
            return ConfidenceResult(
                label="high",
                score=score,
                ticket_required=False,
            )
        # Medium: moderate semantic match
        elif semantic >= 0.65 or (score >= 0.65 and semantic >= 0.60):
            return ConfidenceResult(
                label="medium",
                score=score,
                ticket_required=False,
            )
        # Low: borderline/weak match but evidence exists
        else:
            return ConfidenceResult(
                label="low",
                score=score,
                ticket_required=False,
            )
