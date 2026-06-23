from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SourceDocument(BaseModel):
    id: str
    collection: str
    topic: Optional[str] = None
    score: float
    preview: str


class ConfidenceResult(BaseModel):
    label: str
    score: float
    ticket_required: bool


class ChatQueryResponse(BaseModel):
    answer: str
    mapped_topic: Optional[str]
    confidence: ConfidenceResult
    ticket_required: bool
    ticket_id: Optional[str] = None
    cached: bool = False
    sources: List[SourceDocument] = Field(default_factory=list)
    session_id: Optional[str] = None


class TicketResponse(BaseModel):
    ticket_id: str
    status: str
    created_at: datetime


class HistoryItem(BaseModel):
    query: str
    mapped_topic: Optional[str]
    similarity_score: float
    answer: Optional[str] = None
    timestamp: datetime
    session_id: Optional[str] = None


class AnalyticsItem(BaseModel):
    query: str
    mapped_topic: Optional[str]
    similarity_score: float
    frequency: int
    timestamp: datetime


class HealthResponse(BaseModel):
    status: str
    database: str
    services: Dict[str, Any]
