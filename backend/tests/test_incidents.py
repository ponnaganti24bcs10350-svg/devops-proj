from fastapi.testclient import TestClient

def test_create_incident_success(client: TestClient):
    """
    Test POST /api/v1/incidents creates a new incident record.
    Satisfies M1 (POST) and M2 test suite.
    """
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
    """
    Test POST /api/v1/incidents fails with 422 if required title is too short or missing.
    """
    payload = {
        "title": "x",  # Too short (min length 3)
        "service_name": "api"
    }
    response = client.post("/api/v1/incidents", json=payload)
    assert response.status_code == 422

def test_list_incidents_with_filters(client: TestClient):
    """
    Test GET /api/v1/incidents lists created incidents and respects filters.
    Satisfies M1 (GET) and M2 test suite.
    """
    # Create two incidents
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

    # Fetch all
    response = client.get("/api/v1/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert len(incidents) >= 2

    # Filter by severity
    res_high = client.get("/api/v1/incidents?severity=HIGH")
    assert res_high.status_code == 200
    high_items = res_high.json()
    for item in high_items:
        assert item["severity"] == "HIGH"

def test_get_incident_by_id(client: TestClient):
    """
    Test GET /api/v1/incidents/{id} returns single record and 404 for invalid ID.
    Satisfies M1 (GET single) and M2 test suite.
    """
    # Create
    created = client.post("/api/v1/incidents", json={
        "title": "DNS resolution failure in worker nodes",
        "service_name": "coredns",
        "severity": "MEDIUM",
        "status": "INVESTIGATING"
    }).json()

    # Get by ID
    res = client.get(f"/api/v1/incidents/{created['id']}")
    assert res.status_code == 200
    assert res.json()["id"] == created["id"]
    assert res.json()["title"] == "DNS resolution failure in worker nodes"

    # Not found case
    res_404 = client.get("/api/v1/incidents/999999")
    assert res_404.status_code == 404

def test_update_incident_lifecycle(client: TestClient):
    """
    Test PUT /api/v1/incidents/{id} updates lifecycle status to RESOLVED.
    Satisfies M1 (PUT) and M2 test suite.
    """
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
    """
    Test DELETE /api/v1/incidents/{id} deletes incident and returns 200.
    Satisfies M1 (DELETE) and M2 test suite.
    """
    created = client.post("/api/v1/incidents", json={
        "title": "Transient ingress TLS cert warning",
        "service_name": "k8s-ingress",
        "severity": "LOW",
        "status": "RESOLVED"
    }).json()

    del_res = client.delete(f"/api/v1/incidents/{created['id']}")
    assert del_res.status_code == 200
    assert del_res.json()["id"] == created["id"]

    # Verify deleted
    get_res = client.get(f"/api/v1/incidents/{created['id']}")
    assert get_res.status_code == 404

def test_services_catalog_endpoint(client: TestClient):
    """
    Test GET /api/v1/services returns list of monitored services.
    """
    res = client.get("/api/v1/services")
    assert res.status_code == 200
    services = res.json()
    assert isinstance(services, list)
    assert len(services) > 0
    assert any(s["name"] == "api-gateway" for s in services)

def test_stats_endpoint(client: TestClient):
    """
    Test GET /api/v1/stats returns reliability & incident counts.
    """
    res = client.get("/api/v1/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "total_incidents" in stats
    assert "active_incidents" in stats
    assert "critical_count" in stats
