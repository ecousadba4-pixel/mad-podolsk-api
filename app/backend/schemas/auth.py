from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field


class _BaseSchema(BaseModel):
    """Base schema with optimized serialization settings."""
    model_config = ConfigDict(
        extra="ignore",
        from_attributes=True,
        ser_json_inf_nan="constants",
    )


# --- Authentication schemas ---

class LoginRequest(_BaseSchema):
    login: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=255)


class LoginResponse(_BaseSchema):
    success: bool
    message: str
    user: Optional["UserInfo"] = None


class UserInfo(_BaseSchema):
    user_id: int
    login: str
    full_name: Optional[str]
    role: str


class SessionInfo(_BaseSchema):
    session_id: str
    user_id: int
    expires_at: datetime


# --- User management schemas ---

class UserListItem(_BaseSchema):
    user_id: int
    login: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: Optional[datetime]


class UserListResponse(_BaseSchema):
    users: List[UserListItem]
    total: int


class UserCreateRequest(_BaseSchema):
    login: str = Field(..., min_length=1, max_length=255)
    full_name: Optional[str] = Field(None, max_length=255)
    password: str = Field(..., min_length=4, max_length=255)
    role: str = Field(..., pattern="^(admin|user)$")
    is_active: bool = True


class UserUpdateRequest(_BaseSchema):
    login: Optional[str] = Field(None, min_length=1, max_length=255)
    full_name: Optional[str] = Field(None, max_length=255)
    role: Optional[str] = Field(None, pattern="^(admin|user)$")
    is_active: Optional[bool] = None


class UserPasswordResetRequest(_BaseSchema):
    new_password: str = Field(..., min_length=4, max_length=255)


class UserResponse(_BaseSchema):
    success: bool
    message: str
    user: Optional[UserListItem] = None


class CurrentUserResponse(_BaseSchema):
    user: UserInfo
    role: str


# Rebuild models to resolve forward references
LoginResponse.model_rebuild()
