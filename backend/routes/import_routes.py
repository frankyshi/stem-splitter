import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..paths import UPLOADS_DIR
from ..services.youtube_service import import_youtube_to_uploads, diagnose_youtube_url
from ..services.mp4_service import import_mp4_to_uploads as convert_mp4_to_uploads

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


@router.get("/import/youtube/diagnose")
async def youtube_import_diagnose(url: str = ""):
    """
    Local debugging only: run the same YouTube download strategies without persisting
    a file. Returns which attempts were tried, how each failed, and final classification.
    Query param: url (YouTube watch/shorts URL).
    """
    if not url.strip():
        return JSONResponse(
            status_code=400,
            content={"error": "missing_url", "message": "Query param 'url' is required."},
        )
    result = diagnose_youtube_url(url.strip())
    return JSONResponse(result)


@router.post("/import/mp4")
async def import_mp4(file: UploadFile = File(...)):
    """
    Upload an MP4, M4A, or MOV file, convert to MP3, store in uploads/.
    Returns same shape as YouTube import for consistent frontend result UI.
    """
    if not file.filename or not file.filename.lower().endswith((".mp4", ".m4a", ".mov")):
        raise HTTPException(status_code=400, detail="Please upload an MP4, M4A, or MOV file.")
    contents = await file.read()
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename).suffix.lower() or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, dir=UPLOADS_DIR, suffix=suffix) as tmp:
        tmp.write(contents)
        temp_path = Path(tmp.name)
    try:
        result = convert_mp4_to_uploads(temp_path, UPLOADS_DIR)
    finally:
        temp_path.unlink(missing_ok=True)
    result["audio_url"] = f"/api/download-original/{result['file_id']}"
    result["download_url"] = f"/api/download-original/{result['file_id']}"
    result["filename"] = result.get("stored_filename") or result.get("original_filename") or "audio.mp3"
    result["status"] = "ready"
    logger.info("MP4 import success: file_id=%s", result["file_id"])
    return JSONResponse(result)
