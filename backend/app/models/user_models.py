from pydantic import BaseModel, Field
from typing import Optional


class AdminUser(BaseModel):
    username: str = Field(...)
    password: str = Field(...)   # we'll hash this later
    email: Optional[str] = None
    role: str = "admin"