from datetime import datetime, timezone
from typing import Optional

from pymongo.database import Database


class CacheService:
    """Reads and writes Gemini responses by mapped topic."""

    def __init__(self, db: Database):
        self.collection = db.response_cache

    def get_cached_answer(self, topic: Optional[str]) -> Optional[str]:
        if not topic:
            return None
        cached = self.collection.find_one({"topic": topic}, sort=[("updated_at", -1)])
        return cached.get("answer") if cached else None

    def store_answer(self, topic: Optional[str], query: str, answer: str) -> None:
        if not topic:
            return
        now = datetime.now(timezone.utc)
        self.collection.update_one(
            {"topic": topic},
            {
                "$set": {"topic": topic, "answer": answer, "sample_query": query, "updated_at": now},
                "$setOnInsert": {"created_at": now},
                "$inc": {"hits_seed": 1},
            },
            upsert=True,
        )
