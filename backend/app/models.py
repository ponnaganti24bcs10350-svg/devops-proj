from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from backend.app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    service_name = Column(String(100), nullable=False, index=True)
    severity = Column(String(50), nullable=False, default="MEDIUM", index=True)
    status = Column(String(50), nullable=False, default="INVESTIGATING", index=True)
    assigned_to = Column(String(100), nullable=False, default="unassigned")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

class ServiceCatalog(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    environment = Column(String(50), nullable=False, default="production")
    status = Column(String(50), nullable=False, default="OPERATIONAL")
    uptime_pct = Column(Float, nullable=False, default=99.99)
    latency_ms = Column(Integer, nullable=False, default=35)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
