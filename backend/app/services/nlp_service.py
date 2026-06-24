import re
import string
from dataclasses import dataclass
from typing import Dict, Iterable, List, Set

from rapidfuzz import process
from pymongo.database import Database


@dataclass(frozen=True)
class PreprocessedQuery:
    original: str
    normalized: str
    tokens: List[str]
    corrected_tokens: List[str]
    expanded_query: str
    aliases: Dict[str, str]
    phrases: List[str]
    search_tokens: List[str]


class NLPPreprocessingService:
    """Normalizes user queries before embedding and retrieval."""

    def __init__(self, db: Database):
        self.db = db
        # Keep intent-bearing words (how, what, when, where, why, much) for embedding and matching.
        self.stopwords: Set[str] = {
            "a", "an", "the", "is", "are", "am", "to", "of", "in", "on", "for",
            "and", "or", "with", "by", "from", "can", "could", "should", "would",
            "i", "me", "my", "we", "our", "you", "your", "please",
            "hai", "hain", "ka", "ki", "ke",
        }

    def preprocess(self, query: str) -> PreprocessedQuery:
        normalized = self.normalize(query)
        tokens = self.tokenize(normalized)
        meaningful_tokens = self.remove_stopwords(tokens)
        lemmas = [self.lemmatize(token) for token in meaningful_tokens]
        alias_map = self.load_aliases()
        corrected_tokens = self.correct_spelling(lemmas, alias_map.keys())
        expanded_query, matched_aliases = self.expand_aliases(corrected_tokens, alias_map)
        phrases = self.extract_phrases(normalized)
        search_tokens = list(dict.fromkeys(corrected_tokens))
        return PreprocessedQuery(
            original=query,
            normalized=normalized,
            tokens=meaningful_tokens,
            corrected_tokens=corrected_tokens,
            expanded_query=expanded_query,
            aliases=matched_aliases,
            phrases=phrases,
            search_tokens=search_tokens,
        )

    def normalize(self, query: str) -> str:
        query = query.lower().strip()
        query = query.translate(str.maketrans({char: " " for char in string.punctuation}))
        return re.sub(r"\s+", " ", query)

    def tokenize(self, text: str) -> List[str]:
        return re.findall(r"[a-z0-9]+", text)

    def remove_stopwords(self, tokens: Iterable[str]) -> List[str]:
        return [token for token in tokens if token not in self.stopwords and len(token) > 1]

    def lemmatize(self, token: str) -> str:
        if len(token) > 4 and token.endswith("ies"):
            return f"{token[:-3]}y"
        if len(token) > 4 and token.endswith("ing"):
            return token[:-3]
        if len(token) > 3 and token.endswith("ed"):
            return token[:-2]
        if len(token) > 3 and token.endswith("s"):
            return token[:-1]
        return token

    def load_aliases(self) -> Dict[str, str]:
        aliases: Dict[str, str] = {}
        for item in self.db.topic_aliases.find({}, {"alias": 1, "topic": 1, "aliases": 1}):
            topic = item.get("topic")
            if not topic:
                continue
            if item.get("alias"):
                aliases[str(item["alias"]).lower()] = topic
            for alias in item.get("aliases", []):
                aliases[str(alias).lower()] = topic
        return aliases

    def correct_spelling(self, tokens: List[str], known_terms: Iterable[str]) -> List[str]:
        vocabulary = set(tokens)
        for term in known_terms:
            vocabulary.update(str(term).split())
        if not vocabulary:
            return tokens
        corrected = []
        for token in tokens:
            match = process.extractOne(token, vocabulary, score_cutoff=86)
            corrected.append(match[0] if match else token)
        return corrected

    def expand_aliases(self, tokens: List[str], alias_map: Dict[str, str]) -> tuple[str, Dict[str, str]]:
        query_text = " ".join(tokens)
        matched: Dict[str, str] = {}
        expanded_terms = list(tokens)
        for alias, topic in alias_map.items():
            if alias in query_text:
                matched[alias] = topic
                expanded_terms.append(topic)
        return " ".join(dict.fromkeys(expanded_terms)), matched

    def extract_phrases(self, normalized: str) -> List[str]:
        words = normalized.split()
        phrases: List[str] = []
        for size in (2, 3):
            for index in range(len(words) - size + 1):
                gram = words[index : index + size]
                if all(word in self.stopwords for word in gram):
                    continue
                phrases.append(" ".join(gram))
        return list(dict.fromkeys(phrases))
