import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "backend"))

from app.config.settings import get_settings
from app.database.mongo_client import get_database
from app.services.confidence_service import ConfidenceService
from app.services.embedding_service import EmbeddingService
from app.services.nlp_service import NLPPreprocessingService
from app.services.retrieval_service import RetrievalService

s = get_settings()
db = get_database(s)
emb = EmbeddingService(s.embedding_model_name)
nlp = NLPPreprocessingService(db)
rs = RetrievalService(db, s, nlp, emb)
confidence = ConfidenceService(s)

queries = [
    "how much is the stipend?",
    "what is the attendance policy?",
    "how does flue gas desulfurization remove sulfur dioxide?",
    "what is disciplinary proceeding?",
    "what is apprentice trainee definition?",
]

for query in queries:
    print("\n" + "=" * 72)
    print("QUERY:", query)
    result = rs.retrieve(query)
    processed = result.processed
    quality = result.quality
    conf = confidence.evaluate(quality)

    print("normalized:", processed.normalized)
    print("embed_text:", rs._embedding_text(processed))
    print("search_tokens:", processed.search_tokens)
    print("phrases:", processed.phrases[:6])
    print(
        "quality: vector=%.4f keyword=%.4f combined=%.4f answerable=%s weak=%s confidence=%s"
        % (
            quality.vector_score,
            quality.keyword_score,
            quality.combined_score,
            quality.answerable,
            quality.weak_retrieval,
            conf.label,
        )
    )
    print("mapped_topic:", result.mapped_topic)
    print("source_count:", len(result.sources))
    for idx, src in enumerate(result.sources, 1):
        preview = src.preview[:500].encode("ascii", errors="replace").decode("ascii")
        print(
            f"[{idx}] {src.collection} final={src.score:.4f} vector={src.vector_score:.4f} "
            f"keyword={src.keyword_score:.4f} topic={src.topic}"
        )
        print(preview)
        print("---")

print("\nINDEXES")
for name in ("knowledge_chunks", "admin_resolutions"):
    print(name, list(db[name].list_search_indexes()))

print("\nEMBEDDING DIMENSIONS")
for name in ("knowledge_chunks", "admin_resolutions"):
    doc = db[name].find_one({})
    if doc and "embedding" in doc:
        print(name, len(doc["embedding"]))
