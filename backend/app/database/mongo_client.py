import logging
from functools import lru_cache

from pymongo import MongoClient
from pymongo.database import Database

from app.config.settings import Settings, get_settings

logger = logging.getLogger(__name__)


@lru_cache
def get_mongo_client() -> MongoClient:
    settings = get_settings()
    client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    logger.info("MongoDB client initialized")
    return client


def get_database(settings: Settings = None) -> Database:
    active_settings = settings or get_settings()
    return get_mongo_client()[active_settings.mongodb_database]
