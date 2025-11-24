from typing import Optional
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
import threading

_pool: Optional[pool.ThreadedConnectionPool] = None
_lock = threading.Lock()


def init_db(dsn: str, minconn: int = 1, maxconn: int = 5):
    global _pool
    with _lock:
        if _pool is None:
            _pool = psycopg2.pool.ThreadedConnectionPool(minconn, maxconn, dsn)


def close_db():
    global _pool
    with _lock:
        if _pool:
            _pool.closeall()
            _pool = None


def get_conn():
    global _pool
    if _pool is None:
        raise RuntimeError("DB pool is not initialized")
    return _pool.getconn()


def put_conn(conn):
    global _pool
    if _pool is None:
        return
    _pool.putconn(conn)


def query(sql: str, params: tuple = ()):  # returns list[dict]
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            try:
                rows = cur.fetchall()
            except psycopg2.ProgrammingError:
                rows = []
            return rows
    finally:
        put_conn(conn)


def query_one(sql: str, params: tuple = ()):  # returns dict or None
    rows = query(sql, params)
    return rows[0] if rows else None
