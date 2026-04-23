import contextlib

import psycopg2
from psycopg2 import pool as pg_pool

from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

_pool: pg_pool.ThreadedConnectionPool | None = None


def get_pool() -> pg_pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        _pool = pg_pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=5,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
        )
    return _pool


@contextlib.contextmanager
def get_conn():
    conn = get_pool().getconn()
    try:
        yield conn
    finally:
        get_pool().putconn(conn)
