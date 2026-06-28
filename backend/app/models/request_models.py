from typing import Optional
import re

from pydantic import BaseModel, Field, field_validator


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class ChatQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="User question")
    email: Optional[str] = Field(default=None, description="Optional user email for escalation")
    session_id: Optional[str] = Field(default=None, max_length=128, description="Client session id")

    @field_validator("email", mode="before")
    @classmethod
    def validate_optional_email(cls, value):
        if value in (None, ""):
            return None
        email = str(value).strip()
        if not EMAIL_PATTERN.match(email):
            raise ValueError("email must be valid")
        return email


class TicketCreateRequest(BaseModel):
    question: str = Field(..., max_length=1000)
    email: str
    session_id: Optional[str] = Field(default=None, max_length=128)

    @field_validator("question", mode="before")
    @classmethod
    def validate_question(cls, value):
        if not isinstance(value, str):
            raise ValueError("question must be a string")
        question = value.strip()
        if not question:
            raise ValueError("question must not be empty")
        return question

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value):
        email = str(value).strip()
        if not EMAIL_PATTERN.match(email):
            raise ValueError("email must be valid")
        return email


class AdminResolveTicketRequest(BaseModel):
    answer: str = Field(..., max_length=5000)
    topic: Optional[str] = Field(default=None, max_length=200)
    resolved_by: Optional[str] = Field(default=None, max_length=200)

    @field_validator("answer", mode="before")
    @classmethod
    def validate_answer(cls, value):
        if not isinstance(value, str):
            raise ValueError("answer must be a string")
        answer = value.strip()
        if not answer:
            raise ValueError("answer must not be empty")
        return answer


class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=200)
    password: str = Field(..., min_length=1, max_length=200)


class AdminSignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    department: str = Field(..., min_length=1, max_length=200)
    employee_id: str = Field(..., min_length=1, max_length=200)
    email: str = Field(..., min_length=1, max_length=200)
    password: str = Field(..., min_length=1, max_length=200)
