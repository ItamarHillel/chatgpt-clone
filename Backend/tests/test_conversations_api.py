import uuid

from logic.conversations_logic import make_title


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["database"] == "connected"


def test_create_conversation(client, conversation_id):
    response = client.get(f"/api/conversations/{conversation_id}")
    assert response.status_code == 200
    conversation = response.json()
    assert conversation["conversationId"] == conversation_id
    assert conversation["title"] is None
    assert conversation["messages"] == []
    assert conversation["createdAt"].endswith("Z")  # UTC


def test_get_all_conversations_includes_new_one(client, conversation_id):
    response = client.get("/api/conversations")
    assert response.status_code == 200
    assert conversation_id in [c["conversationId"] for c in response.json()]


def test_get_missing_conversation_returns_404(client):
    response = client.get(f"/api/conversations/{uuid.uuid4()}")
    assert response.status_code == 404
    assert "was not found" in response.json()["error"]


def test_invalid_conversation_id_returns_422(client):
    response = client.get("/api/conversations/not-a-uuid")
    assert response.status_code == 422
    assert response.json()["error"].startswith("conversation_id:")


def test_delete_conversation_deletes_its_messages(client):
    conversation_id = client.post("/api/conversations").json()["conversationId"]
    client.post(f"/api/conversations/{conversation_id}/messages", json={"content": "Hi"})

    assert client.delete(f"/api/conversations/{conversation_id}").status_code == 204
    assert client.get(f"/api/conversations/{conversation_id}").status_code == 404
    assert client.delete(f"/api/conversations/{conversation_id}").status_code == 404


def test_unknown_route_returns_json_error(client):
    response = client.get("/api/nothing-here")
    assert response.status_code == 404
    assert "error" in response.json()


def test_make_title():
    assert make_title("  Tell me   a joke \n please ") == "Tell me a joke please"
    long_title = make_title("word " * 40)
    assert len(long_title) <= 60 and long_title.endswith("…")
    assert make_title("x" * 100) == "x" * 59 + "…"
