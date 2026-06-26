from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config.settings import get_settings
from app.database.mongo_client import get_database

settings = get_settings()

security = HTTPBearer()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Verify JWT token and return the logged-in admin.
    """

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )

        username = payload.get("username")

        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    db = get_database()

    admin = db["admins"].find_one(
        {
            "username": username
        }
    )

    if admin is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found",
        )

    return admin