from fastapi import APIRouter, HTTPException

from app.models.request_models import AdminLoginRequest
from app.models.response_models import AdminLoginResponse
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

auth_service = AuthService()


@router.post(
    "/login",
    response_model=AdminLoginResponse
)
def login(request: AdminLoginRequest):

    result = auth_service.login(
        username=request.username,
        password=request.password
    )

    if result is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    return result