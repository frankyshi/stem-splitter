import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..paths import UPLOADS_DIR
from ..services.youtube_service import import_youtube_to_uploads

logger = logging.getLogger(__name__)
router = APIRouter(tags=["import"])


class YouTubeImportRequest(BaseModel):
    """Request body for YouTube URL import."""

    url: str


@router.post("/import/youtube")
async def import_youtube(request: YouTubeImportRequest):
    """
    Import audio from a YouTube URL: download and convert to MP3, store in uploads/.

    Returns file_id, metadata, and audio_url for preview/download. Frontend then calls
    split when the user clicks "Split to stems".
    """
    result = import_youtube_to_uploads(request.url.strip(), UPLOADS_DIR)
    result["audio_url"] = f"/api/download-original/{result['file_id']}"
    result["download_url"] = f"/api/download-original/{result['file_id']}"
    result["filename"] = result.get("stored_filename") or result.get("original_filename") or "audio.mp3"
    result["status"] = "ready"
    logger.info("YouTube import success: file_id=%s filename=%s", result["file_id"], result["filename"])
    return JSONResponse(result)
