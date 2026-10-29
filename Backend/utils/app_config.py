import os
from pathlib import Path

from dotenv import load_dotenv

# Load the .env file that sits next to app.py (Backend/.env).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Values that mean "the key was never filled in" (copied from .env.example as is).
_PLACEHOLDER_KEYS = {"", "your-openai-api-key", "sk-..."}


def _get_int(name: str, default: int) -> int:
    value = os.getenv(name, "").strip()
    return int(value) if value else default


class AppConfig:
    """Application configuration. Every value is read from the .env file."""

    # Server
    environment = os.getenv("ENVIRONMENT", "development").strip().lower()
    is_development = environment == "development"
    host = os.getenv("HOST", "127.0.0.1").strip()
    port = _get_int("PORT", 8000)
    cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]

    # MySQL
    db_host = os.getenv("DB_HOST", "localhost").strip()
    db_port = _get_int("DB_PORT", 3306)
    db_user = os.getenv("DB_USER", "root").strip()
    db_password = os.getenv("DB_PASSWORD", "")
    db_name = os.getenv("DB_NAME", "chatgpt_clone").strip()
    db_pool_size = _get_int("DB_POOL_SIZE", 10)

    # OpenAI
    openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
    openai_model = os.getenv("OPENAI_MODEL", "gpt-6-luna").strip()
    openai_timeout_seconds = _get_int("OPENAI_TIMEOUT_SECONDS", 60)
    system_prompt = os.getenv("SYSTEM_PROMPT", "You are a helpful assistant.").strip()

    # Chat
    max_context_messages = _get_int("MAX_CONTEXT_MESSAGES", 100)  # Previous messages sent to OpenAI as context.
    max_message_length = _get_int("MAX_MESSAGE_LENGTH", 10000)    # Max characters in a single user message.

    @classmethod
    def is_openai_configured(cls) -> bool:
        return cls.openai_api_key not in _PLACEHOLDER_KEYS
