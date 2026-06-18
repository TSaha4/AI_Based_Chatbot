from config.database import db

db.admins.create_index("email", unique=True)
db.tickets.create_index("ticket_id", unique=True)
db.response_cache.create_index("query_hash", unique=True)

print("Indexes created")