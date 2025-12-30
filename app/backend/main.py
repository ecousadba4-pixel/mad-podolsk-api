from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.backend.routers.dashboard import router as dashboard_router
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
    lifespan=lifespan,
)

# Подключаем роутер дашборда
app.include_router(dashboard_router, prefix="/api/dashboard")

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

# === Prometheus metrics ===
# ВАЖНО: вызывать ИМЕННО ЗДЕСЬ, а не в lifespan
Instrumentator().instrument(app).expose(
    app,
    endpoint="/metrics",
    include_in_schema=False,  # не светить /metrics в /docs
)


@app.get("/api/health")
def health():
    """Health check endpoint with DB connectivity status."""
    db_health = db.health_check()
    overall_status = "ok" if db_health.get("status") == "healthy" else "degraded"
    return {
        "status": overall_status,
        "database": db_health,
    }

