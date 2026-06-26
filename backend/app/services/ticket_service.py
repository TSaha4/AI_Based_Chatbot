from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from bson import ObjectId
from pymongo.database import Database


class TicketService:
    """Creates and updates consent-based escalation tickets."""

    def __init__(self, db: Database):
        self.collection = db.tickets

    def create_ticket(self, question: str, email: Optional[str], session_id: Optional[str] = None) -> dict:
        now = datetime.now(timezone.utc)
        payload = {
            "ticket_id": f"TKT-{uuid4().hex[:10].upper()}",
            "question": question,
            "email": email,
            "session_id": session_id,
            "status": "pending",
            "created_at": now,
            "resolved_at": None,
        }
        result = self.collection.insert_one(payload)
        payload["_id"] = result.inserted_id
        return payload

    def list_tickets(self, limit: int, status: Optional[str] = None) -> list[dict]:
        query = {"status": status} if status else {}
        if status == "pending":
            query = {"status": {"$in": ["pending", "open"]}}
        return list(self.collection.find(query).sort("created_at", -1).limit(limit))

    def get_ticket(self, ticket_id: str) -> Optional[dict]:
        query = {"ticket_id": ticket_id}
        if ObjectId.is_valid(ticket_id):
            query = {"$or": [{"ticket_id": ticket_id}, {"_id": ObjectId(ticket_id)}]}
        return self.collection.find_one(query)

    def mark_resolved(self, ticket_id: str, email_sent: bool | None = None) -> Optional[dict]:
        now = datetime.now(timezone.utc)
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return None

        update_fields = {"status": "resolved", "resolved_at": now}
        if email_sent is not None:
            update_fields["email_sent"] = email_sent

        self.collection.update_one(
            {"_id": ticket["_id"]},
            {"$set": update_fields},
        )
        ticket["status"] = "resolved"
        ticket["resolved_at"] = now
        if email_sent is not None:
            ticket["email_sent"] = email_sent
        return ticket

    @staticmethod
    def stringify_id(ticket: dict) -> str:
        ticket_id = ticket.get("ticket_id") or ticket.get("_id")
        return str(ticket_id if isinstance(ticket_id, ObjectId) else ticket_id)
