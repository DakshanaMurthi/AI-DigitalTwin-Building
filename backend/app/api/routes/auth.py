
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer
from app.database.mongodb import get_database
from app.schemas.auth import AdminLoginRequest
from app.core.security import verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

COOKIE_NAME = "admin_access_token"
COOKIE_SECURE = False  # Set to True when deploying with HTTPS


async def get_users_collection():
    database = get_database()
    return database["users"]


@router.post("/login")
async def admin_login(payload: AdminLoginRequest, response: Response):
    users = await get_users_collection()
    admin = await users.find_one({"email": payload.email.lower()})

    if not admin or admin.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(payload.password, admin.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(str(admin["_id"]))

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=30 * 60,
        path="/",
    )

    return {
        "message": "Login successful",
        "admin": {
            "id": str(admin["_id"]),
            "email": admin["email"],
            "role": admin["role"],
        },
    }


@router.get("/me")
async def get_current_admin(request: Request):
    token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = decode_access_token(token)
        admin_id = payload.get("sub")

        if not admin_id:
            raise ValueError("Missing token subject")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )

    # pyrefly: ignore[missing-import]
    from bson import ObjectId
    # pyrefly: ignore[missing-import]
    from bson.errors import InvalidId

    try:
        object_id = ObjectId(admin_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
        )

    users = await get_users_collection()
    admin = await users.find_one({"_id": object_id, "role": "admin"})

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin account not found",
        )

    return {
        "id": str(admin["_id"]),
        "email": admin["email"],
        "role": admin["role"],
    }


@router.post("/logout")
async def admin_logout(response: Response):
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
    )
    return {"message": "Logged out successfully"}
