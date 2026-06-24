from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database.mongo_client import get_database

db = get_database()

collections = [
    "knowledge_chunks",
    "admin_resolutions",
    "tickets",
    "admins",
    "response_cache",
    "query_analytics",
    "topic_aliases",
    "system_logs",
]

for collection in collections:
    if collection not in db.list_collection_names():
        db.create_collection(collection)
        print(f"Created {collection}")

print("Setup Complete")
