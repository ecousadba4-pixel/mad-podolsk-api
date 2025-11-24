from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.backend.dashboard import router as dashboard_router
from app.backend import db
import os

app = FastAPI(title="SKPDI Dashboard Backend")

app.include_router(dashboard_router, prefix="/api/dashboard")

# CORS: читать разрешённые origin'ы из переменной окружения ALLOWED_ORIGINS (comma-separated)
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
