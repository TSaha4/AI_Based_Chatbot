from datetime import datetime, timezone
from typing import Optional

from pymongo.database import Database

from app.config.settings import Settings


class AliasLearningService:
    """Learns repeated alternate wording for known topics."""

    def __init__(self, db: Database, settings: Settings):
        self.collection = db.topic_aliases
        self.settings = settings

    def observe(self, normalized_query: str, mapped_topic: Optional[str]) -> None:
        if not mapped_topic or not normalized_query or normalized_query == mapped_topic:
            return
        now = datetime.now(timezone.utc)
        self.collection.update_one(
            {"topic": mapped_topic, "alias": normalized_query},
            {
                "$set": {"topic": mapped_topic, "alias": normalized_query, "updated_at": now},
                "$setOnInsert": {"created_at": now, "promoted": False},
                "$inc": {"frequency": 1},
            },
            upsert=True,
        )
        self.collection.update_many(
            {
                "topic": mapped_topic,
                "alias": normalized_query,
                "frequency": {"$gte": self.settings.alias_learning_min_frequency},
            },
            {"$set": {"promoted": True}},
        )
