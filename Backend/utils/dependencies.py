from functools import lru_cache

from logic.chat_logic import ChatLogic
from logic.conversations_logic import ConversationsLogic
from services.openai_service import OpenAIService

# FastAPI dependency providers - one shared instance of each.
# Tests replace them through app.dependency_overrides.


@lru_cache
def get_conversations_logic() -> ConversationsLogic:
    return ConversationsLogic()


@lru_cache
def get_chat_logic() -> ChatLogic:
    return ChatLogic(get_conversations_logic(), OpenAIService())
