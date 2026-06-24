import logging
import re
from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np
from bson import ObjectId
from pymongo.database import Database

from app.config.settings import Settings
from app.models.response_models import SourceDocument
from app.models.retrieval_models import RetrievalQuality, RetrievalResult
from app.services.embedding_service import EmbeddingService
from app.services.nlp_service import NLPPreprocessingService, PreprocessedQuery

logger = logging.getLogger(__name__)

INTENT_TOKENS = frozenset(
    {"how", "what", "when", "where", "why", "much", "many", "does", "do", "is", "are", "the"}
)


@dataclass
class _ScoredCandidate:
    source: SourceDocument
    vector_score: float
    keyword_score: float
    final_score: float


class RetrievalService:
    """Runs NLP, hybrid vector+keyword retrieval, answerability checks, and ranking."""

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

    def retrieve(self, query: str) -> RetrievalResult:
        processed = self.nlp_service.preprocess(query)
        embed_text = self._embedding_text(processed)
        embedding = self.embedding_service.embed_query(embed_text)

        candidate_limit = self.settings.retrieval_candidate_limit
        knowledge = self._vector_search("knowledge_chunks", embedding, candidate_limit)
        resolutions = self._vector_search("admin_resolutions", embedding, candidate_limit)
        keyword_hits = self._keyword_search(processed)

        candidates: List[tuple[str, dict]] = self._merge_candidates(
            [*knowledge, *resolutions, *keyword_hits],
            embedding,
        )
        scored = [self._score_candidate(collection_name, item, processed) for collection_name, item in candidates]
        ranked = sorted(scored, key=lambda item: item.final_score, reverse=True)[: self.settings.top_k]

        sources = [
            item.source.model_copy(
                update={
                    "score": item.final_score,
                    "vector_score": item.vector_score,
                    "keyword_score": item.keyword_score,
                }
            )
            for item in ranked
        ]
        answerable_sources = self._filter_answerable_sources(processed, sources)
        quality = self._build_quality(processed, ranked, answerable_sources)
        mapped_topic = self._resolve_topic(processed, answerable_sources or sources)
        context = [source.preview for source in answerable_sources]

        self._log_retrieval_debug(query, processed, embed_text, ranked, quality)

        return RetrievalResult(
            processed=processed,
            sources=sources,
            context=context,
            mapped_topic=mapped_topic,
            quality=quality,
        )

    def _embedding_text(self, processed: PreprocessedQuery) -> str:
        if processed.aliases:
            alias_text = " ".join(processed.aliases.values())
            return f"{processed.normalized} {alias_text}".strip()
        return processed.normalized

    def _vector_search(self, collection_name: str, embedding: List[float], limit: int) -> List[tuple[str, dict]]:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": self.settings.vector_index_name,
                    "path": "embedding",
                    "queryVector": embedding,
                    "numCandidates": max(limit * 10, 50),
                    "limit": limit,
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
                    "question": 1,
                    "source_document": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]
        return [(collection_name, item) for item in self.db[collection_name].aggregate(pipeline)]

    def _keyword_search(self, processed: PreprocessedQuery) -> List[tuple[str, dict]]:
        concepts = self._concept_tokens(processed)
        if not concepts:
            return []

        hits: List[tuple[str, dict]] = []
        seen_ids: set[str] = set()
        limit = max(3, self.settings.top_k)

        for token in concepts[:6]:
            pattern = {"$regex": rf"\b{re.escape(token)}\b", "$options": "i"}
            for collection_name in ("knowledge_chunks", "admin_resolutions"):
                if collection_name == "admin_resolutions":
                    query = {"$or": [{"text": pattern}, {"answer": pattern}, {"question": pattern}]}
                else:
                    query = {"text": pattern}
                for item in self.db[collection_name].find(query).limit(limit):
                    doc_id = str(item.get("_id"))
                    if doc_id in seen_ids:
                        continue
                    seen_ids.add(doc_id)
                    hits.append((collection_name, item))
        return hits

    def _merge_candidates(
        self,
        candidates: List[tuple[str, dict]],
        embedding: List[float],
    ) -> List[tuple[str, dict]]:
        merged: Dict[str, tuple[str, dict]] = {}
        query_vector = np.array(embedding, dtype=float)

        for collection_name, item in candidates:
            doc_id = str(item.get("_id"))
            if doc_id in merged:
                existing = merged[doc_id][1]
                if float(item.get("score", 0.0)) > float(existing.get("score", 0.0)):
                    merged[doc_id] = (collection_name, item)
                continue

            enriched = dict(item)
            if not enriched.get("score"):
                chunk_embedding = enriched.get("embedding")
                if isinstance(chunk_embedding, list) and chunk_embedding:
                    chunk_vector = np.array(chunk_embedding, dtype=float)
                    enriched["score"] = float(np.dot(query_vector, chunk_vector))
                else:
                    enriched["score"] = 0.0
            merged[doc_id] = (collection_name, enriched)

        return list(merged.values())

    def _score_candidate(self, collection_name: str, item: dict, processed: PreprocessedQuery) -> _ScoredCandidate:
        source = self._to_source_document(collection_name, item)
        vector_score = float(item.get("score", 0.0))
        keyword_score, substantive_overlap = self._keyword_relevance(processed, source.preview)
        final_score = (
            (vector_score * self.settings.hybrid_vector_weight)
            + (keyword_score * self.settings.hybrid_keyword_weight)
        )
        substantive_tokens = self._concept_tokens(processed)
        if substantive_tokens and substantive_overlap >= 1.0:
            final_score = min(1.0, final_score + 0.12)
        return _ScoredCandidate(
            source=source,
            vector_score=vector_score,
            keyword_score=keyword_score,
            final_score=final_score,
        )

    def _keyword_relevance(self, processed: PreprocessedQuery, chunk_text: str) -> tuple[float, float]:
        text = chunk_text.lower()
        tokens = list(dict.fromkeys([*processed.search_tokens, *processed.tokens]))
        if not tokens and not processed.phrases:
            return 0.0, 0.0

        token_matches = sum(1 for token in tokens if self._token_in_text(token, text))
        token_overlap = token_matches / len(tokens) if tokens else 0.0

        phrase_matches = sum(1 for phrase in processed.phrases if phrase in text)
        phrase_overlap = phrase_matches / len(processed.phrases) if processed.phrases else 0.0

        substantive_tokens = [token for token in tokens if token not in INTENT_TOKENS] or tokens
        substantive_matches = sum(
            1 for token in substantive_tokens if self._token_in_text(token, text)
        )
        substantive_overlap = substantive_matches / len(substantive_tokens)

        exact_bonus = min(substantive_overlap, 1.0) * 0.2

        if phrase_overlap > 0:
            keyword_score = min(
                1.0,
                (0.35 * token_overlap) + (0.35 * phrase_overlap) + (0.3 * substantive_overlap) + exact_bonus,
            )
        else:
            keyword_score = min(1.0, (0.5 * token_overlap) + (0.5 * substantive_overlap) + exact_bonus)

        return keyword_score, substantive_overlap

    def _token_in_text(self, token: str, text: str) -> bool:
        if len(token) <= 4:
            return bool(re.search(rf"\b{re.escape(token)}\b", text))
        return token in text

    def _concept_tokens(self, processed: PreprocessedQuery) -> List[str]:
        tokens = list(dict.fromkeys([*processed.search_tokens, *processed.tokens]))
        concepts = [token for token in tokens if token not in INTENT_TOKENS and len(token) > 2]
        return concepts or tokens

    def _build_quality(
        self,
        processed: PreprocessedQuery,
        ranked: List[_ScoredCandidate],
        answerable_sources: List[SourceDocument],
    ) -> RetrievalQuality:
        top_vector = ranked[0].vector_score if ranked else 0.0
        top_keyword = ranked[0].keyword_score if ranked else 0.0
        top_combined = ranked[0].final_score if ranked else 0.0
        if answerable_sources:
            best = max(answerable_sources, key=lambda source: source.score)
            top_vector = best.vector_score or top_vector
            top_keyword = best.keyword_score or top_keyword
            top_combined = best.score
        answerable = bool(answerable_sources)
        weak_retrieval = (not answerable) or top_combined < self.settings.weak_retrieval_threshold
        return RetrievalQuality(
            vector_score=top_vector,
            keyword_score=top_keyword,
            combined_score=top_combined,
            answerable=answerable,
            weak_retrieval=weak_retrieval,
        )

    def _filter_answerable_sources(
        self,
        processed: PreprocessedQuery,
        sources: List[SourceDocument],
    ) -> List[SourceDocument]:
        concept_tokens = self._concept_tokens(processed)
        if not concept_tokens:
            return sources

        matched = [
            source
            for source in sources
            if any(self._token_in_text(token, source.preview.lower()) for token in concept_tokens)
            or any(phrase in source.preview.lower() for phrase in processed.phrases)
        ]
        return matched

    def _is_answerable(self, processed: PreprocessedQuery, ranked: List[_ScoredCandidate]) -> bool:
        sources = [item.source for item in ranked]
        return bool(self._filter_answerable_sources(processed, sources))

    def _to_source_document(self, collection_name: str, item: dict) -> SourceDocument:
        if collection_name == "admin_resolutions":
            content = item.get("text") or item.get("answer") or item.get("question") or ""
        else:
            content = item.get("text") or item.get("content") or item.get("answer") or item.get("title") or ""
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

    def _log_retrieval_debug(
        self,
        query: str,
        processed: PreprocessedQuery,
        embed_text: str,
        ranked: List[_ScoredCandidate],
        quality: RetrievalQuality,
    ) -> None:
        payload = {
            "query": query,
            "normalized": processed.normalized,
            "embed_text": embed_text,
            "search_tokens": processed.search_tokens,
            "phrases": processed.phrases,
            "vector_score": round(quality.vector_score, 6),
            "keyword_score": round(quality.keyword_score, 6),
            "combined_score": round(quality.combined_score, 6),
            "answerable": quality.answerable,
            "weak_retrieval": quality.weak_retrieval,
            "chunks": [
                {
                    "collection": item.source.collection,
                    "topic": item.source.topic,
                    "vector_score": round(item.vector_score, 6),
                    "keyword_score": round(item.keyword_score, 6),
                    "final_score": round(item.final_score, 6),
                    "preview": item.source.preview[:160],
                }
                for item in ranked
            ],
        }
        logger.debug("retrieval_hybrid %s", payload)
        if self.settings.retrieval_debug:
            logger.info("retrieval_hybrid %s", payload)
