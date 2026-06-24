from datetime import datetime, timezone
from typing import Optional

from pymongo.database import Database

from app.services.embedding_service import EmbeddingService


class AdminResolutionService:
    """Persists resolved ticket answers for future vector retrieval."""

    def __init__(self, db: Database, embedding_service: EmbeddingService):
        self.collection = db.admin_resolutions
        self.embedding_service = embedding_service

    def store_resolution(
        self,
        ticket_id: str,
        question: str,
        answer: str,
        topic: Optional[str],
        resolved_by: Optional[str],
    ) -> dict:
        now = datetime.now(timezone.utc)
        payload = {
            "ticket_id": ticket_id,
            "question": question,
            "answer": answer,
            "text": f"Question: {question}\nAnswer: {answer}",
            "embedding": self.embedding_service.embed_query(f"{question}\n{answer}"),
            "topic": topic or "admin_resolution",
            "resolved_by": resolved_by,
            "resolved_at": now,
        }
        self.collection.update_one(
            {"ticket_id": ticket_id},
            {"$set": payload},
            upsert=True,
        )
        return payload
