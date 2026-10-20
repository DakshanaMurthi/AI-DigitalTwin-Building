from typing import Any, Generic, Optional, TypeVar

# pyrefly: ignore [missing-import]
from pydantic import BaseModel

# Generic type variable
T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    """
    Standard success response model.
    Used for all successful API responses.
    """

    success: bool = True
    message: str
    data: Optional[T] = None


class ErrorResponse(BaseModel):
    """
    Standard error response model.
    Used for all failed API responses.
    """

    success: bool = False
    message: str
    details: Optional[Any] = None


class HealthResponse(BaseModel):
    """
    Health check response model.
    """

    success: bool = True
    status: str
    database: str
    api: str