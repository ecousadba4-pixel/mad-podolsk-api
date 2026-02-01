"""Router for authentication and user management endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Response, Request, Depends, Query

from app.backend.schemas.auth import (
    LoginRequest,
    LoginResponse,
    UserListResponse,
    UserCreateRequest,
    UserUpdateRequest,
    UserPasswordResetRequest,
    UserResponse,
    CurrentUserResponse,
    UserInfo,
)
from app.backend.services import auth_service


router = APIRouter()

SESSION_COOKIE_NAME = "session_id"
SESSION_COOKIE_MAX_AGE = 10 * 24 * 60 * 60  # 10 days in seconds


# --- Dependencies ---

async def get_current_user(request: Request) -> Optional[dict]:
    """Get current user from session cookie."""
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        return None
    return await auth_service.validate_session(session_id)


async def require_auth(request: Request) -> dict:
    """Require authenticated user."""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Требуется авторизация")
    return user


async def require_admin(request: Request) -> dict:
    """Require admin role."""
    user = await require_auth(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    return user


# --- Authentication endpoints ---

@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, response: Response):
    """Login with login and password."""
    result = await auth_service.authenticate(data.login, data.password)
    
    if result["success"]:
        # Set session cookie
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=result["session_id"],
            max_age=SESSION_COOKIE_MAX_AGE,
            httponly=True,
            samesite="lax",
            secure=False,  # Set to True in production with HTTPS
        )
        return LoginResponse(
            success=True,
            message=result["message"],
            user=UserInfo(**result["user"]),
        )
    
    return LoginResponse(
        success=False,
        message=result["message"],
        user=None,
    )


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout current user."""
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if session_id:
        await auth_service.logout(session_id)
    
    response.delete_cookie(key=SESSION_COOKIE_NAME)
    return {"success": True, "message": "Выход выполнен"}


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user_info(user: dict = Depends(require_auth)):
    """Get current authenticated user info."""
    return CurrentUserResponse(
        user=UserInfo(
            user_id=user["user_id"],
            login=user["login"],
            full_name=user.get("full_name"),
            role=user["role"],
        ),
        role=user["role"],
    )


# --- User management endpoints (admin only) ---

@router.get("/users", response_model=UserListResponse)
async def list_users(
    search: Optional[str] = Query(None, description="Search by login or full name"),
    role: Optional[str] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    admin: dict = Depends(require_admin),
):
    """List all users (admin only)."""
    result = await auth_service.get_users(search, role, is_active)
    return UserListResponse(**result)


@router.post("/users", response_model=UserResponse)
async def create_user(
    data: UserCreateRequest,
    admin: dict = Depends(require_admin),
):
    """Create a new user (admin only)."""
    result = await auth_service.create_user(
        login=data.login,
        password=data.password,
        full_name=data.full_name,
        role=data.role,
        is_active=data.is_active,
    )
    return UserResponse(**result)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdateRequest,
    admin: dict = Depends(require_admin),
):
    """Update user (admin only)."""
    result = await auth_service.update_user(
        user_id=user_id,
        login=data.login,
        full_name=data.full_name,
        role=data.role,
        is_active=data.is_active,
    )
    return UserResponse(**result)


@router.post("/users/{user_id}/reset-password", response_model=UserResponse)
async def reset_user_password(
    user_id: int,
    data: UserPasswordResetRequest,
    admin: dict = Depends(require_admin),
):
    """Reset user password (admin only)."""
    result = await auth_service.reset_password(user_id, data.new_password)
    return UserResponse(
        success=result["success"],
        message=result["message"],
        user=None,
    )
