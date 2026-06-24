import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pymongo.errors import PyMongoError

from app.config.settings import Settings, get_settings
from app.database.mongo_client import get_database
from app.models.request_models import AdminLoginRequest, AdminResolveTicketRequest, ChatQueryRequest, TicketCreateRequest
from app.models.response_models import (
    AdminLoginResponse,
    AdminResolveTicketResponse,
    AdminOverviewResponse,
    AnalyticsItem,
    ChatQueryResponse,
    HealthResponse,
    HistoryItem,
    TicketItem,
    TicketResponse,
    UploadResponse,
)
from app.services.admin_resolution_service import AdminResolutionService
from app.services.alias_learning_service import AliasLearningService
from app.services.analytics_service import AnalyticsService
from app.services.cache_service import CacheService
from app.services.confidence_service import ConfidenceService
from app.services.email_service import EmailService
from app.services.embedding_service import EmbeddingService
from app.services.gemini_service import GeminiService
from app.services.knowledge_ingestion_service import KnowledgeIngestionService
from app.services.nlp_service import NLPPreprocessingService
from app.services.retrieval_service import RetrievalService
from app.services.ticket_service import TicketService

logger = logging.getLogger(__name__)
router = APIRouter(prefix=get_settings().api_prefix, tags=["Module 4 Chatbot"])
COLLECTION_NAMES = [
    "knowledge_chunks",
    "admin_resolutions",
    "response_cache",
    "query_analytics",
    "topic_aliases",
    "tickets",
    "admins",
    "system_logs",
]


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
        "admin_resolutions": AdminResolutionService(db, embedding),
        "email": EmailService(settings),
        "ingestion": KnowledgeIngestionService(db, embedding),
    }


@router.post("/query", response_model=ChatQueryResponse, summary="Process a user query with RAG")
def query_chatbot(payload: ChatQueryRequest, services: Annotated[dict, Depends(get_services)]) -> ChatQueryResponse:
    try:
        result = services["retrieval"].retrieve(payload.query)
        confidence = services["confidence"].evaluate(result.quality)
        ticket_suggested = confidence.ticket_required
        cached_answer = None if ticket_suggested else services["cache"].get_cached_answer(result.mapped_topic)
        cached = cached_answer is not None
        weak_retrieval_message = (
            "The knowledge base does not contain sufficient information to answer this question. "
            "Would you like to raise a support ticket for admin review?"
        )
        answer = (
            weak_retrieval_message
            if ticket_suggested
            else cached_answer or services["gemini"].generate_answer(payload.query, result.context)
        )

        if ticket_suggested:
            return ChatQueryResponse(
                answer=answer,
                mapped_topic=result.mapped_topic,
                confidence=confidence,
                ticket_required=True,
                ticket_suggested=True,
                ticket_id=None,
                cached=False,
                sources=result.sources,
                session_id=payload.session_id,
            )

        if not cached:
            services["cache"].store_answer(result.mapped_topic, payload.query, answer)

        services["analytics"].record(
            payload.query,
            result.mapped_topic,
            result.quality.combined_confidence,
            answer,
            payload.session_id,
        )
        services["alias_learning"].observe(result.processed.normalized, result.mapped_topic)

        return ChatQueryResponse(
            answer=answer,
            mapped_topic=result.mapped_topic,
            confidence=confidence,
            ticket_required=ticket_suggested,
            ticket_suggested=ticket_suggested,
            ticket_id=None,
            cached=cached,
            sources=result.sources,
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


@router.post("/admin/login", response_model=AdminLoginResponse, summary="Validate admin credentials")
def admin_login(payload: AdminLoginRequest, services: Annotated[dict, Depends(get_services)]) -> AdminLoginResponse:
    credential = payload.username.strip()
    admin = services["db"].admins.find_one(
        {"$or": [{"email": credential}, {"username": credential}]},
        {"password": 1, "password_hash": 1, "name": 1, "email": 1, "username": 1},
    )
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")
    stored_password = admin.get("password") or admin.get("password_hash")
    if stored_password != payload.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")
    return AdminLoginResponse(
        authenticated=True,
        admin_id=str(admin.get("_id")),
        name=admin.get("name") or admin.get("username") or admin.get("email"),
        email=admin.get("email"),
    )


@router.get("/tickets", response_model=list[TicketItem], summary="List admin ticket queue")
def list_tickets(
    services: Annotated[dict, Depends(get_services)],
    limit: int = Query(default=50, ge=1, le=200),
    ticket_status: str | None = Query(default=None, alias="status"),
) -> list[TicketItem]:
    return [
        TicketItem(
            ticket_id=services["tickets"].stringify_id(item),
            question=item["question"],
            email=item.get("email"),
            status="pending" if item.get("status") == "open" else item.get("status", "pending"),
            created_at=item["created_at"],
            resolved_at=item.get("resolved_at"),
            session_id=item.get("session_id"),
        )
        for item in services["tickets"].list_tickets(limit, ticket_status)
    ]


@router.post(
    "/tickets/{ticket_id}/resolve",
    response_model=AdminResolveTicketResponse,
    summary="Resolve a ticket, notify user, and store the answer for retrieval",
)
def resolve_ticket(
    ticket_id: str,
    payload: AdminResolveTicketRequest,
    services: Annotated[dict, Depends(get_services)],
) -> AdminResolveTicketResponse:
    ticket = services["tickets"].get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    if ticket.get("status") not in {"pending", "open"}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending tickets can be resolved")

    canonical_ticket_id = services["tickets"].stringify_id(ticket)
    resolution = services["admin_resolutions"].store_resolution(
        canonical_ticket_id,
        ticket["question"],
        payload.answer,
        payload.topic,
        payload.resolved_by,
    )
    email_sent = services["email"].send_resolution(
        ticket.get("email"),
        ticket["question"],
        payload.answer,
        canonical_ticket_id,
    )
    updated = services["tickets"].mark_resolved(canonical_ticket_id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    return AdminResolveTicketResponse(
        ticket_id=canonical_ticket_id,
        status=updated["status"],
        email_sent=email_sent,
        stored_in_admin_resolutions=bool(resolution),
        resolved_at=updated["resolved_at"],
    )


@router.post("/upload", response_model=UploadResponse, summary="Upload PDF into MongoDB knowledge_chunks")
async def upload_pdf(
    services: Annotated[dict, Depends(get_services)],
    file: UploadFile = File(...),
    topic: str | None = None,
) -> UploadResponse:
    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF uploads are supported")
    pdf_bytes = await file.read()
    source_document = file.filename or "uploaded.pdf"
    try:
        chunks_stored = services["ingestion"].ingest_pdf_bytes(pdf_bytes, source_document, topic)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PDF could not be processed") from exc
    return UploadResponse(
        message="PDF uploaded and stored in MongoDB",
        source_document=source_document,
        chunks_stored=chunks_stored,
    )


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
    db_status = _database_status(services)
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


@router.get("/admin/overview", response_model=AdminOverviewResponse, summary="Get live MongoDB-backed admin overview")
def admin_overview(services: Annotated[dict, Depends(get_services)]) -> AdminOverviewResponse:
    health_response = health(services)
    db = services["db"]
    collections = {name: db[name].estimated_document_count() for name in COLLECTION_NAMES}
    total_tickets = services["tickets"].collection.count_documents({})
    pending_tickets = services["tickets"].collection.count_documents({"status": {"$in": ["pending", "open"]}})
    resolved_tickets = services["tickets"].collection.count_documents({"status": "resolved"})
    knowledge_base_count = collections.get("knowledge_chunks", 0) + collections.get("admin_resolutions", 0)
    analytics_count = collections.get("query_analytics", 0)
    recent_queries = [
        AnalyticsItem(
            query=item["query"],
            mapped_topic=item.get("mapped_topic"),
            similarity_score=float(item.get("similarity_score", 0.0)),
            frequency=int(item.get("frequency", 1)),
            timestamp=item["timestamp"],
        )
        for item in services["analytics"].top_queries(5)
    ]
    recent_tickets = [
        TicketItem(
            ticket_id=services["tickets"].stringify_id(item),
            question=item["question"],
            email=item.get("email"),
            status="pending" if item.get("status") == "open" else item.get("status", "pending"),
            created_at=item["created_at"],
            resolved_at=item.get("resolved_at"),
            session_id=item.get("session_id"),
        )
        for item in services["tickets"].list_tickets(5)
    ]
    return AdminOverviewResponse(
        health=health_response,
        collections=collections,
        total_tickets=total_tickets,
        pending_tickets=pending_tickets,
        resolved_tickets=resolved_tickets,
        knowledge_base_count=knowledge_base_count,
        analytics_count=analytics_count,
        recent_queries=recent_queries,
        recent_tickets=recent_tickets,
    )


def _database_status(services: dict) -> str:
    try:
        services["db"].command("ping")
        return "ok"
    except Exception:
        logger.exception("MongoDB health check failed")
        return "unavailable"
