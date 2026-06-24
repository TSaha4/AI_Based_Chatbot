import logging
from pathlib import Path

from pymongo.database import Database

from app.config.settings import Settings
from app.services.embedding_service import EmbeddingService
from app.services.knowledge_ingestion_service import KnowledgeIngestionService
from app.services.pdf_extraction_service import PDFExtractionService

logger = logging.getLogger(__name__)


class LocalIngestionService:
    """Ingests bundled local PDFs through the same pipeline as admin uploads."""

    def __init__(self, db: Database, settings: Settings, embedding_service: EmbeddingService):
        self.settings = settings
        self.ingestion = KnowledgeIngestionService(db, embedding_service)
        self.pdf_dir = settings.resolved_local_pdf_dir

    def ingest_bundled_pdfs(self) -> dict[str, int]:
        if not self.pdf_dir.exists():
            logger.warning("Local PDF directory not found: %s", self.pdf_dir)
            return {}

        results: dict[str, int] = {}
        for pdf_path in sorted(self.pdf_dir.glob("*.pdf")):
            source_document = pdf_path.name
            if self.ingestion.is_source_ingested(source_document):
                logger.info("Skipping already ingested local PDF: %s", source_document)
                results[source_document] = 0
                continue

            try:
                text = PDFExtractionService.extract_text_from_path(pdf_path)
                topic = pdf_path.stem.replace("_", " ")
                chunks_stored = self.ingestion.store_pdf_text(text, source_document, topic)
                results[source_document] = chunks_stored
                logger.info("Ingested local PDF %s (%s chunks)", source_document, chunks_stored)
            except Exception:
                logger.exception("Failed to ingest local PDF: %s", source_document)
                results[source_document] = -1

        return results
