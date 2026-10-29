import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from mysql.connector import Error as MySQLError
from starlette.exceptions import HTTPException as StarletteHTTPException

from models.client_errors import AppError

logger = logging.getLogger(__name__)


def _error(status_code: int, message: str, headers: dict | None = None) -> JSONResponse:
    # Every error the API returns has the same shape: {"error": "..."}
    return JSONResponse(status_code=status_code, content={"error": message}, headers=headers)


def register_error_handlers(app: FastAPI) -> None:

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, err: AppError):
        return _error(err.status_code, err.message)

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, err: RequestValidationError):
        messages = []
        for error in err.errors():
            field = ".".join(str(part) for part in error["loc"] if part not in ("body", "path", "query"))
            messages.append(f"{field}: {error['msg']}" if field else error["msg"])
        return _error(status.HTTP_422_UNPROCESSABLE_CONTENT, "; ".join(messages))

    @app.exception_handler(StarletteHTTPException)
    async def http_error_handler(request: Request, err: StarletteHTTPException):
        return _error(err.status_code, str(err.detail), getattr(err, "headers", None))

    @app.exception_handler(MySQLError)
    async def database_error_handler(request: Request, err: MySQLError):
        logger.error("Database error on %s %s: %s", request.method, request.url.path, err)
        return _error(status.HTTP_500_INTERNAL_SERVER_ERROR, "A database error occurred.")

    @app.exception_handler(Exception)
    async def unexpected_error_handler(request: Request, err: Exception):
        logger.exception("Unexpected error on %s %s", request.method, request.url.path)
        return _error(status.HTTP_500_INTERNAL_SERVER_ERROR, "An unexpected server error occurred.")
