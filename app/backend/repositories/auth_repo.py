"""Repository for authentication and user management."""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
import secrets

from app.backend import db


# --- Session operations ---

async def create_session(user_id: int, ttl_days: int = 10) -> dict:
    """Create a new session for user."""
    session_id = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=ttl_days)
    
    await db.query_async(
        """
        INSERT INTO sessions (user_id, session_id, expires_at, created_at, updated_at)
        VALUES (%s, %s, %s, NOW(), NOW())
        """,
        (user_id, session_id, expires_at),
    )
    
    return {
        "session_id": session_id,
        "user_id": user_id,
        "expires_at": expires_at,
    }


async def get_session(session_id: str) -> Optional[dict]:
    """Get session by session_id if not expired."""
    return await db.query_one_async(
        """
        SELECT s.id, s.user_id, s.session_id, s.expires_at,
               u.login, u.full_name, u.role, u.is_active
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.session_id = %s AND s.expires_at > NOW()
        """,
        (session_id,),
    )


async def extend_session(session_id: str, ttl_days: int = 10) -> bool:
    """Extend session expiration (sliding window)."""
    expires_at = datetime.now(timezone.utc) + timedelta(days=ttl_days)
    result = await db.query_async(
        """
        UPDATE sessions
        SET expires_at = %s, updated_at = NOW()
        WHERE session_id = %s AND expires_at > NOW()
        RETURNING id
        """,
        (expires_at, session_id),
    )
    return len(result) > 0


async def delete_session(session_id: str) -> bool:
    """Delete session (logout)."""
    result = await db.query_async(
        """
        DELETE FROM sessions WHERE session_id = %s RETURNING id
        """,
        (session_id,),
    )
    return len(result) > 0


async def delete_user_sessions(user_id: int) -> int:
    """Delete all sessions for a user."""
    result = await db.query_async(
        """
        DELETE FROM sessions WHERE user_id = %s RETURNING id
        """,
        (user_id,),
    )
    return len(result)


async def cleanup_expired_sessions() -> int:
    """Remove expired sessions."""
    result = await db.query_async(
        """
        DELETE FROM sessions WHERE expires_at <= NOW() RETURNING id
        """,
    )
    return len(result)


# --- User operations ---

async def get_user_by_login(login: str) -> Optional[dict]:
    """Get user by login."""
    return await db.query_one_async(
        """
        SELECT user_id, login, full_name, role, is_active, password_hash, created_at, updated_at
        FROM users
        WHERE login = %s
        """,
        (login,),
    )


async def get_user_by_id(user_id: int) -> Optional[dict]:
    """Get user by id."""
    return await db.query_one_async(
        """
        SELECT user_id, login, full_name, role, is_active, created_at, updated_at
        FROM users
        WHERE user_id = %s
        """,
        (user_id,),
    )


async def get_all_users(
    search: Optional[str] = None,
    role_filter: Optional[str] = None,
    is_active_filter: Optional[bool] = None,
) -> List[dict]:
    """Get all users with optional filters."""
    conditions = []
    params = []
    
    if search:
        conditions.append("(login ILIKE %s OR full_name ILIKE %s)")
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern])
    
    if role_filter:
        conditions.append("role = %s")
        params.append(role_filter)
    
    if is_active_filter is not None:
        conditions.append("is_active = %s")
        params.append(is_active_filter)
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    return await db.query_async(
        f"""
        SELECT user_id, login, full_name, role, is_active, created_at, updated_at
        FROM users
        WHERE {where_clause}
        ORDER BY user_id
        """,
        tuple(params),
    )


async def create_user(
    login: str,
    password_hash: str,
    full_name: Optional[str],
    role: str,
    is_active: bool = True,
) -> Optional[dict]:
    """Create a new user."""
    result = await db.query_async(
        """
        INSERT INTO users (login, password_hash, full_name, role, is_active, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        RETURNING user_id, login, full_name, role, is_active, created_at, updated_at
        """,
        (login, password_hash, full_name, role, is_active),
    )
    return result[0] if result else None


async def update_user(
    user_id: int,
    login: Optional[str] = None,
    full_name: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> Optional[dict]:
    """Update user fields."""
    updates = []
    params = []
    
    if login is not None:
        updates.append("login = %s")
        params.append(login)
    
    if full_name is not None:
        updates.append("full_name = %s")
        params.append(full_name)
    
    if role is not None:
        updates.append("role = %s")
        params.append(role)
    
    if is_active is not None:
        updates.append("is_active = %s")
        params.append(is_active)
    
    if not updates:
        return await get_user_by_id(user_id)
    
    updates.append("updated_at = NOW()")
    params.append(user_id)
    
    set_clause = ", ".join(updates)
    
    result = await db.query_async(
        f"""
        UPDATE users
        SET {set_clause}
        WHERE user_id = %s
        RETURNING user_id, login, full_name, role, is_active, created_at, updated_at
        """,
        tuple(params),
    )
    return result[0] if result else None


async def update_user_password(user_id: int, password_hash: str) -> bool:
    """Update user password."""
    result = await db.query_async(
        """
        UPDATE users
        SET password_hash = %s, updated_at = NOW()
        WHERE user_id = %s
        RETURNING user_id
        """,
        (password_hash, user_id),
    )
    return len(result) > 0


async def check_login_exists(login: str, exclude_user_id: Optional[int] = None) -> bool:
    """Check if login already exists."""
    if exclude_user_id:
        result = await db.query_one_async(
            """
            SELECT 1 FROM users WHERE login = %s AND user_id != %s
            """,
            (login, exclude_user_id),
        )
    else:
        result = await db.query_one_async(
            """
            SELECT 1 FROM users WHERE login = %s
            """,
            (login,),
        )
    return result is not None
