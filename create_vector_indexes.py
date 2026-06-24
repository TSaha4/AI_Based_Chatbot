"""Create Atlas Vector Search indexes for knowledge_chunks and admin_resolutions."""

from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.config.settings import get_settings

settings = get_settings()
VECTOR_DEFINITION = {
    "fields": [
        {
            "type": "vector",
            "path": "embedding",
            "numDimensions": 384,
            "similarity": "cosine",
        }
    ]
}
COLLECTIONS = ("knowledge_chunks", "admin_resolutions")


def main() -> None:
    from pymongo import MongoClient
    from pymongo.operations import SearchIndexModel

    client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=10000)
    db = client[settings.mongodb_database]

    for collection_name in COLLECTIONS:
        collection = db[collection_name]
        existing = {
            index.get("name")
            for index in collection.list_search_indexes()
        }
        if settings.vector_index_name in existing:
            print(f"Vector index '{settings.vector_index_name}' already exists on {collection_name}")
            continue

        model = SearchIndexModel(definition=VECTOR_DEFINITION, name=settings.vector_index_name, type="vectorSearch")
        collection.create_search_index(model)
        print(f"Created vector index '{settings.vector_index_name}' on {collection_name}")

    print("Vector index setup complete")


if __name__ == "__main__":
    main()
