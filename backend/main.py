from fastapi import FastAPI

from .routes import upload, split
from .paths import UPLOADS_DIR, STEMS_DIR


def create_app() -> FastAPI:
    """
    Application factory for the Stem Splitter backend.

    This configures the FastAPI app, ensures required directories exist,
    and includes all API routes.
    """
    app = FastAPI(title="Stem Splitter API")

    # Ensure required directories exist
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    STEMS_DIR.mkdir(parents=True, exist_ok=True)

    # Include route modules
    app.include_router(upload.router, prefix="/api")
    app.include_router(split.router, prefix="/api")

    @app.get("/")
    async def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()

