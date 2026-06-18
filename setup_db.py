from config.database import db

collections = [
    "knowledge_chunks",
    "admin_resolutions",
    "tickets",
    "admins",
    "response_cache",
    "query_analytics",
    "topic_aliases",
    "system_logs"
]

for collection in collections:
    if collection not in db.list_collection_names():
        db.create_collection(collection)
        print(f"Created {collection}")

print("Setup Complete")