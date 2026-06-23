from typing import List, Optional

from bson import ObjectId
from pymongo.database import Database

from app.config.settings import Settings
from app.models.response_models import SourceDocument
from app.services.embedding_service import EmbeddingService
from app.services.nlp_service import NLPPreprocessingService, PreprocessedQuery


class RetrievalService:
    """Runs NLP, embedding generation, vector retrieval, and similarity ranking."""

    def __init__(
        self,
        db: Database,
        settings: Settings,
        nlp_service: NLPPreprocessingService,
        embedding_service: EmbeddingService,
    ):
        self.db = db
        self.settings = settings
        self.nlp_service = nlp_service
        self.embedding_service = embedding_service

    def retrieve(self, query: str) -> tuple[PreprocessedQuery, List[SourceDocument], List[str], Optional[str], float]:
        processed = self.nlp_service.preprocess(query)
        embedding = self.embedding_service.embed_query(processed.expanded_query or processed.normalized)
        knowledge = self._vector_search("knowledge_chunks", embedding)
        resolutions = self._vector_search("admin_resolutions", embedding)
        ranked = sorted([*knowledge, *resolutions], key=lambda item: item.score, reverse=True)[: self.settings.top_k]
        mapped_topic = self._resolve_topic(processed, ranked)
        score = ranked[0].score if ranked else 0.0
        context = [source.preview for source in ranked]
        return processed, ranked, context, mapped_topic, score

    def _vector_search(self, collection_name: str, embedding: List[float]) -> List[SourceDocument]:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": self.settings.vector_index_name,
                    "path": "embedding",
                    "queryVector": embedding,
                    "numCandidates": max(self.settings.top_k * 10, 50),
                    "limit": self.settings.top_k,
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "topic": 1,
                    "title": 1,
                    "content": 1,
                    "text": 1,
                    "answer": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]
        documents = self.db[collection_name].aggregate(pipeline)
        return [self._to_source_document(collection_name, item) for item in documents]

    def _to_source_document(self, collection_name: str, item: dict) -> SourceDocument:
        content = item.get("content") or item.get("text") or item.get("answer") or item.get("title") or ""
        preview = str(content).strip()
        return SourceDocument(
            id=str(item.get("_id") if isinstance(item.get("_id"), ObjectId) else item.get("_id")),
            collection=collection_name,
            topic=item.get("topic") or item.get("title"),
            score=float(item.get("score", 0.0)),
            preview=preview[:1200],
        )

    def _resolve_topic(self, processed: PreprocessedQuery, sources: List[SourceDocument]) -> Optional[str]:
        if processed.aliases:
            return next(iter(processed.aliases.values()))
        for source in sources:
            if source.topic:
                return source.topic
        return None
