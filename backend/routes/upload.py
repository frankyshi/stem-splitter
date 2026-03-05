from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
import uuid

from ..paths import UPLOADS_DIR


router = APIRouter(tags=["upload"])


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

