import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)


class PDFExtractionService:
    """Extracts and cleans text from PDF bytes or local files."""

    @staticmethod
    def extract_text_from_bytes(pdf_bytes: bytes) -> str:
        try:
            import fitz
        except ImportError as exc:
            raise RuntimeError("PyMuPDF is not installed") from exc

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            pages = [page.get_text("text") for page in doc]
        finally:
            doc.close()
        return PDFExtractionService.clean_text("\n".join(pages))

    @staticmethod
    def extract_text_from_path(pdf_path: Path) -> str:
        pdf_bytes = pdf_path.read_bytes()
        return PDFExtractionService.extract_text_from_bytes(pdf_bytes)

    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""

        text = text.replace("\x00", "")
        text = re.sub(r"-\s*\n\s*", "", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"[^\S\n]+", " ", text)
        text = re.sub(r" *\n *", "\n", text)
        text = re.sub(r"\n+", " ", text)
        text = re.sub(r"\s+", " ", text)
        return text.strip()
