from typing import Optional, Dict, Any, List
import asyncio
import os
import time
from concurrent.futures import ThreadPoolExecutor

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
import threading

_pool: Optional[pool.ThreadedConnectionPool] = None
_lock = threading.Lock()

# Thread pool for async execution of sync DB operations
_executor: Optional[ThreadPoolExecutor] = None
_DEFAULT_EXECUTOR_WORKERS = 10


def init_db(dsn: str, minconn: int | None = None, maxconn: int | None = None):
    """Initialize a threaded connection pool and async executor.

    If `minconn`/`maxconn` are not provided, try to read `DB_POOL_MIN`/`DB_POOL_MAX`
    from environment variables. Defaults to min=1, max=10.
    """
    global _pool, _executor
    with _lock:
        if _pool is None:
            env_min = os.environ.get("DB_POOL_MIN")
            env_max = os.environ.get("DB_POOL_MAX")
            minc = minconn if minconn is not None else int(env_min) if env_min else 1
            maxc = maxconn if maxconn is not None else int(env_max) if env_max else 10
            _pool = psycopg2.pool.ThreadedConnectionPool(minc, maxc, dsn)
        if _executor is None:
            executor_workers = int(os.environ.get("DB_EXECUTOR_WORKERS", _DEFAULT_EXECUTOR_WORKERS))
            _executor = ThreadPoolExecutor(max_workers=executor_workers, thread_name_prefix="db_async_")


def close_db():
    global _pool, _executor
    with _lock:
        if _pool:
            _pool.closeall()
            _pool = None
        if _executor:
            _executor.shutdown(wait=True)
            _executor = None


def _get_conn_raw():
    """Return a raw connection from the pool or raise RuntimeError if uninitialized."""
    global _pool
    if _pool is None:
        raise RuntimeError("DB pool is not initialized")
    return _pool.getconn()


def get_conn(timeout: float = 5.0, retry_interval: float = 0.05):
    """Get a connection from pool with retries until `timeout` seconds.

    Raises psycopg2.pool.PoolError if no connection becomes available.
    """
    start = time.time()
    last_exc: Exception | None = None
    while True:
        try:
            return _get_conn_raw()
        except Exception as e:
            # If pool is not initialized, raise immediately
            if isinstance(e, RuntimeError):
                raise
            last_exc = e
            if time.time() - start >= timeout:
                # re-raise the last exception (likely PoolError)
                raise
            time.sleep(retry_interval)


def put_conn(conn):
    global _pool
    if _pool is None:
        return
    _pool.putconn(conn)


def pool_status() -> Dict[str, Any]:
    """Return diagnostic information about the pool (best-effort).

    Uses internal attributes if available; never required for normal operation.
    """
    global _pool
    if _pool is None:
        return {"initialized": False}
    status: Dict[str, Any] = {"initialized": True}
    try:
        status["minconn"] = getattr(_pool, "minconn", None)
        status["maxconn"] = getattr(_pool, "maxconn", None)
        # private attributes may exist
        status["num_free"] = len(getattr(_pool, "_pool", []))
        status["num_used"] = len(getattr(_pool, "_used", []))
    except Exception:
        pass
    return status


def query(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Execute SQL query and return list of dicts. Thread-safe with proper error handling."""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            try:
                rows = cur.fetchall()
            except psycopg2.ProgrammingError:
                rows = []
            return rows
    except Exception:
        conn.rollback()  # Rollback on error to prevent connection corruption
        raise
    finally:
        put_conn(conn)


def query_one(sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """Execute SQL query and return single dict or None."""
    rows = query(sql, params)
    return rows[0] if rows else None


# === Async wrappers for non-blocking DB access ===

async def query_async(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Async wrapper for query() using run_in_executor.
    
    Use this in async endpoints to avoid blocking the event loop.
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, query, sql, params)


async def query_one_async(sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """Async wrapper for query_one() using run_in_executor."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, query_one, sql, params)


def health_check() -> Dict[str, Any]:
    """Check database connectivity. Returns status dict."""
    try:
        result = query_one("SELECT 1 AS ok")
        if result and result.get("ok") == 1:
            return {"status": "healthy", "pool": pool_status()}
        return {"status": "unhealthy", "error": "unexpected query result"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
