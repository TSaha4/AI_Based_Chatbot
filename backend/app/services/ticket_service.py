from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pymongo.database import Database


class TicketService:
    """Creates low-confidence escalation tickets without sending email."""

    def __init__(self, db: Database):
        self.collection = db.tickets

    def create_ticket(self, question: str, email: Optional[str], session_id: Optional[str] = None) -> dict:
        now = datetime.now(timezone.utc)
        payload = {
            "question": question,
            "email": email,
            "session_id": session_id,
            "status": "open",
            "created_at": now,
        }
        result = self.collection.insert_one(payload)
        payload["_id"] = result.inserted_id
        return payload

    @staticmethod
    def stringify_id(ticket: dict) -> str:
        ticket_id = ticket.get("_id")
        return str(ticket_id if isinstance(ticket_id, ObjectId) else ticket_id)
