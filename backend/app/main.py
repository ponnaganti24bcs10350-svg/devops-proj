from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.routes.health import router as health_router
from backend.app.routes.incidents import router as incidents_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="CloudPulse - Enterprise Cloud Infrastructure & Incident Response Platform",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    should_respect_env_var=False,
    should_instrument_requests_inprogress=True,
    excluded_handlers=["/metrics"],
    env_var_name="ENABLE_METRICS"
)
instrumentator.instrument(app).expose(app, endpoint="/metrics", include_in_schema=True)

app.include_router(health_router)
app.include_router(incidents_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to CloudPulse Operations Platform API",
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics"
    }
