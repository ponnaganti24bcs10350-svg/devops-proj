from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class IncidentBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, description="Incident title")
    description: Optional[str] = Field(None, description="Detailed description of the incident")
    service_name: str = Field(..., min_length=2, max_length=100, description="Impacted microservice or component")
    severity: str = Field("MEDIUM", description="Severity: LOW, MEDIUM, HIGH, CRITICAL")
    status: str = Field("INVESTIGATING", description="Status: INVESTIGATING, IDENTIFIED, MONITORING, RESOLVED")
    assigned_to: str = Field("unassigned", max_length=100, description="Engineer or team handling incident")

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    service_name: Optional[str] = Field(None, min_length=2, max_length=100)
    severity: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None

class IncidentResponse(IncidentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ServiceResponse(BaseModel):
    id: int
    name: str
    environment: str
    status: str
    uptime_pct: float
    latency_ms: int
    updated_at: datetime

    class Config:
        from_attributes = True

class HealthCheckResponse(BaseModel):
    status: str
    database: str
    version: str
    service: str
    timestamp: datetime

class StatsResponse(BaseModel):
    total_incidents: int
    active_incidents: int
    resolved_incidents: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
