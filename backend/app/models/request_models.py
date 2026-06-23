from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class ChatQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="User question")
    email: Optional[EmailStr] = Field(default=None, description="Optional user email for escalation")
    session_id: Optional[str] = Field(default=None, max_length=128, description="Client session id")


class TicketCreateRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    email: EmailStr
    session_id: Optional[str] = Field(default=None, max_length=128)


class HistoryQuery(BaseModel):
    session_id: Optional[str] = None
    limit: int = Field(default=20, ge=1, le=100)


class AnalyticsQuery(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)
