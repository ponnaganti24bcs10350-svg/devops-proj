# 🎙 CloudPulse Live Presentation & Evaluator Demo Script

**Course:** Session 21 — Final DevOps Capstone Project  
**Presenter:** Srividya Ponnaganti (Enrollment: 24BCS10350)  
**Target Duration:** 8–10 Minutes  

---

## 🎬 Demo Overview & Step-by-Step Flow

This script is structured to systematically address each module in the grading rubric, demonstrating live functionality, test execution, container security, infrastructure code, Kubernetes orchestration, and telemetry.

---

### Step 1: Introduction & Architecture Walkthrough (1.5 Minutes)

> *"Good morning / afternoon. Today I am presenting **CloudPulse**, an enterprise Site Reliability Engineering (SRE) and Incident Management platform built to automate cloud infrastructure health triage and observability.*
>
> *Unlike a generic task board, CloudPulse models real-world platform engineering: managing microservices latency, incident escalation lifecycles, and observability.*
>
> *Our architecture follows a full cloud-native stack: a FastAPI backend with PostgreSQL managed through Alembic migrations, a responsive React 18 UI built with Vite, multi-stage non-root Docker containers, an automated GitHub Actions CI/CD pipeline with Trivy DevSecOps vulnerability gates, AWS multi-AZ VPC and EKS infrastructure provisioned via Terraform, Kubernetes deployment managed by a production Helm chart, and Prometheus and Grafana telemetry."*

---

### Step 2: Live Application & REST API Demonstration (2 Minutes)

Open the browser at `http://localhost:3000`.

1. **Point to System Health Banner:**
   - Explain how the banner queries the backend `/health` probe and confirms live PostgreSQL database connectivity.
2. **Review KPI Metrics:**
   - Total Incidents, Active Outages, Investigating, and Resolved.
3. **Trigger Modal & Create an Incident:**
   - Click `+ Report Incident`.
   - Title: `CoreDNS Pod Flapping on Worker Nodes`.
   - Service: `k8s-ingress-controller`.
   - Severity: `HIGH`.
   - Click `Publish Incident`.
   - Show how the KPI count updates in real-time.
4. **Resolve Incident:**
   - Click `✓ Mark Resolved`.
   - Show that the card updates its badge to green and records the resolution timestamp in PostgreSQL.
5. **Show REST API Endpoints:**
   - Open terminal and show:
     ```bash
     curl -s http://localhost:8000/health
     curl -s http://localhost:8000/api/v1/incidents | jq .
     ```

---

### Step 3: Pytest & Quality Gate (1 Minute)

Run the test suite live in the terminal:

```bash
PYTHONPATH=. pytest backend/tests -v
```

> *"Our testing gate executes 11 comprehensive tests in 0.08 seconds. Every test runs against an isolated in-memory SQLite database using FastAPI dependency overrides, ensuring the production database is never touched during test execution. We cover health probes, metrics, CRUD operations, lifecycle state transitions, and validation edge cases."*

---

### Step 4: Docker & Non-Root Security (1.5 Minutes)

Show running Docker Compose stack and non-root execution:

```bash
docker compose ps
docker exec cloudpulse-backend whoami
docker exec cloudpulse-frontend whoami
```

> *"Both backend and frontend containers are hardened. The frontend uses a multi-stage build where Node.js build dependencies are discarded, producing an ultra-lightweight 26MB Alpine image. Furthermore, both containers strictly enforce non-root execution: UID 10001 (`appuser`) for Python, and UID 101 (`nginx`) for frontend runtime."*

---

### Step 5: CI/CD & DevSecOps with Trivy (1.5 Minutes)

Open `.github/workflows/ci-cd.yml` and highlight:

1. **Triggers:** Push to `main` branch.
2. **Quality Gates:** Pytest runs as a pipeline gate with PostgreSQL service container.
3. **Frontend Build:** Runs `npm ci` and `npm run build`.
4. **DevSecOps Gate:** Aqua Security Trivy scans both container images and is configured to fail the pipeline on any `HIGH` or `CRITICAL` vulnerabilities (`exit-code: 1`).
5. **GHCR Publishing:** Published images are tagged with the exact Git commit SHA (`${{ github.sha }}`) to guarantee immutable traceability.

---

### Step 6: Terraform AWS Infrastructure as Code (1 Minute)

Navigate to the `terraform/` directory:

```bash
cd terraform
terraform validate
terraform plan -no-color | grep -E "Plan:"
```

> *"Our Terraform code is modular and clean. It provisions an enterprise VPC with two public subnets, two private subnets, Internet Gateway, NAT Gateway, an AWS EKS Cluster running Kubernetes v1.30, and a managed worker node group with autoscaling. Running `terraform plan` demonstrates 23 planned AWS resources with zero errors, and clean destroy ensures no runaway AWS bills."*

---

### Step 7: Kubernetes & Helm Deployment (1.5 Minutes)

Run the following cluster commands:

```bash
kubectl get pods -n cloudpulse
kubectl get svc -n cloudpulse
kubectl get ingress -n cloudpulse
helm list -n cloudpulse
```

> *"Here in our Kubernetes cluster, the application is packaged and deployed as a Helm chart. We have high availability with 2 replicas for the backend and 2 replicas for the frontend, ClusterIP services exposing the pods, non-root security contexts, and an Ingress resource routing `/` to the frontend and `/api` to the backend. All 5 pods are in `1/1 Running` state."*

---

### Step 8: Observability — Prometheus & Grafana (1 Minute)

1. **Verify `/metrics` endpoint:**
   ```bash
   curl -s http://localhost:8000/metrics | head -n 15
   ```
2. **Verify Prometheus Scraping:**
   - Open Prometheus at `http://localhost:9090/targets`.
   - Show `cloudpulse-backend` target in **`UP`** state.
3. **Show Grafana Dashboard:**
   - Open Grafana at `http://localhost:3001`.
   - Display the CloudPulse Operations & Telemetry dashboard showing live HTTP request rate, P95 latency, and memory utilization.

---

### Step 9: Conclusion & Q&A

> *"In summary, CloudPulse satisfies all 10 modules and 100 points of the Session 21 Capstone Rubric — from full-stack application development and database migrations to containerization, DevSecOps pipelines, Terraform IaC, Helm orchestration, and end-to-end observability. Thank you, and I welcome any questions."*
