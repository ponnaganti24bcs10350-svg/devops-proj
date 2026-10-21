# CloudPulse

CloudPulse is an incident response and service health tracking platform built for site reliability and cloud engineering teams. It provides real-time service health checks, incident lifecycle management, and Prometheus metrics out of the box.

---

## Features

- **Incident Triage & Tracking:** Declare, investigate, resolve, and archive incidents with severity levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Service Catalog Monitoring:** Monitor latency and uptime percentages across core infrastructure services.
- **Health & Readiness Probes:** Live database connectivity check via `/health`.
- **Prometheus Metrics:** Standard `/metrics` endpoint instrumented for request throughput, latency histograms, and error rates.
- **Containerized Stack:** Multi-stage, unprivileged non-root Docker builds for frontend and backend.
- **Production-Ready Deployments:** Helm charts with Horizontal Pod Autoscaling (HPA) and Kubernetes manifests.
- **Infrastructure as Code:** Terraform configuration for an AWS VPC and managed EKS cluster.
- **Automated CI/CD:** GitHub Actions pipeline with unit tests, Trivy vulnerability scanning, and Docker builds.

---

## Architecture

```mermaid
graph TD
    Client["Client Browser"] -->|HTTP :3000| Ingress["Ingress / Reverse Proxy"]
    
    subgraph Cluster ["Kubernetes / Docker Network"]
        Ingress -->|/ | Frontend["React Frontend (Nginx)"]
        Ingress -->|/api, /health, /metrics | Backend["FastAPI Backend (Python)"]
        
        Backend -->|SQLAlchemy| Postgres[("PostgreSQL Database")]
        Backend -->|Exposes :8000/metrics| Prometheus["Prometheus Server"]
    end

    Prometheus --> Grafana["Grafana Dashboards"]
```

---

## Tech Stack

- **Backend:** FastAPI, Python 3.11, SQLAlchemy, Pydantic, Alembic, Uvicorn
- **Frontend:** React 18, Vite, Vanilla CSS
- **Database:** PostgreSQL 16
- **Testing:** Pytest, FastAPI TestClient
- **Containers & Orchestration:** Docker, Docker Compose, Kubernetes, Helm
- **Infrastructure as Code:** Terraform (AWS VPC, Subnets, EKS)
- **CI/CD & Security:** GitHub Actions, Trivy
- **Observability:** Prometheus, Grafana

---

## Quickstart (Local Docker Compose)

The easiest way to run the full stack locally is with Docker Compose:

```bash
git clone https://github.com/ponnaganti24bcs10350-svg/devops-proj.git
cd devops-proj

docker compose up -d --build

docker compose ps
```

Once running, access the services:
- **Web UI:** http://localhost:3000
- **API Documentation (Swagger):** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health
- **Prometheus Metrics:** http://localhost:8000/metrics

To shut down:
```bash
docker compose down
```

---

## Running Tests

Automated tests run against an isolated in-memory SQLite database so your local database is untouched:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

PYTHONPATH=. pytest backend/tests -v
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service and database health check |
| `GET` | `/metrics` | Prometheus observability metrics |
| `GET` | `/api/v1/incidents` | List incidents (supports `?status=` and `?severity=` filters) |
| `POST` | `/api/v1/incidents` | Create a new incident |
| `GET` | `/api/v1/incidents/{id}` | Get incident details |
| `PUT` | `/api/v1/incidents/{id}` | Update incident status or details |
| `DELETE` | `/api/v1/incidents/{id}` | Delete / archive an incident |
| `GET` | `/api/v1/services` | Service catalog and uptime status |
| `GET` | `/api/v1/stats` | Summary statistics of active incidents |

---

## Kubernetes & Helm

Deploy the stack to a local or remote Kubernetes cluster (e.g. Minikube or Kind):

```bash
kubectl apply -f k8s/namespace.yaml

helm upgrade --install cloudpulse ./helm --namespace cloudpulse

kubectl get pods -n cloudpulse
```

---

## Terraform (AWS Infrastructure)

Terraform configurations for provisioning an AWS VPC and EKS cluster reside in `terraform/`:

```bash
cd terraform

terraform init

terraform validate

terraform plan -var-file=terraform.tfvars.example
```

---

## CI/CD Pipeline

The `.github/workflows/ci-cd.yml` workflow runs automatically on every push to `main`:
1. **Test:** Runs Pytest test suite with code quality checks.
2. **Build:** Runs frontend compilation (`npm run build`).
3. **Security:** Runs Trivy vulnerability scanner to flag high/critical CVEs in container images.
4. **Publish:** Builds and tags Docker images for deployment.

screenshots : 
app_dashboard : 
<img width="2840" height="1613" alt="image" src="https://github.com/user-attachments/assets/0e17cde5-7766-45fb-9913-2ac692eff1b4" />

health_api :
<img width="1900" height="314" alt="image" src="https://github.com/user-attachments/assets/a7d4bace-e500-4de5-b0ff-e8ca441147f7" />

pytest_results :
<img width="1790" height="576" alt="image" src="https://github.com/user-attachments/assets/38c0af23-041a-4bdb-aef3-0ecfe6fc1557" />
<img width="1842" height="308" alt="image" src="https://github.com/user-attachments/assets/0d8e2552-289e-4685-ba37-0f7f19169148" />

github_repo :
<img width="1382" height="1477" alt="image" src="https://github.com/user-attachments/assets/d62290ac-c7a6-401d-994d-3f6b0957fccf" />

docker_compose :
<img width="2112" height="336" alt="image" src="https://github.com/user-attachments/assets/a0c1f666-6f90-4244-9c1d-efafa3abaac8" />

github_actions :
<img width="1880" height="1476" alt="image" src="https://github.com/user-attachments/assets/3d4033e9-b47d-4676-93d3-e227b22b991b" />

pipeline_detail :
<img width="1836" height="750" alt="image" src="https://github.com/user-attachments/assets/cb958d83-9507-4210-8757-5b492ed00f7c" />

ghcr_packages :
<img width="1596" height="1230" alt="image" src="https://github.com/user-attachments/assets/6205f921-f965-45b1-a4fc-552c3eba2e04" />

trivy_scan :
<img width="1800" height="1124" alt="image" src="https://github.com/user-attachments/assets/ccb966d9-fe8d-4ffd-967f-b09a46e97c7f" />

terraform_files :
<img width="1832" height="704" alt="image" src="https://github.com/user-attachments/assets/97e33b5f-2f96-4384-95ca-cdb88deaa6f3" />

helm_templates :
<img width="1890" height="1142" alt="image" src="https://github.com/user-attachments/assets/111c547d-dda3-4225-ba06-d5a08ef46042" />

prometheus_metrics :
<img width="1424" height="1341" alt="image" src="https://github.com/user-attachments/assets/60154609-cc37-40f3-8e00-62e8eacff009" />
<img width="1908" height="1384" alt="image" src="https://github.com/user-attachments/assets/aa93be73-86f5-4b95-9745-06bbfb90472c" />

screen recording of demo project :
https://screenrec.com/share/LYCkSimQUR

presentation -> https://drive.google.com/drive/folders/1pXBW4ERf-W6Mj0pSTNTu9CtuO4S00adC?dmr=1&ec=wgc-drive-%5Bmodule%5D-goto
