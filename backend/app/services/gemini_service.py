import logging
from typing import List

from google import genai
from google.genai import types

from app.config.settings import Settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Generates grounded answers from retrieved context only."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None

    def generate_answer(self, query: str, context: List[str]) -> str:
        if not context:
            return "I do not have enough information in the knowledge base to answer this question."
        if not self.client:
            logger.warning("GEMINI_API_KEY is not configured")
            return "Gemini is not configured. Please set GEMINI_API_KEY to generate an answer."

        context_text = "\n\n".join(f"Context {index + 1}: {item}" for index, item in enumerate(context))
        prompt = (
            "You are a knowledge assistant. Answer using only the provided context. "
            "Do not hallucinate. If the answer is unavailable in the context, say that the "
            "knowledge base does not contain enough information.\n\n"
            f"{context_text}\n\nUser question: {query}"
        )
        response = self.client.models.generate_content(
            model=self.settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=self.settings.gemini_temperature),
        )
        return (response.text or "").strip() or "I could not generate an answer from the available context."
