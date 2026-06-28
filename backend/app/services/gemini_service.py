import logging
from functools import lru_cache
from typing import List

from google import genai
from google.genai import types

from app.config.settings import Settings

logger = logging.getLogger(__name__)

_GROUNDING_INSTRUCTIONS = (
    "You are an NTPC knowledge assistant. Answer ONLY using the provided context.\n"
    "Rules:\n"
    "- Do not use outside knowledge.\n"
    "- Do not infer, guess, or fabricate policies, amounts, dates, procedures, or rules.\n"
    "- If the context does not explicitly contain the answer, respond exactly with:\n"
    "  The knowledge base does not contain enough information to answer this question.\n"
    "- Quote or paraphrase only facts present in the context.\n"
    "- Keep the answer concise and factual."
)


@lru_cache
def _get_client(api_key: str) -> genai.Client:
    return genai.Client(api_key=api_key)


class GeminiService:
    """Generates grounded answers from retrieved context only."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = _get_client(settings.gemini_api_key) if settings.gemini_api_key else None

    def generate_answer(self, query: str, context: List[str]) -> str:
        if not context:
            return (
                "The knowledge base does not contain enough information to answer this question."
            )
        if not self.client:
            logger.warning("GEMINI_API_KEY is not configured")
            return "Gemini is not configured. Please set GEMINI_API_KEY to generate an answer."

        context_text = "\n\n".join(f"Context {index + 1}: {item}" for index, item in enumerate(context))
        prompt = f"{_GROUNDING_INSTRUCTIONS}\n\n{context_text}\n\nUser question: {query}"
        response = self.client.models.generate_content(
            model=self.settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=self.settings.gemini_temperature,
                max_output_tokens=512,
            ),
        )
        return (response.text or "").strip() or (
            "The knowledge base does not contain enough information to answer this question."
        )

    def rewrite_search_queries(self, query: str) -> List[str]:
        if not self.client:
            return []

        prompt = (
            "Rewrite the user question for strict RAG retrieval only.\n"
            "Return 3 to 5 short search queries or keyword phrases, one per line.\n"
            "Do not answer the question. Do not add facts.\n\n"
            f"User question: {query}"
        )
        response = self.client.models.generate_content(
            model=self.settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=96,
            ),
        )
        lines = []
        for line in (response.text or "").splitlines():
            cleaned = line.strip(" -•\t0123456789.")
            if cleaned:
                lines.append(cleaned[:120])
        return lines[:5]
