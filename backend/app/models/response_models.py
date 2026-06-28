from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SourceDocument(BaseModel):
    id: str
    collection: str
    topic: Optional[str] = None
    score: float
    preview: str
    vector_score: Optional[float] = None
    keyword_score: Optional[float] = None
    source_document: Optional[str] = None


class ConfidenceResult(BaseModel):
    label: str
    score: float
    ticket_required: bool


class ChatQueryResponse(BaseModel):
    answer: str
    mapped_topic: Optional[str]
    confidence: ConfidenceResult
    ticket_required: bool
    ticket_suggested: bool = False
    ticket_id: Optional[str] = None
    cached: bool = False
    sources: List[SourceDocument] = Field(default_factory=list)
    session_id: Optional[str] = None
    answer_generated: bool = True


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


class TicketItem(BaseModel):
    ticket_id: str
    question: str
    email: Optional[str] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    session_id: Optional[str] = None
    answer: Optional[str] = None
    resolved_by: Optional[str] = None


class AdminResolveTicketResponse(BaseModel):
    ticket_id: str
    status: str
    email_sent: bool
    stored_in_admin_resolutions: bool
    resolved_at: datetime


# ---------------------------
# ADMIN LOGIN RESPONSE
# ---------------------------
class AdminLoginResponse(BaseModel):
    authenticated: bool
    access_token: Optional[str] = None
    token_type: str = "bearer"

    admin_id: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None


class UploadResponse(BaseModel):
    message: str
    source_document: str
    chunks_stored: int
    collection: str = "knowledge_chunks"


class AdminOverviewResponse(BaseModel):
    health: HealthResponse
    collections: Dict[str, int]
    total_tickets: int = 0
    pending_tickets: int = 0
    resolved_tickets: int = 0
    knowledge_base_count: int = 0
    analytics_count: int = 0
    recent_queries: List[AnalyticsItem] = Field(default_factory=list)
    recent_tickets: List[TicketItem] = Field(default_factory=list)