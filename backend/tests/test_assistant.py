import json

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_navigation_route_valid():
    payload = {
        "current_location": "gate_a",
        "destination_intent": "find me the nearest accessible restroom",
        "accessible_only": True,
    }
    response = client.post("/api/navigation/route", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["accessible_only"] is True
    assert len(data["path"]) > 0
    assert data["destination_node_id"] == "restroom_north_2"
    assert len(data["steps"]) > 0


def test_navigation_route_nonsense_input():
    payload = {
        "current_location": "gate_a",
        "destination_intent": "take me to mars please",
        "accessible_only": False,
    }
    response = client.post("/api/navigation/route", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Nonsense input should not crash, it should return a safe "no route found" payload
    assert data["path"] == []
    assert len(data["steps"]) == 1
    assert "Could not resolve destination" in data["steps"][0]["instruction"]


def test_crowd_status():
    response = client.get("/api/crowd/status")
    assert response.status_code == 200
    data = response.json()
    assert "zones" in data
    assert len(data["zones"]) == 4
    # Ensure Gate C status is Critical/High
    gate_c_zone = next(z for z in data["zones"] if z["zone_id"] == "East")
    assert gate_c_zone["status"] == "Critical"


def test_ops_summary():
    headers = {"Authorization": "Bearer metlife_director_2026"}
    response = client.post("/api/ops/summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "recommended_actions" in data
    assert len(data["recommended_actions"]) > 0


def test_transit_suggestions():
    response = client.get("/api/transit/suggestions?origin=Plaza Hotel")
    assert response.status_code == 200
    data = response.json()
    assert data["origin"] == "Plaza Hotel"
    assert len(data["options"]) > 0
    assert "sustainability_tip" in data


def test_assistant_chat_streaming():
    payload = {"messages": [{"role": "user", "content": "How do I get to gate A?"}]}
    response = client.post("/api/assistant/chat", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

    # Read streamed SSE content
    content = ""
    for line in response.iter_lines():
        if line:
            line_str = line.decode("utf-8") if isinstance(line, bytes) else line
            if line_str.startswith("data: "):
                data_json = json.loads(line_str[6:])
                content += data_json.get("chunk", "")

    assert len(content) > 0
    assert "Companion" in content or "Gate" in content or "stadium" in content
