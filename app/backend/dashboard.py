"""Backward-compatible proxy to the dashboard router."""

from app.backend.routers.dashboard import router  # noqa: F401

__all__ = ["router"]
