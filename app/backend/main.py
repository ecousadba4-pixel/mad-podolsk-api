from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.backend.routers.dashboard import router as dashboard_router
from app.backend.routers.auth import router as auth_router
from app.backend.routers.prices import router as prices_router
from app.backend.routers.road_sections import router as road_sections_router
from app.backend.routers.resources import router as resources_router
from app.backend.routers.mileage import router as mileage_router
from app.backend import db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern lifespan context manager for startup/shutdown events."""
    # Startup
    dsn = os.environ.get("DB_DSN")
    if dsn:
        db.init_db(dsn)
    
    yield
    
    # Shutdown
    db.close_db()


app = FastAPI(
    title="SKPDI Dashboard Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# API v1 - фиксированный контракт
app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(prices_router, prefix="/api/v1/prices", tags=["prices"])
app.include_router(road_sections_router, prefix="/api/v1/road-sections", tags=["road-sections"])
app.include_router(resources_router, prefix="/api/v1/resources", tags=["resources"])
app.include_router(mileage_router, prefix="/api/v1/mileage", tags=["mileage"])

# CORS: читаем разрешённые origin'ы из переменной окружения ALLOWED_ORIGINS (comma-separated)
allowed = os.environ.get("ALLOWED_ORIGINS", "*")
if allowed and allowed != "":
    origins = [o.strip() for o in allowed.split(",")]
else:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    """Health check endpoint with DB connectivity status."""
    db_health = await db.health_check()
    
    overall_status = "ok" if db_health.get("status") == "healthy" else "degraded"
    
    return {
        "status": overall_status,
        "database": db_health,
    }

