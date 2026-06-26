import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.database.mongo_client import get_database

from app.routes.chatbot_routes import router as chatbot_router
from app.routes.auth_routes import router as auth_router

from app.services.auth_service import AuthService
from app.services.embedding_service import EmbeddingService
from app.services.local_ingestion_service import LocalIngestionService

settings = get_settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="NTPC AI Chatbot Backend",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(chatbot_router)
app.include_router(auth_router)


@app.on_event("startup")
def startup():

    logger.info("Starting NTPC AI Chatbot Backend...")

    # Create default admin if no admin exists
    try:
        AuthService().create_default_admin()

    except Exception:
        logger.exception("Failed to initialize default admin")

    # Existing PDF auto ingestion
    if not settings.auto_ingest_local_pdfs:
        logger.info("Local PDF auto-ingestion disabled")
        return

    try:

        db = get_database(settings)

        embedding = EmbeddingService(
            settings.embedding_model_name
        )

        results = LocalIngestionService(
            db,
            settings,
            embedding
        ).ingest_bundled_pdfs()

        if results:
            logger.info("Local PDF ingestion results: %s", results)

    except Exception:
        logger.exception("Local PDF auto-ingestion failed")


@app.get("/", tags=["Root"])
def read_root():

    return {
        "message": "NTPC AI Chatbot Backend Running",
        "docs": "/docs"
    }