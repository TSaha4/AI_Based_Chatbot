import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.routes.chatbot_routes import router as chatbot_router

settings = get_settings()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Module 4: Query processing, RAG retrieval, Gemini answers, cache, analytics, aliases, tickets, and history APIs.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot_router)


@app.get("/", tags=["Root"])
def read_root() -> dict:
    return {"message": "Module 4 chatbot backend is ready", "docs": "/docs"}
