import logging
import re
import string
from datetime import datetime, timezone
from typing import List, Optional

import numpy as np
from pymongo.database import Database

logger = logging.getLogger(__name__)

# Minimum cosine similarity between the incoming query embedding and the
# cached query embedding for a cache hit to be accepted.
# 0.86 accepts semantically equivalent phrasings while avoiding loose topic hits.
_CACHE_SIMILARITY_FLOOR = 0.86

# Hard minimum combined retrieval score the cached entry must have had
# to be eligible at all. Entries stored from weak retrievals are skipped.
_CACHE_MIN_RETRIEVAL_SCORE = 0.50
_CACHE_STOPWORDS = {
    "a", "an", "the", "is", "are", "am", "to", "of", "in", "on", "for",
    "and", "or", "with", "by", "from", "can", "could", "should", "would",
    "i", "me", "my", "we", "our", "you", "your", "please", "what", "how",
    "when", "where", "why", "does", "do", "tell", "explain", "about",
}


class CacheService:
    """Reads and writes Gemini responses keyed by topic + query embedding.

    A cached answer is only returned when the incoming query embedding is
    cosine-similar enough to the embedding stored at cache-write time. This
    prevents answers from being served to semantically distinct queries that
    happen to share a mapped topic label.
    """

    def __init__(self, db: Database):
        self.collection = db.response_cache

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_cached_answer(
        self,
        topic: Optional[str],
        query: Optional[str] = None,
        query_embedding: Optional[List[float]] = None,
        similarity_floor: float = _CACHE_SIMILARITY_FLOOR,
    ) -> Optional[str]:
        """Return a cached answer only when it is genuinely equivalent.

        Falls back to topic-only lookup (no similarity gating) only when no
        query embedding is supplied. This path is kept for forward-compat but
        should not be hit in normal flow.
        """
        if not topic:
            return None

        # Fetch all cache entries for this topic (usually just one)
        candidates = list(
            self.collection.find(
                {"topic": topic},
                sort=[("updated_at", -1)],
                limit=10,
            )
        )
        if not candidates:
            return None

        # If no embedding provided, do NOT serve the cache because it is too risky.
        if query_embedding is None:
            logger.debug("cache: no query embedding supplied; skipping cache for topic=%r", topic)
            return None

        best_answer: Optional[str] = None
        best_similarity: float = -1.0
        query_numbers = self._numbers(query or "")
        query_entities = self._entities(query or "")

        for entry in candidates:
            # Skip entries that were stored from low-quality retrievals
            stored_retrieval_score = entry.get("retrieval_score", 1.0)
            if stored_retrieval_score < _CACHE_MIN_RETRIEVAL_SCORE:
                logger.debug(
                    "cache: skipping low-quality entry (retrieval_score=%.3f) for topic=%r",
                    stored_retrieval_score,
                    topic,
                )
                continue

            stored_embedding = entry.get("query_embedding")
            if not stored_embedding or not isinstance(stored_embedding, list):
                # Legacy entries without embeddings are skipped
                continue

            sample_query = str(entry.get("sample_query") or "")
            sample_numbers = self._numbers(sample_query)
            if query_numbers != sample_numbers:
                logger.debug("cache: skipping numeric mismatch for topic=%r", topic)
                continue
            if self._entity_mismatch(query_entities, self._entities(sample_query)):
                logger.debug("cache: skipping entity mismatch for topic=%r", topic)
                continue

            similarity = self._cosine_similarity(query_embedding, stored_embedding)
            if similarity > best_similarity:
                best_similarity = similarity
                if similarity >= similarity_floor:
                    best_answer = entry.get("answer")

        if best_answer is not None:
            logger.debug(
                "cache: HIT  topic=%r  similarity=%.4f (floor=%.2f)",
                topic,
                best_similarity,
                similarity_floor,
            )
        else:
            logger.debug(
                "cache: MISS topic=%r  best_similarity=%.4f (floor=%.2f)",
                topic,
                best_similarity,
                similarity_floor,
            )
        return best_answer

    def get_equivalent_cached_response(
        self,
        query: str,
        query_embedding: Optional[List[float]],
        similarity_floor: float = _CACHE_SIMILARITY_FLOOR,
    ) -> Optional[dict]:
        """Return a validated cache entry before retrieval when possible."""
        if query_embedding is None:
            return None

        candidates = list(
            self.collection.find(
                {"query_embedding": {"$type": "array"}},
                sort=[("updated_at", -1)],
                limit=50,
            )
        )
        if not candidates:
            return None

        query_numbers = self._numbers(query)
        query_entities = self._entities(query)
        best_entry: Optional[dict] = None
        best_similarity = -1.0

        for entry in candidates:
            if entry.get("retrieval_score", 1.0) < _CACHE_MIN_RETRIEVAL_SCORE:
                continue

            sample_query = str(entry.get("sample_query") or "")
            if query_numbers != self._numbers(sample_query):
                continue
            if self._entity_mismatch(query_entities, self._entities(sample_query)):
                continue

            stored_embedding = entry.get("query_embedding")
            if not stored_embedding or not isinstance(stored_embedding, list):
                continue

            similarity = self._cosine_similarity(query_embedding, stored_embedding)
            if similarity >= similarity_floor and similarity > best_similarity:
                best_similarity = similarity
                best_entry = entry

        if best_entry is None:
            logger.debug("cache: pre-retrieval MISS")
            return None

        logger.debug(
            "cache: pre-retrieval HIT topic=%r similarity=%.4f",
            best_entry.get("topic"),
            best_similarity,
        )
        return best_entry

    def store_answer(
        self,
        topic: Optional[str],
        query: str,
        answer: str,
        query_embedding: Optional[List[float]] = None,
        retrieval_score: float = 1.0,
    ) -> None:
        """Persist a Gemini answer keyed by topic + query embedding."""
        if not topic:
            return
        now = datetime.now(timezone.utc)
        # Keep the existing unique-topic cache contract. Equivalence is enforced
        # on read by comparing the incoming query with this stored sample query.
        self.collection.update_one(
            {"topic": topic},
            {
                "$set": {
                    "topic": topic,
                    "answer": answer,
                    "sample_query": query,
                    "normalized_sample_query": self._normalize_query(query),
                    "query_embedding": query_embedding,
                    "retrieval_score": retrieval_score,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
                "$inc": {"hits_seed": 1},
            },
            upsert=True,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _cosine_similarity(a: List[float], b: List[float]) -> float:
        try:
            va = np.array(a, dtype=float)
            vb = np.array(b, dtype=float)
            denom = np.linalg.norm(va) * np.linalg.norm(vb)
            if denom == 0:
                return 0.0
            return float(np.dot(va, vb) / denom)
        except Exception:
            return 0.0

    @staticmethod
    def _normalize_query(query: str) -> str:
        query = query.lower().strip()
        query = re.sub(r"(?<=\d),(?=\d)", "", query)
        query = query.translate(str.maketrans({char: " " for char in string.punctuation}))
        return re.sub(r"\s+", " ", query).strip()

    @classmethod
    def _content_tokens(cls, query: str) -> set[str]:
        normalized = cls._normalize_query(query)
        return {
            token
            for token in re.findall(r"[a-z0-9]+", normalized)
            if len(token) > 1 and token not in _CACHE_STOPWORDS
        }

    @staticmethod
    def _numbers(query: str) -> tuple[str, ...]:
        normalized = re.sub(r"(?<=\d),(?=\d)", "", query.lower())
        return tuple(re.findall(r"\b\d+(?:\.\d+)?\b", normalized))

    @staticmethod
    def _entities(query: str) -> set[str]:
        return {
            token.upper()
            for token in re.findall(r"\b(?:[A-Z]{2,}|[A-Z][a-z]{2,})\b", query)
            if token.lower() not in _CACHE_STOPWORDS
        }

    @staticmethod
    def _entity_mismatch(left: set[str], right: set[str]) -> bool:
        return bool(left and right and left.isdisjoint(right))
