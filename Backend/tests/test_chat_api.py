import uuid

from models.client_errors import AIServiceError
from tests.conftest import parse_sse


def test_send_message_saves_user_message_and_reply(client, conversation_id):
    response = client.post(f"/api/conversations/{conversation_id}/messages", json={"content": "Tell me a one-liner programming joke"})
    assert response.status_code == 201
    exchange = response.json()
    assert exchange["userMessage"]["role"] == "user"
    assert exchange["userMessage"]["content"] == "Tell me a one-liner programming joke"
    assert exchange["assistantMessage"]["role"] == "assistant"
    assert exchange["assistantMessage"]["content"] == "Hello from the fake AI."
    assert exchange["conversation"]["title"] == "Tell me a one-liner programming joke"

    messages = client.get(f"/api/conversations/{conversation_id}").json()["messages"]
    assert [(m["role"], m["content"]) for m in messages] == [
        ("user", "Tell me a one-liner programming joke"),
        ("assistant", "Hello from the fake AI."),
    ]


def test_follow_up_message_is_sent_with_the_whole_conversation(client, conversation_id, fake_ai):
    client.post(f"/api/conversations/{conversation_id}/messages", json={"content": "first question"})
    client.post(f"/api/conversations/{conversation_id}/messages", json={"content": "second question"})

    assert fake_ai.contexts[-1] == [
        {"role": "user", "content": "first question"},
        {"role": "assistant", "content": "Hello from the fake AI."},
        {"role": "user", "content": "second question"},
    ]
    # The title stays the first message.
    assert client.get(f"/api/conversations/{conversation_id}").json()["title"] == "first question"


def test_conversations_do_not_share_context(client, conversation_id, fake_ai):
    other_id = client.post("/api/conversations").json()["conversationId"]
    try:
        client.post(f"/api/conversations/{conversation_id}/messages", json={"content": "in the first chat"})
        client.post(f"/api/conversations/{other_id}/messages", json={"content": "in the second chat"})
        assert fake_ai.contexts[-1] == [{"role": "user", "content": "in the second chat"}]
    finally:
        client.delete(f"/api/conversations/{other_id}")


def test_empty_message_is_rejected(client, conversation_id):
    response = client.post(f"/api/conversations/{conversation_id}/messages", json={"content": "   "})
    assert response.status_code == 422
    assert response.json()["error"].startswith("content:")


def test_message_to_missing_conversation_returns_404(client):
    response = client.post(f"/api/conversations/{uuid.uuid4()}/messages", json={"content": "Hi"})
    assert response.status_code == 404


def test_ai_failure_saves_nothing(client, conversation_id, fake_ai):
    fake_ai.error = AIServiceError("OpenAI is down")
    response = client.post(f"/api/conversations/{conversation_id}/messages", json={"content": "Hi"})
    assert response.status_code == 502
    assert response.json() == {"error": "OpenAI is down"}
    assert client.get(f"/api/conversations/{conversation_id}").json()["messages"] == []


def test_stream_message(client, conversation_id):
    response = client.post(f"/api/conversations/{conversation_id}/messages/stream", json={"content": "Stream please"})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")

    events = parse_sse(response.text)
    deltas = [data["content"] for event, data in events if event == "delta"]
    assert "".join(deltas) == "Hello from the fake AI."
    event, done = events[-1]
    assert event == "done"
    assert done["assistantMessage"]["content"] == "Hello from the fake AI."
    assert done["conversation"]["title"] == "Stream please"

    messages = client.get(f"/api/conversations/{conversation_id}").json()["messages"]
    assert [m["role"] for m in messages] == ["user", "assistant"]


def test_stream_error_is_sent_as_event_and_saves_nothing(client, conversation_id, fake_ai):
    fake_ai.error = AIServiceError("OpenAI rate limit or quota exceeded. Please try again later.", 429)
    response = client.post(f"/api/conversations/{conversation_id}/messages/stream", json={"content": "Hi"})

    event, data = parse_sse(response.text)[-1]
    assert event == "error"
    assert data == {"error": "OpenAI rate limit or quota exceeded. Please try again later.", "status": 429}
    assert client.get(f"/api/conversations/{conversation_id}").json()["messages"] == []


def test_stream_to_missing_conversation_returns_404_before_streaming(client):
    response = client.post(f"/api/conversations/{uuid.uuid4()}/messages/stream", json={"content": "Hi"})
    assert response.status_code == 404
    assert "error" in response.json()
