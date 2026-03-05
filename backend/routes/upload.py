from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
import uuid

from ..main import UPLOADS_DIR


router = APIRouter(tags=["upload"])


@router.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """
    Accept an uploaded audio file and store it in the uploads directory.

    This is a placeholder implementation. The final version should:
    - Validate file type and size
    - Persist metadata (e.g., in a database)
    - Return a stable file_id for later processing
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_id = str(uuid.uuid4())
    upload_path = Path(UPLOADS_DIR) / f"{file_id}_{file.filename}"

    # Placeholder: naive save without validation
    with upload_path.open("wb") as buffer:
        buffer.write(await file.read())

    # TODO: Persist file metadata and mapping from file_id to file path

    return JSONResponse({"file_id": file_id, "filename": file.filename})

