import logging
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.database.mongo_client import get_database

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# JWT Configuration
SECRET_KEY = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


class AuthService:

    def __init__(self):
        self.db = get_database()
        self.admins = self.db["admins"]

    # -------------------------
    # Password Functions
    # -------------------------

    def hash_password(self, password: str):
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str):
        return pwd_context.verify(plain_password, hashed_password)

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
            "username": "admin",
            "password": self.hash_password("admin123"),
            "role": "super_admin",
            "active": True
        }

        self.admins.insert_one(admin)

        logger.info("Default Super Admin created.")

    def get_admin(self, username: str):
        return self.admins.find_one({"username": username})

    # -------------------------
    # JWT Functions
    # -------------------------

    def create_access_token(self, data: dict):

        to_encode = data.copy()

        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

        to_encode.update(
            {
                "exp": expire
            }
        )

        encoded_jwt = jwt.encode(
            to_encode,
            SECRET_KEY,
            algorithm=ALGORITHM
        )

        return encoded_jwt

    # -------------------------
    # Login Function
    # -------------------------

    def login(self, username: str, password: str):

        admin = self.get_admin(username)

        if not admin:
            return None

        if not self.verify_password(
            password,
            admin["password"]
        ):
            return None

        token = self.create_access_token(
            {
                "username": admin["username"],
                "role": admin["role"]
            }
        )

        return {
            "authenticated": True,
            "access_token": token,
            "admin_id": str(admin["_id"]),
            "username": admin["username"],
            "role": admin["role"]
        }