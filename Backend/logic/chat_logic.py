import json
import logging
from contextlib import aclosing
from datetime import datetime
from typing import AsyncIterator

import anyio
from fastapi.concurrency import run_in_threadpool

from logic.conversations_logic import ConversationsLogic, utc_now
from models.client_errors import AIServiceError, AppError
from models.conversation_model import ChatExchangeModel
from models.role_model import Role
from services.openai_service import ChatContext, OpenAIService
from utils.app_config import AppConfig

logger = logging.getLogger(__name__)


def _sse(event: str, data: dict) -> str:
    """Formats one Server-Sent Event."""
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


class ChatLogic:
    """Continues a conversation: builds its context, asks the AI and saves both messages."""

    def __init__(self, conversations_logic: ConversationsLogic, ai_service: OpenAIService):
        self.conversations_logic = conversations_logic
        self.ai_service = ai_service

    def build_context(self, conversation_id: str, content: str) -> ChatContext:
        """The conversation so far (read from the database) followed by the new user message.

        Sending the whole history is what lets the AI answer in the same context.
        """
        self.conversations_logic.get_conversation(conversation_id)  # 404 if it doesn't exist.
        history = self.conversations_logic.get_messages(conversation_id, last=AppConfig.max_context_messages)
        context = [{"role": message.role.value, "content": message.content} for message in history]
        context.append({"role": Role.USER.value, "content": content})
        return context

    def send_message(self, conversation_id: str, content: str) -> ChatExchangeModel:
        """Gets the complete AI reply, then saves the user message and the reply."""
        sent_at = utc_now()
        context = self.build_context(conversation_id, content)
        reply = self.ai_service.get_reply(context)
        return self.conversations_logic.save_exchange(conversation_id, content, sent_at, reply)

    async def start_stream(self, conversation_id: str, content: str) -> AsyncIterator[str]:
        """Validates the request and returns the reply as a stream of Server-Sent Events.

        Problems found here (missing conversation, missing API key) become regular HTTP errors,
        because they are raised before the streaming response starts.
        """
        self.ai_service.ensure_configured()
        sent_at = utc_now()
        context = await run_in_threadpool(self.build_context, conversation_id, content)
        return self._stream_events(conversation_id, content, sent_at, context)

    async def _stream_events(self, conversation_id: str, content: str, sent_at: datetime, context: ChatContext) -> AsyncIterator[str]:
        """Events: "delta" {content} for each piece of the reply, then "done" {the saved exchange} or "error" {error}."""
        parts: list[str] = []
        finished = False  # Saved or failed - either way nothing is left to save.
        try:
            async with aclosing(self.ai_service.stream_reply(context)) as deltas:
                async for delta in deltas:
                    parts.append(delta)
                    yield _sse("delta", {"content": delta})

            reply = "".join(parts)
            if not reply.strip():
                raise AIServiceError("The AI returned an empty response. Please try again.")
            exchange = await run_in_threadpool(self.conversations_logic.save_exchange, conversation_id, content, sent_at, reply)
            finished = True
            yield _sse("done", exchange.model_dump(mode="json", by_alias=True))

        except AppError as err:
            finished = True
            yield _sse("error", {"error": err.message, "status": err.status_code})

        except Exception:
            finished = True
            logger.exception("Streaming a reply failed")
            yield _sse("error", {"error": "An unexpected server error occurred.", "status": 500})

        finally:
            if not finished and parts:
                # The client stopped the reply (Stop button / closed the page):
                # keep what was generated so far so the conversation stays consistent.
                with anyio.CancelScope(shield=True):
                    try:
                        await run_in_threadpool(self.conversations_logic.save_exchange, conversation_id, content, sent_at, "".join(parts))
                        logger.info("Reply stopped by the client - saved the partial reply (%d chars)", sum(map(len, parts)))
                    except Exception:
                        logger.exception("Could not save a partial reply")
