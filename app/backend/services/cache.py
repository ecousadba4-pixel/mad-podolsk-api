"""
Async-safe TTL caching infrastructure for dashboard services.

Provides reusable cache implementations with automatic invalidation support.
"""

import asyncio
from time import monotonic
from typing import Any, Callable, Dict, Optional, Tuple, TypeVar

_SENTINEL = object()
T = TypeVar('T')


class AsyncTTLCache:
    """Async-safe simple TTL cache for a single value."""
    
    __slots__ = ('ttl_seconds', '_value', '_expires_at', '_lock')
    
    def __init__(self, ttl_seconds: int):
        self.ttl_seconds = ttl_seconds
        self._value: Any = _SENTINEL
        self._expires_at: float = 0.0
        self._lock = asyncio.Lock()
    
    async def get_or_set(self, factory: Callable[[], T]) -> T:
        """Get cached value or compute and cache it using factory."""
        now = monotonic()
        async with self._lock:
            if self._value is not _SENTINEL and now < self._expires_at:
                return self._value
        # Call factory outside lock to avoid blocking
        value = await factory()
        async with self._lock:
            self._value = value
            self._expires_at = monotonic() + self.ttl_seconds
            return self._value
    
    async def invalidate(self) -> None:
        """Clear cached value."""
        async with self._lock:
            self._value = _SENTINEL
            self._expires_at = 0.0


class AsyncKeyedTTLCache:
    """Async-safe TTL cache with keyed entries for caching by parameters."""
    
    __slots__ = ('ttl_seconds', 'max_entries', '_cache', '_lock')
    
    def __init__(self, ttl_seconds: int, max_entries: int = 100):
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._cache: Dict[Tuple, Tuple[Any, float]] = {}
        self._lock = asyncio.Lock()
    
    async def get_or_set(self, key: Tuple, factory: Callable[[], T]) -> T:
        """Get cached value for key or compute and cache it using factory."""
        now = monotonic()
        async with self._lock:
            if key in self._cache:
                value, expires_at = self._cache[key]
                if now < expires_at:
                    return value
            self._evict_expired(now)
        # Call factory outside lock to avoid blocking
        value = await factory()
        async with self._lock:
            self._cache[key] = (value, monotonic() + self.ttl_seconds)
            return value
    
    def _evict_expired(self, now: float) -> None:
        """Remove expired entries and limit cache size."""
        expired_keys = [k for k, (_, exp) in self._cache.items() if now >= exp]
        for k in expired_keys:
            del self._cache[k]
        if len(self._cache) >= self.max_entries:
            sorted_keys = sorted(self._cache.keys(), key=lambda k: self._cache[k][1])
            for k in sorted_keys[: len(self._cache) - self.max_entries + 1]:
                del self._cache[k]
    
    async def invalidate(self, key: Optional[Tuple] = None) -> None:
        """Clear cached value(s). If key is None, clears all entries."""
        async with self._lock:
            if key is None:
                self._cache.clear()
            elif key in self._cache:
                del self._cache[key]


# =============================================================================
# Global cache instances with optimized TTLs for data freshness
# =============================================================================

# Short TTL (30s) for frequently changing data
# Medium TTL (60s) for dashboard data that should be relatively fresh
# Long TTL (120s) for reference data like available months

MONTHS_CACHE = AsyncTTLCache(ttl_seconds=120)  # Reference data, less sensitive
LAST_LOADED_CACHE = AsyncTTLCache(ttl_seconds=15)  # Very short TTL to detect changes quickly
COMBINED_DASHBOARD_CACHE = AsyncKeyedTTLCache(ttl_seconds=30, max_entries=24)  # Main dashboard
DAILY_REVENUE_CACHE = AsyncKeyedTTLCache(ttl_seconds=30, max_entries=24)  # Daily data
SMETA_DETAILS_CACHE = AsyncKeyedTTLCache(ttl_seconds=60, max_entries=50)  # Detail views
SMETA_DETAILS_TYPES_CACHE = AsyncKeyedTTLCache(ttl_seconds=60, max_entries=50)  # Detail views

# Track last known loaded_at for change detection
_last_known_loaded_at: Optional[str] = None
_last_known_loaded_at_lock = asyncio.Lock()


async def invalidate_all_caches() -> None:
    """Invalidate all data caches. Call this when data is updated."""
    await asyncio.gather(
        MONTHS_CACHE.invalidate(),
        LAST_LOADED_CACHE.invalidate(),
        COMBINED_DASHBOARD_CACHE.invalidate(),
        DAILY_REVENUE_CACHE.invalidate(),
        SMETA_DETAILS_CACHE.invalidate(),
        SMETA_DETAILS_TYPES_CACHE.invalidate(),
    )


async def check_and_invalidate_on_data_change() -> None:
    """Check if last_loaded changed and invalidate caches if needed.
    
    This provides automatic cache invalidation when new data is loaded.
    """
    global _last_known_loaded_at
    
    # Import here to avoid circular imports
    from app.backend.repositories import dashboard_repo
    
    # Direct DB query to avoid cache
    row = await dashboard_repo.get_last_loaded_row()
    if not row:
        return
    
    loaded = row.get("loaded_at")
    if loaded is None:
        return
    
    try:
        current_loaded_at = loaded.isoformat() if hasattr(loaded, 'isoformat') else str(loaded)
    except Exception:
        current_loaded_at = str(loaded)
    
    async with _last_known_loaded_at_lock:
        if _last_known_loaded_at is not None and _last_known_loaded_at != current_loaded_at:
            # Data has been updated - invalidate all caches
            await invalidate_all_caches()
        _last_known_loaded_at = current_loaded_at
