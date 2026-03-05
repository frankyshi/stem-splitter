from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
from typing import List, Dict

from ..paths import STEMS_DIR, UPLOADS_DIR
from ..services.demucs_service import split_to_stems


router = APIRouter(tags=["stems"])

SUPPORTED_STEMS = ("vocals", "drums", "bass", "other")


@router.post("/split/{file_id}")
async def split_track(file_id: str):
    """
    Trigger stem separation for a previously uploaded audio file
    using the Demucs model.
    """
    uploads_root = Path(UPLOADS_DIR)
    if not uploads_root.exists():
        raise HTTPException(status_code=404, detail="Uploads directory not found")

    # Locate the original upload by prefix "{file_id}_*"
    matches = [
        p
        for p in uploads_root.iterdir()
        if p.is_file() and p.name.startswith(f"{file_id}_")
    ]
    if not matches:
        raise HTTPException(status_code=404, detail="Uploaded file not found")

    source_path = matches[0]
    output_dir = Path(STEMS_DIR) / file_id

    # Perform real separation via Demucs
    stem_entries = split_to_stems(source_path, output_dir)

    # Preserve the existing response contract by attaching URLs here.
    stems_with_urls: List[Dict[str, str]] = []
    for stem in stem_entries:
        name = stem.get("name")
        stems_with_urls.append(
            {
                **stem,
                "url": f"/api/download/{file_id}?stem={name}",
            }
        )

    return JSONResponse({"file_id": file_id, "status": "done", "stems": stems_with_urls})


@router.get("/stems/{file_id}")
async def list_stems(file_id: str) -> dict:
    """
    List existing stems in STEMS_DIR/<file_id>/.

    Returns the normalized stems array with URLs for playback/download.
    """
    stems_root = Path(STEMS_DIR) / file_id
    if not stems_root.exists():
        raise HTTPException(status_code=404, detail="Stems not found")

    stems: List[Dict[str, str]] = []
    for stem_name in SUPPORTED_STEMS:
        stem_path = stems_root / f"{stem_name}.wav"
        if stem_path.is_file():
            stems.append(
                {
                    "name": stem_name,
                    "filename": stem_path.name,
                    "url": f"/api/download/{file_id}?stem={stem_name}",
                }
            )

    return {"file_id": file_id, "stems": stems}


@router.get("/download/{file_id}")
async def download_stem(file_id: str, stem: str):
    """
    Download a specific stem file.
    """
    if stem not in SUPPORTED_STEMS:
        raise HTTPException(status_code=400, detail="Invalid stem name")

    stem_path = Path(STEMS_DIR) / file_id / f"{stem}.wav"
    if not stem_path.exists():
        raise HTTPException(status_code=404, detail="Stem not found")

    return FileResponse(
        stem_path,
        media_type="audio/wav",
        filename=f"{file_id}_{stem}.wav",
    )

