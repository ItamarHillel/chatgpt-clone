import logging
import threading
from contextlib import contextmanager
from typing import Any, Iterator

from mysql.connector import errors as mysql_errors
from mysql.connector.cursor import MySQLCursorDict
from mysql.connector.pooling import MySQLConnectionPool

from models.client_errors import DatabaseUnavailableError
from utils.app_config import AppConfig

logger = logging.getLogger(__name__)

# How long a request waits for a free pooled connection before giving up.
_ACQUIRE_TIMEOUT_SECONDS = 10


class DAL:
    """Data Access Layer - runs SQL on MySQL through a shared connection pool.

    Every call borrows a connection from the pool, runs inside a transaction
    (commit on success, rollback on error) and returns the connection.
    """

    _pool: MySQLConnectionPool | None = None
    _pool_lock = threading.Lock()
    # mysql-connector's pool fails immediately when it is exhausted,
    # so a semaphore makes callers wait for a free connection instead.
    _slots = threading.BoundedSemaphore(AppConfig.db_pool_size)

    @classmethod
    def _get_pool(cls) -> MySQLConnectionPool:
        if cls._pool is None:
            with cls._pool_lock:
                if cls._pool is None:
                    cls._pool = MySQLConnectionPool(
                        pool_name="chatgpt_clone_pool",
                        pool_size=AppConfig.db_pool_size,
                        host=AppConfig.db_host,
                        port=AppConfig.db_port,
                        user=AppConfig.db_user,
                        password=AppConfig.db_password,
                        database=AppConfig.db_name,
                        charset="utf8mb4",
                        collation="utf8mb4_unicode_ci",
                        autocommit=False,
                        connection_timeout=10,
                    )
                    logger.info("MySQL connection pool created (%s@%s:%s/%s)", AppConfig.db_user, AppConfig.db_host, AppConfig.db_port, AppConfig.db_name)
        return cls._pool

    @contextmanager
    def transaction(self) -> Iterator[MySQLCursorDict]:
        """Yields a dictionary cursor. Everything executed on it is one transaction."""
        if not self._slots.acquire(timeout=_ACQUIRE_TIMEOUT_SECONDS):
            raise DatabaseUnavailableError("The database is busy, please try again.")
        try:
            try:
                connection = self._get_pool().get_connection()
            except (mysql_errors.InterfaceError, mysql_errors.PoolError, mysql_errors.DatabaseError) as err:
                logger.error("Could not connect to MySQL: %s", err)
                raise DatabaseUnavailableError("The database is unavailable. Make sure MySQL is running and Backend/.env is correct.") from err
            cursor = connection.cursor(dictionary=True)
            try:
                yield cursor
                connection.commit()
            except Exception:
                connection.rollback()
                raise
            finally:
                cursor.close()
                connection.close()  # Returns the connection to the pool.
        finally:
            self._slots.release()

    def get_table(self, sql: str, params: tuple = ()) -> list[dict[str, Any]]:
        with self.transaction() as cursor:
            cursor.execute(sql, params)
            return cursor.fetchall()

    def get_row(self, sql: str, params: tuple = ()) -> dict[str, Any] | None:
        with self.transaction() as cursor:
            cursor.execute(sql, params)
            return cursor.fetchone()

    def get_scalar(self, sql: str, params: tuple = ()) -> Any:
        row = self.get_row(sql, params)
        return next(iter(row.values())) if row else None

    def execute(self, sql: str, params: tuple = ()) -> int:
        """Runs INSERT / UPDATE / DELETE and returns the number of affected rows."""
        with self.transaction() as cursor:
            cursor.execute(sql, params)
            return cursor.rowcount
