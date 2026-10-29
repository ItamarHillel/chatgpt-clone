"""Test setup.

The tests run against the MySQL database configured in Backend/.env and remove every
conversation they create. OpenAI is replaced with a fake service, so no API key is needed.
"""
import json

import pytest
from fastapi.testclient import TestClient

from app import app
from logic.chat_logic import ChatLogic
from logic.conversations_logic import ConversationsLogic
from models.client_errors import AIServiceError
from utils.dependencies import get_chat_logic


class FakeAIService:
    """Stands in for OpenAIService and records the context it was asked to answer."""

    def __init__(self):
        self.contexts: list[list[dict]] = []
        self.reply_parts = ["Hello", " from", " the fake AI."]
        self.error: AIServiceError | None = None

    def ensure_configured(self):
        pass

    def get_reply(self, context):
        self.contexts.append(context)
        if self.error:
            raise self.error
        return "".join(self.reply_parts)

    async def stream_reply(self, context):
        self.contexts.append(context)
        for part in self.reply_parts:
            yield part
        if self.error:
            raise self.error


@pytest.fixture
def fake_ai() -> FakeAIService:
    return FakeAIService()


@pytest.fixture
def client(fake_ai):
    app.dependency_overrides[get_chat_logic] = lambda: ChatLogic(ConversationsLogic(), fake_ai)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def conversation_id(client) -> str:
    """A new empty conversation, deleted after the test."""
    response = client.post("/api/conversations")
    assert response.status_code == 201
    conversation_id = response.json()["conversationId"]
    yield conversation_id
    client.delete(f"/api/conversations/{conversation_id}")


def parse_sse(body: str) -> list[tuple[str, dict]]:
    """Splits a text/event-stream body into (event, data) pairs."""
    events = []
    for block in body.strip().split("\n\n"):
        lines = dict(line.split(": ", 1) for line in block.splitlines())
        events.append((lines["event"], json.loads(lines["data"])))
    return events
