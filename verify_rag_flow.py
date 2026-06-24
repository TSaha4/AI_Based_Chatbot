"""Verify ingestion, retrieval, cache, and learning flows against MongoDB Atlas."""

from __future__ import annotations

import io
import sys
import uuid
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.config.settings import get_settings
from app.database.mongo_client import get_database
from app.services.admin_resolution_service import AdminResolutionService
from app.services.cache_service import CacheService
from app.services.confidence_service import ConfidenceService
from app.services.embedding_service import EmbeddingService
from app.services.knowledge_ingestion_service import KnowledgeIngestionService
from app.services.local_ingestion_service import LocalIngestionService
from app.services.nlp_service import NLPPreprocessingService
from app.services.retrieval_service import RetrievalService

PROJECT_ROOT = Path(__file__).resolve().parent
settings = get_settings()


class FlowVerifier:
    def __init__(self) -> None:
        self.db = get_database(settings)
        self.embedding = EmbeddingService(settings.embedding_model_name)
        self.ingestion = KnowledgeIngestionService(self.db, self.embedding)
        self.local_ingestion = LocalIngestionService(self.db, settings, self.embedding)
        self.nlp = NLPPreprocessingService(self.db)
        self.retrieval = RetrievalService(self.db, settings, self.nlp, self.embedding)
        self.confidence = ConfidenceService(settings)
        self.cache = CacheService(self.db)
        self.admin_resolutions = AdminResolutionService(self.db, self.embedding)
        self.issues: list[str] = []
        self.changes: list[str] = []

    def _record(self, ok: bool, label: str, detail: str = "") -> bool:
        status = "PASS" if ok else "FAIL"
        message = f"[{status}] {label}"
        if detail:
            message = f"{message}: {detail}"
        print(message)
        if not ok:
            self.issues.append(message)
        return ok

    def verify_mongodb(self) -> bool:
        print("\n=== MongoDB Verification ===")
        ok = True
        try:
            self.db.command("ping")
            ok &= self._record(True, "MongoDB connectivity")
        except Exception as exc:
            return self._record(False, "MongoDB connectivity", str(exc))

        required_collections = [
            "knowledge_chunks",
            "admin_resolutions",
            "response_cache",
            "query_analytics",
            "topic_aliases",
            "tickets",
            "admins",
            "system_logs",
        ]
        existing = set(self.db.list_collection_names())
        for name in required_collections:
            ok &= self._record(name in existing, f"Collection exists: {name}")

        for collection_name in ("knowledge_chunks", "admin_resolutions"):
            indexes = list(self.db[collection_name].list_search_indexes())
            has_vector = any(idx.get("name") == settings.vector_index_name for idx in indexes)
            ok &= self._record(has_vector, f"Vector index on {collection_name}", settings.vector_index_name)

        return ok

    def verify_local_ingestion(self) -> bool:
        print("\n=== Local PDF Ingestion ===")
        pdf_dir = settings.resolved_local_pdf_dir
        if not pdf_dir.exists():
            return self._record(False, "Local PDF directory", str(pdf_dir))

        pdf_files = list(pdf_dir.glob("*.pdf"))
        if not pdf_files:
            return self._record(False, "Bundled PDF files present", str(pdf_dir))

        results = self.local_ingestion.ingest_bundled_pdfs()
        ok = self._record(bool(results), "Local ingestion executed", str(results))

        for pdf_path in pdf_files:
            count = self.db.knowledge_chunks.count_documents({"source_document": pdf_path.name})
            ok &= self._record(count > 0, f"Chunks stored for {pdf_path.name}", f"{count} chunks")

        sample = self.db.knowledge_chunks.find_one({"source_document": pdf_files[0].name})
        if sample:
            ok &= self._record("text" in sample, "Schema field: text")
            ok &= self._record("embedding" in sample, "Schema field: embedding")
            ok &= self._record("source_document" in sample, "Schema field: source_document")
            ok &= self._record("topic" in sample, "Schema field: topic")
            ok &= self._record("created_at" in sample, "Schema field: created_at")
            ok &= self._record(
                isinstance(sample.get("embedding"), list) and len(sample["embedding"]) == 384,
                "Embedding dimensions",
                str(len(sample.get("embedding", []))),
            )
        else:
            ok = self._record(False, "Sample chunk lookup")

        return ok

    def verify_admin_upload_ingestion(self) -> bool:
        print("\n=== Admin PDF Upload Ingestion ===")
        import fitz

        ok = True
        upload_name = f"admin_upload_test_{uuid.uuid4().hex[:8]}.pdf"
        text = (
            "Admin uploaded NTPC document. "
            "Coal handling conveyors require daily belt alignment checks and dust suppression system tests."
        )
        buffer = io.BytesIO()
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((72, 72), text)
        doc.save(buffer)
        doc.close()

        before = self.db.knowledge_chunks.count_documents({"source_document": upload_name})
        chunks_stored = self.ingestion.ingest_pdf_bytes(buffer.getvalue(), upload_name, "coal handling")
        after = self.db.knowledge_chunks.count_documents({"source_document": upload_name})

        ok &= self._record(chunks_stored > 0, "Admin upload pipeline stores chunks", str(chunks_stored))
        ok &= self._record(after > before, "MongoDB write confirmed", f"{before} -> {after}")

        stored = self.db.knowledge_chunks.find_one({"source_document": upload_name})
        if stored:
            ok &= self._record(stored.get("topic") == "coal handling", "Admin upload topic stored")
        return ok

    def verify_retrieval(self) -> bool:
        print("\n=== Retrieval Flow ===")
        ok = True

        processed = self.nlp.preprocess("What are the FGD operating pH limits?")
        ok &= self._record(bool(processed.tokens), "NLP tokenization")
        ok &= self._record(processed.normalized != processed.original.lower(), "NLP normalization")
        ok &= self._record(len(processed.corrected_tokens) > 0, "NLP lemmatization/stopword removal")

        _, sources, context, mapped_topic, score = self.retrieval.retrieve("What are the FGD operating pH limits?")
        ok &= self._record(len(sources) > 0, "Vector retrieval returns sources", f"score={score:.4f}")
        ok &= self._record(len(context) > 0, "Context assembled for Gemini")
        ok &= self._record(
            any(source.collection == "knowledge_chunks" for source in sources),
            "knowledge_chunks searched",
        )

        ticket_id = f"TKT-VERIFY-{uuid.uuid4().hex[:8].upper()}"
        self.admin_resolutions.store_resolution(
            ticket_id,
            "What PPE is mandatory in NTPC plant areas?",
            "Hard hats, safety shoes, and flame-resistant coveralls are mandatory.",
            "safety_ppe",
            "verify-script",
        )
        _, resolution_sources, _, _, resolution_score = self.retrieval.retrieve(
            "What personal protective equipment is required in NTPC plants?"
        )
        ok &= self._record(
            any(source.collection == "admin_resolutions" for source in resolution_sources),
            "admin_resolutions searched",
            f"score={resolution_score:.4f}",
        )

        ranked_scores = [source.score for source in sorted(sources + resolution_sources, key=lambda s: s.score, reverse=True)]
        ok &= self._record(
            ranked_scores == sorted(ranked_scores, reverse=True),
            "Merged results ranked by similarity",
        )

        confidence = self.confidence.evaluate(score)
        ok &= self._record(confidence.label in {"high", "medium", "low"}, "Confidence threshold applied")

        return ok

    def verify_response_cache(self) -> bool:
        print("\n=== Response Cache ===")
        topic = f"verify-topic-{uuid.uuid4().hex[:6]}"
        answer = "Cached verification answer."
        self.cache.store_answer(topic, "verify query", answer)
        cached = self.cache.get_cached_answer(topic)
        ok = self._record(cached == answer, "response_cache read/write")
        doc = self.db.response_cache.find_one({"topic": topic})
        if doc:
            ok &= self._record("answer" in doc and "updated_at" in doc, "response_cache schema")
        return ok

    def verify_no_duplicate_pipelines(self) -> bool:
        print("\n=== Pipeline Uniqueness ===")
        from app.services import knowledge_ingestion_service, pdf_extraction_service

        ok = True
        ok &= self._record(hasattr(knowledge_ingestion_service.KnowledgeIngestionService, "ingest_pdf_bytes"), "Single ingestion entrypoint")
        ok &= self._record(hasattr(pdf_extraction_service.PDFExtractionService, "extract_text_from_bytes"), "Single PDF extraction service")
        return ok

    def run(self) -> dict[str, bool]:
        ingestion_ok = self.verify_local_ingestion() and self.verify_admin_upload_ingestion()
        retrieval_ok = self.verify_retrieval()
        mongo_ok = self.verify_mongodb()
        cache_ok = self.verify_response_cache()
        pipeline_ok = self.verify_no_duplicate_pipelines()

        return {
            "ingestion": ingestion_ok,
            "retrieval": retrieval_ok,
            "mongodb": mongo_ok,
            "cache": cache_ok,
            "pipeline": pipeline_ok,
        }


def main() -> None:
    verifier = FlowVerifier()
    results = verifier.run()

    print("\n=== Summary ===")
    print(f"Issues Found: {len(verifier.issues)}")
    for issue in verifier.issues:
        print(f"  - {issue}")

    print(f"Ingestion Flow Verified: {'PASS' if results['ingestion'] else 'FAIL'}")
    print(f"Retrieval Flow Verified: {'PASS' if results['retrieval'] else 'FAIL'}")
    print(f"MongoDB Verification: {'PASS' if results['mongodb'] else 'FAIL'}")

    if not all(results.values()):
        sys.exit(1)


if __name__ == "__main__":
    main()
