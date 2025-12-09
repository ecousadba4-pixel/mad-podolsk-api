from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.backend.routers.dashboard import router as dashboard_router
from app.backend import db
from prometheus_fastapi_instrumentator import Instrumentator
import os

app = FastAPI(title="SKPDI Dashboard Backend")

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
# ВАЖНО: вызывать ИМЕННО ЗДЕСЬ, а не в startup_event
Instrumentator().instrument(app).expose(
    app,
    endpoint="/metrics",
    include_in_schema=False,  # не светить /metrics в /docs
)


@app.on_event("startup")
def startup_event():
    dsn = os.environ.get("DB_DSN")
    if dsn:
        db.init_db(dsn)


@app.on_event("shutdown")
def shutdown_event():
    db.close_db()


@app.get("/api/health")
def health():
    return {"status": "ok"}

