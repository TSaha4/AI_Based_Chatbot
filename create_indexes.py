from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database.mongo_client import get_database

db = get_database()

db.admins.create_index("email", unique=True)
db.tickets.create_index("ticket_id", unique=True)
db.response_cache.create_index("topic", unique=True)
db.query_analytics.create_index([("query", 1), ("mapped_topic", 1), ("session_id", 1)])
db.topic_aliases.create_index([("topic", 1), ("alias", 1)], unique=True)
db.knowledge_chunks.create_index("chunk_id", unique=True)
db.knowledge_chunks.create_index("source_document")
db.admin_resolutions.create_index("ticket_id", unique=True)

print("Indexes created")
