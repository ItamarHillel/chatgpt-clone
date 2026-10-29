class AppError(Exception):
    """Base class for errors that are returned to the client as {"error": message}."""

    status_code = 500

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code


class ResourceNotFoundError(AppError):
    status_code = 404


class AIServiceError(AppError):
    """The AI provider (OpenAI) failed or is not configured."""

    status_code = 502


class DatabaseUnavailableError(AppError):
    status_code = 503
