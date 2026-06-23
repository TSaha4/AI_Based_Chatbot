# Module 4: AI Knowledge Assistant Chatbot Backend

This backend implements only Module 4 of the RAG chatbot:

- Query processing and NLP preprocessing
- Sentence Transformer query embeddings
- MongoDB Atlas Vector Search retrieval from `knowledge_chunks` and `admin_resolutions`
- Similarity ranking and confidence evaluation
- Gemini 2.5 Flash grounded answer generation
- Response cache, analytics, alias learning, tickets, session history, and health APIs

It does not implement React UI, admin authentication/dashboard, email sending, PDF upload, chunking, embedding ingestion, or vector storage pipelines.

## Folder Structure

```text
backend/
├── main.py
├── app/
│   ├── main.py
│   ├── routes/chatbot_routes.py
│   ├── services/
│   ├── database/mongo_client.py
│   ├── models/
│   └── config/settings.py
└── requirements.txt
```

## Environment Variables

Create `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
MONGODB_DATABASE=ai_chatbot
VECTOR_INDEX_NAME=vector_index
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-2.5-flash
```

Optional settings:

```env
TOP_K=5
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
```

## MongoDB Collections

Read-only collections expected from other modules:

- `knowledge_chunks`
- `admin_resolutions`

Read/write collections used by this module:

- `response_cache`
- `query_analytics`
- `topic_aliases`
- `tickets`

Vector search expects an Atlas Vector Search index on the `embedding` field in both read-only collections.

## Run Locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Open Swagger docs at:

```text
http://localhost:8000/docs
```

## APIs

### `POST /api/chat/query`

Runs the full RAG flow. Low confidence automatically creates a ticket.

```json
{
  "query": "ghar jana hai",
  "email": "student@example.com",
  "session_id": "session-123"
}
```

### `POST /api/chat/ticket`

Creates a manual ticket. Email sending is intentionally excluded for Module 2.

### `GET /api/chat/history`

Returns query history. Supports `session_id` and `limit`.

### `GET /api/chat/analytics`

Returns most frequent/recent queries. Supports `limit`.

### `GET /api/chat/health`

Checks MongoDB connectivity and service configuration.

## Integration Notes

- Frontend should call only the `/api/chat/*` endpoints.
- Admin module can read/update `tickets` and use `query_analytics`.
- Ingestion module must store embeddings using the same model: `sentence-transformers/all-MiniLM-L6-v2`.
- Gemini prompts are grounded to retrieved context only; unavailable answers are explicitly refused.
