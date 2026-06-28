import unittest
from types import SimpleNamespace

from app.models.response_models import SourceDocument
from app.models.retrieval_models import RetrievalQuality
from app.services.cache_service import CacheService
from app.services.confidence_service import ConfidenceService
from app.services.nlp_service import PreprocessedQuery
from app.services.retrieval_service import RetrievalService


class FakeCollection:
    def __init__(self, entries):
        self.entries = entries

    def find(self, *args, **kwargs):
        return list(self.entries)


class FakeDB:
    def __init__(self, entries):
        self.response_cache = FakeCollection(entries)


class RetrievalPipelineTests(unittest.TestCase):
    def test_cache_accepts_semantic_match_without_strong_keyword_overlap(self):
        service = CacheService(FakeDB([{
            "topic": "refunds",
            "answer": "Use the refund portal",
            "sample_query": "how do I request a refund",
            "query_embedding": [1.0, 0.0, 0.0],
            "retrieval_score": 0.85,
        }]))

        cached_answer = service.get_cached_answer(
            topic="refunds",
            query="how can I get my money back",
            query_embedding=[0.95, 0.2, 0.0],
            similarity_floor=0.80,
        )

        self.assertEqual(cached_answer, "Use the refund portal")

    def test_semantic_match_can_pass_answerability_filter(self):
        service = RetrievalService(
            db=SimpleNamespace(),
            settings=SimpleNamespace(
                retrieval_candidate_limit=5,
                top_k=3,
                hybrid_vector_weight=0.85,
                hybrid_keyword_weight=0.15,
                weak_retrieval_threshold=0.35,
                min_answerability_keyword_score=0.40,
                min_high_confidence_keyword_score=0.50,
                high_confidence_threshold=0.90,
                medium_confidence_threshold=0.75,
            ),
            nlp_service=SimpleNamespace(),
            embedding_service=SimpleNamespace(),
        )
        processed = PreprocessedQuery(
            original="refund policy",
            normalized="refund policy",
            tokens=["refund", "policy"],
            corrected_tokens=["refund", "policy"],
            expanded_query="refund policy",
            aliases={},
            phrases=["refund policy"],
            search_tokens=["refund", "policy"],
        )
        sources = [
            SourceDocument(
                id="1",
                collection="knowledge_chunks",
                topic="refunds",
                score=0.90,
                preview="refund policy details",
                vector_score=0.90,
                keyword_score=0.10,
            )
        ]

        filtered = service._filter_answerable_sources(processed, sources)

        self.assertEqual(len(filtered), 1)

    def test_confidence_is_low_for_unrelated_queries(self):
        service = ConfidenceService(settings=SimpleNamespace(min_high_confidence_keyword_score=0.50))
        quality = RetrievalQuality(
            vector_score=0.10,
            keyword_score=0.05,
            combined_score=0.10,
            answerable=True,
            weak_retrieval=False,
            context_keyword_score=0.02,
        )

        result = service.evaluate(quality)

        self.assertEqual(result.label, "low")
        self.assertLess(result.score, 0.10)


if __name__ == "__main__":
    unittest.main()
