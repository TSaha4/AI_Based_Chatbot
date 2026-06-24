from datetime import datetime, timezone
from typing import List, Optional

from pymongo.database import Database


class AnalyticsService:
    """Stores query analytics and session history."""

    def __init__(self, db: Database):
        self.collection = db.query_analytics

    def record(
        self,
        query: str,
        mapped_topic: Optional[str],
        similarity_score: float,
        answer: Optional[str],
        session_id: Optional[str],
    ) -> None:
        now = datetime.now(timezone.utc)
        self.collection.update_one(
            {"query": query, "mapped_topic": mapped_topic, "session_id": session_id},
            {
                "$set": {
                    "query": query,
                    "mapped_topic": mapped_topic,
                    "similarity_score": similarity_score,
                    "answer": answer,
                    "timestamp": now,
                    "session_id": session_id,
                },
                "$inc": {"frequency": 1},
            },
            upsert=True,
        )

    def history(self, session_id: Optional[str], limit: int) -> List[dict]:
        query = {"session_id": session_id} if session_id else {}
        return list(self.collection.find(query).sort("timestamp", -1).limit(limit))

    def top_queries(self, limit: int) -> List[dict]:
        return list(self.collection.find({}).sort([("frequency", -1), ("timestamp", -1)]).limit(limit))
