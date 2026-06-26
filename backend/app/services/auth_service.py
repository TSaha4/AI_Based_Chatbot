import logging
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.config.settings import get_settings
from app.database.mongo_client import get_database

logger = logging.getLogger(__name__)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


class AuthService:

    def __init__(self):

        self.settings = get_settings()

        self.db = get_database()

        self.admins = self.db["admins"]

    # -------------------------
    # Password Functions
    # -------------------------

    def hash_password(self, password: str):

        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str):

        return pwd_context.verify(
            plain_password,
            hashed_password
        )

    # -------------------------
    # Admin Functions
    # -------------------------

    def admin_exists(self):

        return self.admins.count_documents({}) > 0

    def create_default_admin(self):

        if self.admin_exists():
            logger.info("Admin already exists.")
            return

        admin = {

            "username": self.settings.default_admin_username,

            "password": self.hash_password(
                self.settings.default_admin_password
            ),

            "role": self.settings.default_admin_role,

            "active": True

        }

        self.admins.insert_one(admin)

        logger.info("Default Super Admin created.")

    def get_admin(self, username: str):

        return self.admins.find_one(
            {
                "username": username
            }
        )

    # -------------------------
    # JWT
    # -------------------------

    def create_access_token(self, data: dict):

        expire = datetime.now(
            timezone.utc
        ) + timedelta(
            minutes=self.settings.jwt_access_token_expire_minutes
        )

        payload = data.copy()

        payload.update(
            {
                "exp": expire
            }
        )

        token = jwt.encode(
            payload,
            self.settings.jwt_secret_key,
            algorithm=self.settings.jwt_algorithm
        )

        return token

    # -------------------------
    # Login
    # -------------------------

    def login(self, username: str, password: str):

        admin = self.get_admin(username)

        if admin is None:
            return None

        if not self.verify_password(
            password,
            admin["password"]
        ):
            return None

        token = self.create_access_token(
            {
                "sub": str(admin["_id"]),
                "username": admin["username"],
                "role": admin["role"]
            }
        )

        return {

            "authenticated": True,

            "access_token": token,

            "token_type": "bearer",

            "admin_id": str(admin["_id"]),

            "username": admin["username"],

            "role": admin["role"]

        }