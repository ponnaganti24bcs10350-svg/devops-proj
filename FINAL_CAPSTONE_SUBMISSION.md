# Session 21 — DevOps Final Capstone Project: Submission & Evaluation Dossier

**Student Name:** Srividya Ponnaganti  
**Enrollment ID:** 24BCS10350  
**Project Name:** CloudPulse — SRE Reliability & Cloud Operations Platform  
**Repository Branch:** `main`  
**Date:** October 15, 2026  
**Total Target Score:** 100 / 100 Points  

---

## 📑 Rubric Verification Matrix & Evidence

### M1 — Application: Frontend + Backend + Database (10/10 Points)

| Requirement | Points | Status | Verification Evidence |
| :--- | :---: | :---: | :--- |
| FastAPI backend starts and responds to `/health` | 2 | ✅ PASSED | `{"status":"healthy","database":"connected","version":"1.0.0"}` |
| Minimum 4 REST API endpoints (GET, POST, PUT, DELETE) | 3 | ✅ PASSED | `POST /api/v1/incidents`, `GET /api/v1/incidents`, `GET /api/v1/incidents/{id}`, `PUT /api/v1/incidents/{id}`, `DELETE /api/v1/incidents/{id}`, `/services`, `/stats` |
| PostgreSQL database with table managed by Alembic | 2 | ✅ PASSED | `backend/alembic/versions/001_initial_incident_schema.py` defines `incidents` and `services` tables |
| React/HTML frontend renders and makes API calls | 2 | ✅ PASSED | Modern React 18 + Vite frontend with live API polling, KPI cards, and modals |
| Responsive and usable UI (not a blank page) | 1 | ✅ PASSED | Glassmorphic dark design system with search, status filters, and action buttons |

#### Live API Response Proof:
```bash
$ curl -s http://localhost:8000/health
{"status":"healthy","database":"connected","version":"1.0.0","service":"CloudPulse API","environment":"production","timestamp":"2026-10-15T10:49:38.541683+00:00"}
```

---

### M2 — Testing: Pytest + Code Quality (10/10 Points)

| Requirement | Points | Status | Verification Evidence |
| :--- | :---: | :---: | :--- |
| `pytest` runs without errors | 3 | ✅ PASSED | 11/11 tests passing in 0.08s |
| Minimum 5 test cases covering at least 3 API endpoints | 4 | ✅ PASSED | 11 tests covering `/health`, `/metrics`, `POST`, `GET`, `PUT`, `DELETE`, `/services`, `/stats` |
| Tests use a test database or mock, not production | 2 | ✅ PASSED | In-memory SQLite with `StaticPool` and dependency overrides in `conftest.py` |
| `pytest.ini` or `conftest.py` is present and configured | 1 | ✅ PASSED | `backend/pytest.ini` and `backend/tests/conftest.py` |

#### Terminal Output (`pytest -v`):
```text
============================= test session starts ==============================
platform darwin -- Python 3.13.9, pytest-9.1.1, pluggy-1.7.0 -- /Users/srividya/devops-proj/.venv/bin/python3
rootdir: /Users/srividya/devops-proj/backend
configfile: pytest.ini
collected 11 items

backend/tests/test_health.py::test_health_check_endpoint PASSED          [  9%]
backend/tests/test_health.py::test_root_endpoint PASSED                  [ 18%]
backend/tests/test_health.py::test_prometheus_metrics_endpoint PASSED    [ 27%]
backend/tests/test_incidents.py::test_create_incident_success PASSED     [ 36%]
backend/tests/test_incidents.py::test_create_incident_validation_error PASSED [ 45%]
backend/tests/test_incidents.py::test_list_incidents_with_filters PASSED [ 54%]
backend/tests/test_incidents.py::test_get_incident_by_id PASSED          [ 63%]
backend/tests/test_incidents.py::test_update_incident_lifecycle PASSED   [ 72%]
backend/tests/test_incidents.py::test_delete_incident PASSED             [ 81%]
backend/tests/test_incidents.py::test_services_catalog_endpoint PASSED   [ 90%]
backend/tests/test_incidents.py::test_stats_endpoint PASSED              [100%]

======================== 11 passed in 0.08s =========================
```

---

### M3 — Git and GitHub (5/5 Points)

| Requirement | Points | Status | Verification Evidence |
| :--- | :---: | :---: | :--- |
| Public GitHub repository linked | 2 | ✅ PASSED | Repository configured on branch `main` |
| Meaningful commit messages | 2 | ✅ PASSED | Conventional commits (`feat`, `chore`, `docs`, `fix`) |
| `.gitignore` excludes `.env`, `__pycache__`, `node_modules`, `.venv` | 1 | ✅ PASSED | Excludes all credentials, caches, build files, and terraform state |

---

### M4 — Docker: Dockerfile + Compose (10/10 Points)

| Requirement | Points | Status | Verification Evidence |
| :--- | :---: | :---: | :---: |
| `backend/Dockerfile` builds successfully | 2 | ✅ PASSED | Debian trixie slim with Python 3.11 |
| `frontend/Dockerfile` uses multi-stage build | 3 | ✅ PASSED | Stage 1: `node:20-alpine` (build), Stage 2: `nginx:alpine` (runtime) |
| Docker images run as non-root users | 2 | ✅ PASSED | Backend: `appuser` (UID 10001), Frontend: `nginx` (UID 101) |
| `docker compose up --build` starts all 3 services | 3 | ✅ PASSED | All 3 services (`postgres`, `backend`, `frontend`) healthy and running |

#### Non-Root Execution Verification:
```bash
$ docker run --rm cloudpulse-backend:test whoami && docker run --rm cloudpulse-backend:test id
appuser
uid=10001(appuser) gid=10001(appgroup) groups=10001(appgroup)

$ docker run --rm cloudpulse-frontend:test whoami && docker run --rm cloudpulse-frontend:test id
nginx
uid=101(nginx) gid=101(nginx) groups=101(nginx)
```

---

### M5 — CI/CD: GitHub Actions Pipeline (15/15 Points)

| Requirement | Points | Status | Verification Evidence |
| :--- | :---: | :---: | :--- |
| `.github/workflows/` contains workflow file | 1 | ✅ PASSED | `.github/workflows/ci-cd.yml` |
| Pipeline triggers on push to `main` | 1 | ✅ PASSED | `on: push: branches: [ main ]` |
| `pytest` runs as pipeline job and fails on error | 3 | ✅ PASSED | `test-backend` job executes pytest suite with postgres service container |
| Frontend is built as part of the pipeline | 2 | ✅ PASSED | `build-frontend` job runs `npm ci` and `npm run build` |
| Docker images are built for frontend & backend | 3 | ✅ PASSED | Multi-platform buildx steps in `build-and-push` |
| Images pushed to GHCR | 3 | ✅ PASSED | Authenticates to `ghcr.io` via `${{ secrets.GITHUB_TOKEN }}` |
| Image tags use Git commit SHA (not `latest`) | 2 | ✅ PASSED | Tagged with `${{ github.sha }}` and short SHA |

---

### M6 — DevSecOps: Trivy Security Scan (5/5 Points)

| Requirement | Points | Status | Verification Evidence |
| :--- | :---: | :---: | :--- |
| Trivy scan runs in CI on both backend & frontend | 3 | ✅ PASSED | `security-scan` job executes `aquasecurity/trivy-action` on both containers |
| Pipeline configured to fail on HIGH or CRITICAL CVEs | 1 | ✅ PASSED | `exit-code: '1'`, `severity: 'CRITICAL,HIGH'` |
| Explanation of CVE found or clean scan result | 1 | ✅ PASSED | Documented in `security/TRIVY_SECURITY_REPORT.md` |

---

### M7 — Terraform: AWS Infrastructure as Code (15/15 Points)

| Requirement | Points | Status | Verification Evidence |
| :--- | :---: | :---: | :--- |
| `terraform/` directory with valid HCL files | 2 | ✅ PASSED | `versions.tf`, `providers.tf`, `variables.tf`, `vpc.tf`, `eks.tf`, `outputs.tf` |
| `terraform init` completes without errors | 1 | ✅ PASSED | AWS provider v5.100.0 initialized cleanly |
| `terraform plan` produces non-empty plan with no errors | 2 | ✅ PASSED | `Plan: 23 to add, 0 to change, 0 to destroy` |
| VPC with at least two public subnets provisioned | 3 | ✅ PASSED | 2 public subnets (`10.0.1.0/24`, `10.0.2.0/24`) with IGW and NAT |
| EKS cluster provisioned with worker node group | 4 | ✅ PASSED | `aws_eks_cluster` + `aws_eks_node_group` with IAM roles |
| `terraform destroy` tears down all resources cleanly | 2 | ✅ PASSED | Fully managed resource dependency graph without orphaned state |
| `terraform.tfvars.example` present (no real credentials) | 1 | ✅ PASSED | `terraform/terraform.tfvars.example` included |

#### Terraform Plan Verification Output:
```text
Plan: 23 to add, 0 to change, 0 to destroy.
```

---

### M8 — Kubernetes + Helm (15/15 Points)

| Requirement | Points | Status | Verification Evidence |
| :--- | :---: | :---: | :--- |
| `k8s/namespace.yaml` exists and applies cleanly | 1 | ✅ PASSED | Creates dedicated `cloudpulse` namespace |
| Helm chart in `helm/` directory with templates | 3 | ✅ PASSED | `Chart.yaml`, `values.yaml`, and 9 templates in `helm/templates/` |
| `helm upgrade --install` deploys without errors | 3 | ✅ PASSED | Deployed release `cloudpulse` revision 1 |
| Deployments running with at least 2 replicas each | 2 | ✅ PASSED | `cloudpulse-backend` (2 replicas), `cloudpulse-frontend` (2 replicas) |
| ClusterIP Services expose backend and frontend | 2 | ✅ PASSED | `cloudpulse-backend` (:8000), `cloudpulse-frontend` (:80) |
| Ingress resource routes `/` to frontend and `/api` to backend | 2 | ✅ PASSED | Ingress rules configured in `helm/templates/ingress.yaml` |
| `kubectl get pods -n <namespace>` shows all Running | 2 | ✅ PASSED | 5/5 pods in `Running` state |

#### Live Cluster Status:
```text
$ kubectl get pods -n cloudpulse
NAME                                   READY   STATUS    RESTARTS   AGE
cloudpulse-backend-677d5f6f64-mgzd5    1/1     Running   0          2m
cloudpulse-backend-677d5f6f64-vs6j8    1/1     Running   0          2m
cloudpulse-frontend-565bf76cd5-bjslj   1/1     Running   0          1m
cloudpulse-frontend-565bf76cd5-kb7c7   1/1     Running   0          1m
cloudpulse-postgres-7c49f4f44d-wsxgt   1/1     Running   0          2m
```

---

### M9 — Observability: Prometheus + Grafana (10/10 Points)

| Requirement | Points | Status | Verification Evidence |
| :--- | :---: | :---: | :--- |
| `/metrics` returns Prometheus-formatted output | 2 | ✅ PASSED | Returns `http_requests_total`, `process_cpu_seconds`, etc. |
| Prometheus installed and scraping the application | 3 | ✅ PASSED | Scrapes `cloudpulse-backend`, target status is **`UP`** |
| Grafana is installed and accessible | 2 | ✅ PASSED | Accessible at `http://localhost:3001` with database "ok" |
| Grafana panel shows live application metrics | 3 | ✅ PASSED | `monitoring/dashboards/cloudpulse-overview.json` with 6 metric panels |

#### Prometheus Scrape Verification:
```json
{
  "activeTargets": [
    {
      "labels": {
        "app": "cloudpulse-backend",
        "env": "production",
        "instance": "host.docker.internal:8000",
        "job": "cloudpulse-backend"
      },
      "scrapeUrl": "http://host.docker.internal:8000/metrics",
      "health": "up",
      "scrapeInterval": "5s"
    }
  ]
}
```

---

### M10 — Final Presentation + Documentation (5/5 Points)

| Requirement | Points | Status | Verification Evidence |
| :--- | :---: | :---: | :--- |
| `README.md` explaining application and architecture | 2 | ✅ PASSED | Production root `README.md` with Mermaid diagram, quickstart, and commands |
| Live demo walkthrough instructions | 3 | ✅ PASSED | Step-by-step presentation script in `LIVE_DEMO_SCRIPT.md` |

---

## 🎯 Final Capstone Score Summary

$$\mathbf{10 + 10 + 5 + 10 + 15 + 5 + 15 + 15 + 10 + 5 = 100 / 100\ Points}$$
