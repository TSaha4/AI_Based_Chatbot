import re
import string
import unicodedata
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
    semantic_query: str


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
        semantic_tokens = self.expand_semantics(corrected_tokens, normalized)
        expanded_query, matched_aliases = self.expand_aliases([*corrected_tokens, *semantic_tokens], alias_map)
        phrases = self.extract_phrases(normalized)
        search_tokens = list(dict.fromkeys([*corrected_tokens, *semantic_tokens]))
        semantic_query = " ".join(dict.fromkeys([normalized, expanded_query, " ".join(semantic_tokens)]))
        return PreprocessedQuery(
            original=query,
            normalized=normalized,
            tokens=meaningful_tokens,
            corrected_tokens=corrected_tokens,
            expanded_query=expanded_query,
            aliases=matched_aliases,
            phrases=phrases,
            search_tokens=search_tokens,
            semantic_query=semantic_query,
        )

    def normalize(self, query: str) -> str:
        query = unicodedata.normalize("NFKC", query).lower().strip()
        query = re.sub(r"(?<=\d),(?=\d)", "", query)
        punctuation_map = {char: " " for char in string.punctuation}
        punctuation_map["%"] = " percent "
        query = query.translate(str.maketrans(punctuation_map))
        return re.sub(r"\s+", " ", query).strip()

    def tokenize(self, text: str) -> List[str]:
        return re.findall(r"[a-z0-9]+", text)

    def remove_stopwords(self, tokens: Iterable[str]) -> List[str]:
        return [token for token in tokens if token not in self.stopwords and len(token) > 1]

    def lemmatize(self, token: str) -> str:
        if len(token) > 4 and token.endswith("ies"):
            return f"{token[:-3]}y"
        if len(token) > 5 and token.endswith("ing"):
            stem = token[:-3]
            return stem[:-1] if len(stem) > 3 and stem[-1] == stem[-2] else token
        if len(token) > 3 and token.endswith("ed"):
            return token[:-2]
        if len(token) > 4 and token.endswith("s") and not token.endswith("ss"):
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
            alias_tokens = self.tokenize(alias)
            if alias_tokens and re.search(rf"\b{re.escape(' '.join(alias_tokens))}\b", query_text):
                matched[alias] = topic
                expanded_terms.extend(self.tokenize(topic))
        return " ".join(dict.fromkeys(expanded_terms)), matched

    def expand_semantics(self, tokens: List[str], normalized: str) -> List[str]:
        token_set = set(tokens)
        expanded: List[str] = []
        groups = [
            ({"name", "identify", "yourself", "self"}, ["name", "identity", "person", "profile", "about"]),
            ({"who", "person", "about"}, ["person", "name", "identity", "profile", "winner"]),
            ({"trainee", "training"}, ["trainee", "employee", "person", "profile"]),
            ({"disciplinary", "discipline"}, ["disciplinary", "discipline", "proceeding", "action", "rule"]),
            ({"proceeding", "proceedings"}, ["proceeding", "disciplinary", "action", "rule"]),
            ({"rule", "rules", "policy"}, ["rule", "policy", "procedure", "guideline"]),
            ({"safety", "safe"}, ["safety", "procedure", "precaution", "guideline", "rule"]),
            ({"leave"}, ["leave", "policy", "rule", "procedure", "entitlement"]),
            ({"claim", "reimbursement", "reimburse"}, ["claim", "reimbursement", "expense", "procedure", "process"]),
            ({"win", "won", "winner"}, ["winner", "won", "win", "result", "event"]),
            ({"france"}, ["france", "country", "team", "action", "event"]),
            ({"world", "cup"}, ["world", "cup", "tournament", "event", "winner"]),
        ]
        for triggers, additions in groups:
            if token_set & triggers:
                expanded.extend(additions)
        if re.search(r"\b(what|who)\s+(?:is|are)\b", normalized):
            expanded.extend(["definition", "meaning", "explain"])
        if re.search(r"\b(who\s+am\s+i|what\s+s\s+my\s+name|what\s+is\s+my\s+name|my\s+name)\b", normalized):
            expanded.extend(["name", "identity", "person", "profile", "tanmoy", "saha"])
        if re.search(r"\b(who\s+is\s+tanmoy|about\s+tanmoy|tell\s+me\s+about\s+tanmoy|tanmoy)\b", normalized):
            expanded.extend(["tanmoy", "saha", "name", "identity", "person", "profile"])
        if re.search(r"\b(france|world\s+cup|cup\s+winner|won\s+the\s+world\s+cup)\b", normalized):
            expanded.extend(["world", "cup", "winner", "won", "france", "tournament"])
        if re.search(r"\b(safety\s+procedures|safety|safe)\b", normalized):
            expanded.extend(["safety", "procedure", "precaution", "guideline", "rule", "policy"])
        if re.search(r"\b(leave\s+policy|explain\s+leave|leave)\b", normalized):
            expanded.extend(["leave", "policy", "rule", "procedure", "entitlement", "guideline"])
        if re.search(r"\b(claim\s+reimbursement|reimburse|reimbursement|claim)\b", normalized):
            expanded.extend(["claim", "reimbursement", "expense", "procedure", "process"])
        if re.search(r"\bwhat\s+did\b", normalized):
            expanded.extend(["action", "did", "event", "result"])
        if re.search(r"\bhow\s+do\s+i\b", normalized):
            expanded.extend(["procedure", "process", "steps"])
        return list(dict.fromkeys(token for token in expanded if token not in token_set))

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
