import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.errors import PyMongoError

from app.config.settings import Settings, get_settings
from app.database.mongo_client import get_database
from app.models.request_models import ChatQueryRequest, TicketCreateRequest
from app.models.response_models import (
    AnalyticsItem,
    ChatQueryResponse,
    HealthResponse,
    HistoryItem,
    TicketResponse,
)
from app.services.alias_learning_service import AliasLearningService
from app.services.analytics_service import AnalyticsService
from app.services.cache_service import CacheService
from app.services.confidence_service import ConfidenceService
from app.services.embedding_service import EmbeddingService
from app.services.gemini_service import GeminiService
from app.services.nlp_service import NLPPreprocessingService
from app.services.retrieval_service import RetrievalService
from app.services.ticket_service import TicketService

logger = logging.getLogger(__name__)
router = APIRouter(prefix=get_settings().api_prefix, tags=["Module 4 Chatbot"])


def get_services(settings: Settings = Depends(get_settings)) -> dict:
    db = get_database(settings)
    nlp = NLPPreprocessingService(db)
    embedding = EmbeddingService(settings.embedding_model_name)
    return {
        "settings": settings,
        "db": db,
        "retrieval": RetrievalService(db, settings, nlp, embedding),
        "confidence": ConfidenceService(settings),
        "cache": CacheService(db),
        "gemini": GeminiService(settings),
        "analytics": AnalyticsService(db),
        "alias_learning": AliasLearningService(db, settings),
        "tickets": TicketService(db),
    }


@router.post("/query", response_model=ChatQueryResponse, summary="Process a user query with RAG")
def query_chatbot(payload: ChatQueryRequest, services: Annotated[dict, Depends(get_services)]) -> ChatQueryResponse:
    try:
        processed, sources, context, mapped_topic, score = services["retrieval"].retrieve(payload.query)
        confidence = services["confidence"].evaluate(score)
        cached_answer = services["cache"].get_cached_answer(mapped_topic)
        ticket_id = None
        cached = cached_answer is not None
        answer = cached_answer or services["gemini"].generate_answer(payload.query, context)

        if not cached:
            services["cache"].store_answer(mapped_topic, payload.query, answer)
        if confidence.ticket_required:
            ticket = services["tickets"].create_ticket(payload.query, str(payload.email) if payload.email else None, payload.session_id)
            ticket_id = services["tickets"].stringify_id(ticket)

        services["analytics"].record(payload.query, mapped_topic, score, answer, payload.session_id)
        services["alias_learning"].observe(processed.normalized, mapped_topic)

        return ChatQueryResponse(
            answer=answer,
            mapped_topic=mapped_topic,
            confidence=confidence,
            ticket_required=confidence.ticket_required,
            ticket_id=ticket_id,
            cached=cached,
            sources=sources,
            session_id=payload.session_id,
        )
    except PyMongoError as exc:
        logger.exception("Database error while processing query")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable") from exc
    except Exception as exc:
        logger.exception("Unexpected error while processing query")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Query processing failed") from exc


@router.post("/ticket", response_model=TicketResponse, summary="Create a manual escalation ticket")
def create_ticket(payload: TicketCreateRequest, services: Annotated[dict, Depends(get_services)]) -> TicketResponse:
    try:
        ticket = services["tickets"].create_ticket(payload.question, str(payload.email), payload.session_id)
        return TicketResponse(
            ticket_id=services["tickets"].stringify_id(ticket),
            status=ticket["status"],
            created_at=ticket["created_at"],
        )
    except PyMongoError as exc:
        logger.exception("Database error while creating ticket")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable") from exc


@router.get("/history", response_model=list[HistoryItem], summary="Get session query history")
def get_history(
    services: Annotated[dict, Depends(get_services)],
    session_id: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[HistoryItem]:
    return [
        HistoryItem(
            query=item["query"],
            mapped_topic=item.get("mapped_topic"),
            similarity_score=float(item.get("similarity_score", 0.0)),
            answer=item.get("answer"),
            timestamp=item["timestamp"],
            session_id=item.get("session_id"),
        )
        for item in services["analytics"].history(session_id, limit)
    ]


@router.get("/analytics", response_model=list[AnalyticsItem], summary="Get top query analytics")
def get_analytics(
    services: Annotated[dict, Depends(get_services)],
    limit: int = Query(default=20, ge=1, le=100),
) -> list[AnalyticsItem]:
    return [
        AnalyticsItem(
            query=item["query"],
            mapped_topic=item.get("mapped_topic"),
            similarity_score=float(item.get("similarity_score", 0.0)),
            frequency=int(item.get("frequency", 1)),
            timestamp=item["timestamp"],
        )
        for item in services["analytics"].top_queries(limit)
    ]


@router.get("/health", response_model=HealthResponse, summary="Check chatbot module health")
def health(services: Annotated[dict, Depends(get_services)]) -> HealthResponse:
    db_status = "ok"
    try:
        services["db"].command("ping")
    except Exception:
        logger.exception("MongoDB health check failed")
        db_status = "unavailable"
    return HealthResponse(
        status="ok" if db_status == "ok" else "degraded",
        database=db_status,
        services={
            "nlp": "ok",
            "embedding_model": services["settings"].embedding_model_name,
            "gemini_configured": bool(services["settings"].gemini_api_key),
            "vector_index": services["settings"].vector_index_name,
        },
    )
