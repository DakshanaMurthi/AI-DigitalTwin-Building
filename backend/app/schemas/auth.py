
from pydantic import BaseModel, EmailStr, Field


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AdminResponse(BaseModel):
    id: str
    email: EmailStr
    role: str = "admin"


class LoginResponse(BaseModel):
    message: str
    admin: AdminResponse
