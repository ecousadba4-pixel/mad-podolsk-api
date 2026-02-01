"""Service for authentication and user management."""

from typing import Optional, Dict, List
import bcrypt

from app.backend.repositories import auth_repo


# --- Password hashing ---

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash."""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except Exception:
        return False


# --- Authentication ---

async def authenticate(login: str, password: str) -> Dict:
    """
    Authenticate user by login and password.
    Returns dict with success status and user info or error message.
    """
    user = await auth_repo.get_user_by_login(login)
    
    if not user:
        return {
            "success": False,
            "message": "Неверный логин или пароль",
        }
    
    if not user.get("is_active"):
        return {
            "success": False,
            "message": "Учетная запись заблокирована",
        }
    
    if not verify_password(password, user.get("password_hash", "")):
        return {
            "success": False,
            "message": "Неверный логин или пароль",
        }
    
    # Create session
    session = await auth_repo.create_session(user["user_id"])
    
    return {
        "success": True,
        "message": "Успешный вход",
        "session_id": session["session_id"],
        "user": {
            "user_id": user["user_id"],
            "login": user["login"],
            "full_name": user.get("full_name"),
            "role": user["role"],
        },
    }


async def validate_session(session_id: str) -> Optional[Dict]:
    """
    Validate session and return user info.
    Extends session expiration (sliding window).
    """
    session = await auth_repo.get_session(session_id)
    
    if not session:
        return None
    
    if not session.get("is_active"):
        return None
    
    # Extend session (sliding window)
    await auth_repo.extend_session(session_id)
    
    return {
        "user_id": session["user_id"],
        "login": session["login"],
        "full_name": session.get("full_name"),
        "role": session["role"],
    }


async def logout(session_id: str) -> bool:
    """Logout user by deleting session."""
    return await auth_repo.delete_session(session_id)


# --- User management ---

async def get_users(
    search: Optional[str] = None,
    role_filter: Optional[str] = None,
    is_active_filter: Optional[bool] = None,
) -> Dict:
    """Get list of all users with optional filters."""
    users = await auth_repo.get_all_users(search, role_filter, is_active_filter)
    return {
        "users": users,
        "total": len(users),
    }


async def create_user(
    login: str,
    password: str,
    full_name: Optional[str],
    role: str,
    is_active: bool = True,
) -> Dict:
    """Create a new user."""
    # Check if login exists
    if await auth_repo.check_login_exists(login):
        return {
            "success": False,
            "message": "Пользователь с таким логином уже существует",
        }
    
    password_hash = hash_password(password)
    user = await auth_repo.create_user(login, password_hash, full_name, role, is_active)
    
    if not user:
        return {
            "success": False,
            "message": "Ошибка при создании пользователя",
        }
    
    return {
        "success": True,
        "message": "Пользователь успешно создан",
        "user": user,
    }


async def update_user(
    user_id: int,
    login: Optional[str] = None,
    full_name: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> Dict:
    """Update user."""
    # Check if user exists
    existing = await auth_repo.get_user_by_id(user_id)
    if not existing:
        return {
            "success": False,
            "message": "Пользователь не найден",
        }
    
    # Check if new login is unique
    if login and login != existing["login"]:
        if await auth_repo.check_login_exists(login, user_id):
            return {
                "success": False,
                "message": "Пользователь с таким логином уже существует",
            }
    
    user = await auth_repo.update_user(user_id, login, full_name, role, is_active)
    
    if not user:
        return {
            "success": False,
            "message": "Ошибка при обновлении пользователя",
        }
    
    # If user was deactivated, delete all their sessions
    if is_active is False:
        await auth_repo.delete_user_sessions(user_id)
    
    return {
        "success": True,
        "message": "Пользователь успешно обновлен",
        "user": user,
    }


async def reset_password(user_id: int, new_password: str) -> Dict:
    """Reset user password."""
    # Check if user exists
    existing = await auth_repo.get_user_by_id(user_id)
    if not existing:
        return {
            "success": False,
            "message": "Пользователь не найден",
        }
    
    password_hash = hash_password(new_password)
    success = await auth_repo.update_user_password(user_id, password_hash)
    
    if not success:
        return {
            "success": False,
            "message": "Ошибка при сбросе пароля",
        }
    
    # Delete all user sessions to force re-login
    await auth_repo.delete_user_sessions(user_id)
    
    return {
        "success": True,
        "message": "Пароль успешно изменен",
    }


async def get_user_by_id(user_id: int) -> Optional[Dict]:
    """Get user by ID."""
    return await auth_repo.get_user_by_id(user_id)
