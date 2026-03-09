from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import uuid

from ..paths import UPLOADS_DIR


router = APIRouter(tags=["upload"])


@router.get("/download-original/{file_id}")
async def download_original(file_id: str):
    """
    Serve the original uploaded/imported audio file (e.g. mp3) for preview and download.
    Content-Disposition: attachment so the "Download mp3" link triggers a download.
    """
    uploads_root = Path(UPLOADS_DIR)
    if not uploads_root.exists():
        raise HTTPException(status_code=404, detail="Uploads directory not found")
    matches = [
        p
        for p in uploads_root.iterdir()
        if p.is_file() and p.name.startswith(f"{file_id}_")
    ]
    if not matches:
        raise HTTPException(status_code=404, detail="File not found")
    path = matches[0]
    return FileResponse(
        path,
        media_type="audio/mpeg",
        filename=path.name,
        headers={"Content-Disposition": f'attachment; filename="{path.name}"'},
    )


@router.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """
    Accept an uploaded audio file and store it in the uploads directory.

    Returns a JSON payload describing the stored file so the frontend
    can reference it for further processing.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_id = str(uuid.uuid4())
    stored_filename = f"{file_id}_{file.filename}"
    upload_path = Path(UPLOADS_DIR) / stored_filename

    # Naive save without validation
    contents = await file.read()
    size_bytes = len(contents)
    with upload_path.open("wb") as buffer:
        buffer.write(contents)

    payload = {
        "file_id": file_id,
        "original_filename": file.filename,
        "stored_filename": stored_filename,
        "size_bytes": size_bytes,
        "content_type": file.content_type or "application/octet-stream",
    }

    return JSONResponse(payload)

