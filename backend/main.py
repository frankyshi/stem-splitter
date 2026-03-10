from fastapi import FastAPI

from .routes import upload, split, import_routes
from .paths import UPLOADS_DIR, STEMS_DIR
from .services.youtube_service import warn_ytdlp_nightly_if_configured


def create_app() -> FastAPI:
    """
    Application factory for the Stemsmith backend.

    This configures the FastAPI app, ensures required directories exist,
    and includes all API routes.
    """
    app = FastAPI(title="Stemsmith API")

    # Ensure required directories exist
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    STEMS_DIR.mkdir(parents=True, exist_ok=True)

    # If YTDLP_USE_NIGHTLY=true, warn when yt-dlp is not nightly/outdated
    warn_ytdlp_nightly_if_configured()

    # Include route modules
    app.include_router(upload.router, prefix="/api")
    app.include_router(split.router, prefix="/api")
    app.include_router(import_routes.router, prefix="/api")

    @app.get("/")
    async def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()

