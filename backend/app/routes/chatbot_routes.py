from app.auth.jwt_handler import get_current_admin
import logging
from time import perf_counter
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pymongo.errors import PyMongoError
from google.genai.errors import APIError

from app.config.settings import Settings, get_settings
from app.database.mongo_client import get_database
from app.models.request_models import AdminLoginRequest, AdminSignupRequest, AdminResolveTicketRequest, ChatQueryRequest, TicketCreateRequest
from app.models.response_models import (
    AdminLoginResponse,
    AdminResolveTicketResponse,
    AdminOverviewResponse,
    ConfidenceResult,
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
    total_start = perf_counter()
    timings: dict[str, float] = {}
    try:
        retrieval = services["retrieval"]
        settings = services["settings"]

        stage_start = perf_counter()
        processed = retrieval.nlp_service.preprocess(payload.query)
        timings["preprocess_ms"] = _elapsed_ms(stage_start)
        logger.info(
            "rag_query_start query=%r normalized=%r tokens=%s aliases=%s phrases=%s",
            payload.query,
            processed.normalized,
            processed.search_tokens,
            processed.aliases,
            processed.phrases[:5],
        )

        embed_text = retrieval._embedding_text(processed)
        stage_start = perf_counter()
        query_embedding = retrieval.embedding_service.embed_query(embed_text)
        timings["embedding_ms"] = _elapsed_ms(stage_start)
        logger.info(
            "rag_embedding_ready query=%r embed_text=%r embedding_dims=%d",
            payload.query,
            embed_text[:240],
            len(query_embedding),
        )

        stage_start = perf_counter()
        cached_entry = services["cache"].get_equivalent_cached_response(
            query=payload.query,
            query_embedding=query_embedding,
            similarity_floor=settings.cache_similarity_floor,
        )
        timings["cache_lookup_ms"] = _elapsed_ms(stage_start)
        logger.info(
            "rag_cache_lookup query=%r hit=%s lookup_ms=%.2f",
            payload.query,
            cached_entry is not None,
            timings["cache_lookup_ms"],
        )

        if cached_entry is not None:
            answer = cached_entry.get("answer") or ""
            mapped_topic = cached_entry.get("topic")
            confidence = _cached_confidence(cached_entry, settings)
            logger.info(
                "rag_cache_hit query=%r topic=%r confidence_label=%s confidence_score=%.3f",
                payload.query,
                mapped_topic,
                confidence.label,
                confidence.score,
            )
            services["analytics"].record(
                payload.query,
                mapped_topic,
                confidence.score,
                answer,
                payload.session_id,
            )
            services["alias_learning"].observe(processed.normalized, mapped_topic)
            timings.update(
                {
                    "mongo_retrieval_ms": 0.0,
                    "rerank_confidence_ms": 0.0,
                    "gemini_ms": 0.0,
                    "total_ms": _elapsed_ms(total_start),
                }
            )
            _log_query_timing(payload.query, True, timings)
            fallback_msg = "The knowledge base does not contain enough information to answer this question."
            is_fallback = fallback_msg in answer or answer.strip().startswith(fallback_msg)
            return ChatQueryResponse(
                answer=answer,
                mapped_topic=mapped_topic,
                confidence=confidence,
                ticket_required=is_fallback,
                ticket_suggested=is_fallback,
                ticket_id=None,
                cached=True,
                sources=[],
                session_id=payload.session_id,
            )

        result = retrieval.retrieve(
            payload.query,
            processed=processed,
            embed_text=embed_text,
            embedding=query_embedding,
        )
        logger.info(
            "rag_retrieval_result query=%r topic=%r sources=%d context=%d vector=%.3f keyword=%.3f combined=%.3f answerable=%s weak=%s",
            payload.query,
            result.mapped_topic,
            len(result.sources),
            len(result.context),
            result.quality.vector_score,
            result.quality.keyword_score,
            result.quality.combined_score,
            result.quality.answerable,
            result.quality.weak_retrieval,
        )
        if _should_rewrite_query(result.quality):
            logger.info("rag_query_rewrite_started query=%r", payload.query)
            stage_start = perf_counter()
            try:
                rewrites = services["gemini"].rewrite_search_queries(payload.query)
                timings["query_rewrite_ms"] = _elapsed_ms(stage_start)
                if rewrites:
                    rewritten_query = " ".join([payload.query, *rewrites])
                    rewritten_processed = retrieval.nlp_service.preprocess(rewritten_query)
                    rewritten_embed_text = retrieval._embedding_text(rewritten_processed)
                    rewritten_embedding = retrieval.embedding_service.embed_query(rewritten_embed_text)
                    rewritten_result = retrieval.retrieve(
                        payload.query,
                        processed=rewritten_processed,
                        embed_text=rewritten_embed_text,
                        embedding=rewritten_embedding,
                    )
                    if rewritten_result.quality.combined_score > result.quality.combined_score:
                        logger.info(
                            "rag_query_rewrite_used query=%r old_combined=%.3f new_combined=%.3f old_context=%d new_context=%d",
                            payload.query,
                            result.quality.combined_score,
                            rewritten_result.quality.combined_score,
                            len(result.context),
                            len(rewritten_result.context),
                        )
                        result = rewritten_result
                    else:
                        logger.info(
                            "rag_query_rewrite_rejected query=%r old_combined=%.3f new_combined=%.3f",
                            payload.query,
                            result.quality.combined_score,
                            rewritten_result.quality.combined_score,
                        )
                else:
                    logger.info("rag_query_rewrite_rejected query=%r reason=empty_rewrites", payload.query)
            except Exception as exc:
                logger.error(
                    "Query rewriting failed due to Gemini error: %s. Proceeding with original query.",
                    str(exc),
                    exc_info=True,
                )
        else:
            logger.info("rag_query_rewrite_skipped reason=good_retrieval query=%r", payload.query)
        retrieval_timings = result.timings_ms or {}
        timings["mongo_retrieval_ms"] = retrieval_timings.get("mongo_retrieval_ms", 0.0)
        timings["rerank_confidence_ms"] = retrieval_timings.get("rerank_ms", 0.0)

        # Evaluate confidence of retrieved results using settings (high >= 0.90, medium >= 0.75).
        # If confidence is low (< 0.75), ticket_required is True.
        stage_start = perf_counter()
        confidence = services["confidence"].evaluate(result.quality)
        timings["rerank_confidence_ms"] = round(
            timings["rerank_confidence_ms"] + _elapsed_ms(stage_start),
            2,
        )
        ticket_suggested = confidence.ticket_required
        logger.info(
            "rag_confidence query=%r label=%s score=%.3f ticket_required=%s vector=%.3f keyword=%.3f context_keyword=%.3f",
            payload.query,
            confidence.label,
            confidence.score,
            confidence.ticket_required,
            result.quality.vector_score,
            result.quality.keyword_score,
            result.quality.context_keyword_score,
        )

        # When retrieval is too weak, skip both cache and Gemini; the mapped
        # topic is unreliable and could produce a wrong cached answer.
        if ticket_suggested:
            logger.info(
                "rag_ticket_flow query=%r topic=%r reason=low_confidence sources=%d context=%d",
                payload.query,
                result.mapped_topic,
                len(result.sources),
                len(result.context),
            )
            weak_retrieval_message = (
                "The knowledge base does not contain sufficient information to answer this question. "
                "Would you like to raise a support ticket for admin review?"
            )
            timings["gemini_ms"] = 0.0
            timings["total_ms"] = _elapsed_ms(total_start)
            _log_query_timing(payload.query, False, timings)
            return ChatQueryResponse(
                answer=weak_retrieval_message,
                mapped_topic=result.mapped_topic,
                confidence=confidence,
                ticket_required=True,
                ticket_suggested=True,
                ticket_id=None,
                cached=False,
                sources=result.sources,
                session_id=payload.session_id,
            )

        stage_start = perf_counter()
        logger.info(
            "rag_gemini_answer_start query=%r topic=%r context=%d",
            payload.query,
            result.mapped_topic,
            len(result.context),
        )
        
        gemini_failed = False
        gemini_failure_reason = None
        gemini_status_code = None
        gemini_retry_after = None

        try:
            answer = services["gemini"].generate_answer(payload.query, result.context)
            timings["gemini_ms"] = _elapsed_ms(stage_start)
            logger.info(
                "rag_gemini_answer_done query=%r topic=%r answer_chars=%d gemini_ms=%.2f",
                payload.query,
                result.mapped_topic,
                len(answer),
                timings["gemini_ms"],
            )
            services["cache"].store_answer(
                topic=result.mapped_topic,
                query=payload.query,
                answer=answer,
                query_embedding=query_embedding,
                retrieval_score=result.quality.combined_confidence,
            )
        except APIError as exc:
            gemini_failed = True
            gemini_failure_reason = exc.message or str(exc)
            gemini_status_code = getattr(exc, "code", None)
            
            # Check for retry-after in headers or message
            if hasattr(exc, "response") and exc.response is not None:
                headers = getattr(exc.response, "headers", {})
                gemini_retry_after = headers.get("retry-after") or headers.get("Retry-After")
            
            logger.error(
                "Gemini API failure: gemini_failure_reason=%r status_code=%s retry_after=%s",
                gemini_failure_reason,
                gemini_status_code,
                gemini_retry_after,
            )
        except Exception as exc:
            gemini_failed = True
            gemini_failure_reason = str(exc)
            gemini_status_code = getattr(exc, "status_code", 500)
            
            logger.error(
                "Unexpected Gemini exception: gemini_failure_reason=%r status_code=%s",
                gemini_failure_reason,
                gemini_status_code,
                exc_info=True,
            )

        if gemini_failed:
            answer = "Relevant information was found, but AI answer generation is temporarily unavailable. Please try again shortly."
            answer_generated = False
        else:
            answer_generated = True

        services["analytics"].record(
            payload.query,
            result.mapped_topic,
            result.quality.combined_confidence,
            answer,
            payload.session_id,
        )
        services["alias_learning"].observe(result.processed.normalized, result.mapped_topic)

        timings["total_ms"] = _elapsed_ms(total_start)
        _log_query_timing(payload.query, False, timings)
        fallback_msg = "The knowledge base does not contain enough information to answer this question."
        is_fallback = fallback_msg in answer or answer.strip().startswith(fallback_msg)
        return ChatQueryResponse(
            answer=answer,
            mapped_topic=result.mapped_topic,
            confidence=confidence,
            ticket_required=ticket_suggested or is_fallback,
            ticket_suggested=ticket_suggested or is_fallback,
            ticket_id=None,
            cached=False,
            sources=result.sources,
            session_id=payload.session_id,
            answer_generated=answer_generated,
        )
    except PyMongoError as exc:
        timings["total_ms"] = _elapsed_ms(total_start)
        _log_query_timing(payload.query, False, timings)
        logger.exception("Database error while processing query")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable") from exc
    except Exception as exc:
        timings["total_ms"] = _elapsed_ms(total_start)
        _log_query_timing(payload.query, False, timings)
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
        {
            "password": 1,
            "password_hash": 1,
            "name": 1,
            "email": 1,
            "username": 1,
            "department": 1,
            "employee_id": 1,
            "role": 1,
        },
    )
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")
    
    stored_password = admin.get("password") or admin.get("password_hash")
    is_verified = False
    if stored_password:
        if stored_password.startswith("$2b$") or stored_password.startswith("$2a$") or len(stored_password) > 50:
            from app.services.auth_service import AuthService
            auth_service = AuthService()
            try:
                is_verified = auth_service.verify_password(payload.password, stored_password)
            except Exception:
                is_verified = (stored_password == payload.password)
        else:
            is_verified = (stored_password == payload.password)
            
    if not is_verified:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")
        
    return AdminLoginResponse(
        authenticated=True,
        admin_id=str(admin.get("_id")),
        name=admin.get("name") or admin.get("username") or admin.get("email"),
        email=admin.get("email"),
        username=admin.get("username"),
        role=admin.get("role") or "admin",
        department=admin.get("department"),
        employee_id=admin.get("employee_id"),
    )


@router.post("/admin/signup", summary="Register a new admin")
def admin_signup(payload: AdminSignupRequest, services: Annotated[dict, Depends(get_services)]):
    from app.services.auth_service import AuthService
    auth_service = AuthService()
    db = services["db"]
    email = payload.email.strip().lower()
    
    if db.admins.find_one({"$or": [{"email": email}, {"username": email}]}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin email already registered")
        
    hashed_password = auth_service.hash_password(payload.password)
    new_admin = {
        "name": payload.name.strip(),
        "department": payload.department.strip(),
        "employee_id": payload.employee_id.strip(),
        "email": email,
        "username": email,
        "password": hashed_password,
        "role": "admin",
        "active": True
    }
    db.admins.insert_one(new_admin)
    return {"message": "Admin signed up successfully"}


@router.get("/tickets", response_model=list[TicketItem], summary="List admin ticket queue")
def list_tickets(
    services: Annotated[dict, Depends(get_services)],
    limit: int = Query(default=50, ge=1, le=200),
    ticket_status: str | None = Query(default=None, alias="status"),
) -> list[TicketItem]:
    tickets = services["tickets"].list_tickets(limit, ticket_status)
    items = []
    for item in tickets:
        ticket_id = services["tickets"].stringify_id(item)
        answer = None
        resolved_by = None
        status_val = item.get("status", "pending")
        if status_val == "open":
            status_val = "pending"
            
        if status_val == "resolved":
            resolution = services["db"].admin_resolutions.find_one({"ticket_id": ticket_id})
            if resolution:
                answer = resolution.get("answer")
                resolved_by = resolution.get("resolved_by")
                
        items.append(
            TicketItem(
                ticket_id=ticket_id,
                question=item["question"],
                email=item.get("email"),
                status=status_val,
                created_at=item["created_at"],
                resolved_at=item.get("resolved_at"),
                session_id=item.get("session_id"),
                answer=answer,
                resolved_by=resolved_by,
            )
        )
    return items


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
    updated = services["tickets"].mark_resolved(canonical_ticket_id, email_sent=email_sent)
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
    recent_tickets_raw = services["tickets"].list_tickets(5)
    recent_tickets = []
    for item in recent_tickets_raw:
        ticket_id = services["tickets"].stringify_id(item)
        answer = None
        resolved_by = None
        status_val = item.get("status", "pending")
        if status_val == "open":
            status_val = "pending"
            
        if status_val == "resolved":
            resolution = db.admin_resolutions.find_one({"ticket_id": ticket_id})
            if resolution:
                answer = resolution.get("answer")
                resolved_by = resolution.get("resolved_by")
                
        recent_tickets.append(
            TicketItem(
                ticket_id=ticket_id,
                question=item["question"],
                email=item.get("email"),
                status=status_val,
                created_at=item["created_at"],
                resolved_at=item.get("resolved_at"),
                session_id=item.get("session_id"),
                answer=answer,
                resolved_by=resolved_by,
            )
        )
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


def _elapsed_ms(start: float) -> float:
    return round((perf_counter() - start) * 1000, 2)


def _cached_confidence(entry: dict, settings: Settings) -> ConfidenceResult:
    score = float(entry.get("retrieval_score", 1.0))
    label = "high" if score >= settings.high_confidence_threshold else "medium"
    return ConfidenceResult(label=label, score=score, ticket_required=False)


def _should_rewrite_query(quality) -> bool:
    return (
        quality.weak_retrieval
        and (
            not quality.answerable
            or quality.vector_score < 0.60
            or quality.combined_score < 0.60
        )
    )


def _log_query_timing(query: str, cached: bool, timings: dict[str, float]) -> None:
    logger.info(
        "chat_query_timing cached=%s query_len=%d cache=%.2fms preprocess=%.2fms "
        "embedding=%.2fms mongo_retrieval=%.2fms rerank_confidence=%.2fms "
        "gemini=%.2fms total=%.2fms",
        cached,
        len(query),
        timings.get("cache_lookup_ms", 0.0),
        timings.get("preprocess_ms", 0.0),
        timings.get("embedding_ms", 0.0),
        timings.get("mongo_retrieval_ms", 0.0),
        timings.get("rerank_confidence_ms", 0.0),
        timings.get("gemini_ms", 0.0),
        timings.get("total_ms", 0.0),
    )
