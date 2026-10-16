from fastapi.testclient import TestClient

def test_create_incident_success(client: TestClient):
    payload = {
        "title": "Database connection pool exhaustion in production",
        "description": "High traffic spike causing timeout errors on pg pool",
        "service_name": "postgres-cluster",
        "severity": "CRITICAL",
        "status": "INVESTIGATING",
        "assigned_to": "devops-sre-team"
    }
    response = client.post("/api/v1/incidents", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == payload["title"]
    assert data["service_name"] == "postgres-cluster"
    assert data["severity"] == "CRITICAL"
    assert data["status"] == "INVESTIGATING"
    assert data["assigned_to"] == "devops-sre-team"
    assert "created_at" in data

def test_create_incident_validation_error(client: TestClient):
    payload = {
        "title": "x",
        "service_name": "api"
    }
    response = client.post("/api/v1/incidents", json=payload)
    assert response.status_code == 422

def test_list_incidents_with_filters(client: TestClient):
    client.post("/api/v1/incidents", json={
        "title": "API Gateway 502 Bad Gateway spike",
        "service_name": "api-gateway",
        "severity": "HIGH",
        "status": "IDENTIFIED"
    })
    client.post("/api/v1/incidents", json={
        "title": "Cache latency elevated in Redis",
        "service_name": "redis-cache",
        "severity": "LOW",
        "status": "RESOLVED"
    })

    response = client.get("/api/v1/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert len(incidents) >= 2

    res_high = client.get("/api/v1/incidents?severity=HIGH")
    assert res_high.status_code == 200
    high_items = res_high.json()
    for item in high_items:
        assert item["severity"] == "HIGH"

def test_get_incident_by_id(client: TestClient):
    created = client.post("/api/v1/incidents", json={
        "title": "DNS resolution failure in worker nodes",
        "service_name": "coredns",
        "severity": "MEDIUM",
        "status": "INVESTIGATING"
    }).json()

    res = client.get(f"/api/v1/incidents/{created['id']}")
    assert res.status_code == 200
    assert res.json()["id"] == created["id"]
    assert res.json()["title"] == "DNS resolution failure in worker nodes"

    res_404 = client.get("/api/v1/incidents/999999")
    assert res_404.status_code == 404

def test_update_incident_lifecycle(client: TestClient):
    created = client.post("/api/v1/incidents", json={
        "title": "Memory leak detected in auth-service container",
        "service_name": "auth-service",
        "severity": "HIGH",
        "status": "INVESTIGATING"
    }).json()

    update_payload = {
        "status": "RESOLVED",
        "assigned_to": "lead-sre"
    }
    update_res = client.put(f"/api/v1/incidents/{created['id']}", json=update_payload)
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["status"] == "RESOLVED"
    assert data["assigned_to"] == "lead-sre"
    assert data["resolved_at"] is not None

def test_delete_incident(client: TestClient):
    created = client.post("/api/v1/incidents", json={
        "title": "Transient ingress TLS cert warning",
        "service_name": "k8s-ingress",
        "severity": "LOW",
        "status": "RESOLVED"
    }).json()

    del_res = client.delete(f"/api/v1/incidents/{created['id']}")
    assert del_res.status_code == 200
    assert del_res.json()["id"] == created["id"]

    get_res = client.get(f"/api/v1/incidents/{created['id']}")
    assert get_res.status_code == 404

def test_services_catalog_endpoint(client: TestClient):
    res = client.get("/api/v1/services")
    assert res.status_code == 200
    services = res.json()
    assert isinstance(services, list)
    assert len(services) > 0
    assert any(s["name"] == "api-gateway" for s in services)

def test_stats_endpoint(client: TestClient):
    res = client.get("/api/v1/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "total_incidents" in stats
    assert "active_incidents" in stats
    assert "critical_count" in stats
