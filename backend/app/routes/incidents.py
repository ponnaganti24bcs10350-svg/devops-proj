from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models import Incident, ServiceCatalog
from backend.app.schemas import (
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
    ServiceResponse,
    StatsResponse
)

router = APIRouter(prefix="/api/v1", tags=["Incidents & Services"])

DEFAULT_SERVICES = [
    {"name": "api-gateway", "environment": "production", "status": "OPERATIONAL", "uptime_pct": 99.99, "latency_ms": 24},
    {"name": "auth-service", "environment": "production", "status": "OPERATIONAL", "uptime_pct": 99.95, "latency_ms": 38},
    {"name": "billing-pipeline", "environment": "production", "status": "OPERATIONAL", "uptime_pct": 99.92, "latency_ms": 65},
    {"name": "postgres-cluster", "environment": "production", "status": "OPERATIONAL", "uptime_pct": 99.99, "latency_ms": 12},
    {"name": "k8s-ingress-controller", "environment": "production", "status": "OPERATIONAL", "uptime_pct": 99.98, "latency_ms": 18},
]

@router.post(
    "/incidents",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new incident"
)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    incident = Incident(
        title=payload.title,
        description=payload.description,
        service_name=payload.service_name,
        severity=payload.severity.upper(),
        status=payload.status.upper(),
        assigned_to=payload.assigned_to,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        resolved_at=datetime.now(timezone.utc) if payload.status.upper() == "RESOLVED" else None
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

@router.get(
    "/incidents",
    response_model=List[IncidentResponse],
    status_code=status.HTTP_200_OK,
    summary="List all incidents with optional filters"
)
def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (INVESTIGATING, IDENTIFIED, MONITORING, RESOLVED)"),
    severity_filter: Optional[str] = Query(None, alias="severity", description="Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)"),
    service_name: Optional[str] = Query(None, description="Filter by affected microservice"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter.upper())
    if severity_filter:
        query = query.filter(Incident.severity == severity_filter.upper())
    if service_name:
        query = query.filter(Incident.service_name.ilike(f"%{service_name}%"))

    return query.order_by(Incident.created_at.desc()).offset(offset).limit(limit).all()

@router.get(
    "/incidents/{incident_id}",
    response_model=IncidentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single incident by ID"
)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found"
        )
    return incident

@router.put(
    "/incidents/{incident_id}",
    response_model=IncidentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update incident details or lifecycle status"
)
def update_incident(incident_id: int, payload: IncidentUpdate, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found"
        )

    if payload.title is not None:
        incident.title = payload.title
    if payload.description is not None:
        incident.description = payload.description
    if payload.service_name is not None:
        incident.service_name = payload.service_name
    if payload.severity is not None:
        incident.severity = payload.severity.upper()
    if payload.status is not None:
        new_status = payload.status.upper()
        incident.status = new_status
        if new_status == "RESOLVED":
            incident.resolved_at = datetime.now(timezone.utc)
        else:
            incident.resolved_at = None
    if payload.assigned_to is not None:
        incident.assigned_to = payload.assigned_to

    incident.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(incident)
    return incident

@router.delete(
    "/incidents/{incident_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete or archive an incident"
)
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found"
        )

    db.delete(incident)
    db.commit()
    return {"message": f"Incident {incident_id} successfully deleted", "id": incident_id}

@router.get(
    "/services",
    response_model=List[ServiceResponse],
    status_code=status.HTTP_200_OK,
    summary="List all monitored services"
)
def list_services(db: Session = Depends(get_db)):
    services = db.query(ServiceCatalog).all()
    if not services:
        for item in DEFAULT_SERVICES:
            s = ServiceCatalog(**item)
            db.add(s)
        db.commit()
        services = db.query(ServiceCatalog).all()
    return services

@router.get(
    "/stats",
    response_model=StatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated incident and reliability statistics"
)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Incident).count()
    active = db.query(Incident).filter(Incident.status != "RESOLVED").count()
    resolved = db.query(Incident).filter(Incident.status == "RESOLVED").count()
    critical = db.query(Incident).filter(Incident.severity == "CRITICAL", Incident.status != "RESOLVED").count()
    high = db.query(Incident).filter(Incident.severity == "HIGH", Incident.status != "RESOLVED").count()
    medium = db.query(Incident).filter(Incident.severity == "MEDIUM", Incident.status != "RESOLVED").count()
    low = db.query(Incident).filter(Incident.severity == "LOW", Incident.status != "RESOLVED").count()

    return StatsResponse(
        total_incidents=total,
        active_incidents=active,
        resolved_incidents=resolved,
        critical_count=critical,
        high_count=high,
        medium_count=medium,
        low_count=low
    )
