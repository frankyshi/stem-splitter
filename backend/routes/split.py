from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
from typing import List, Dict
import shutil

from ..paths import STEMS_DIR, UPLOADS_DIR


router = APIRouter(tags=["stems"])

SUPPORTED_STEMS = ("vocals", "drums", "bass", "other")


def _build_stem_metadata(file_id: str) -> List[Dict[str, str]]:
    """
    Helper to build the normalized stem metadata structure.
    """
    stems: List[Dict[str, str]] = []
    for stem_name in SUPPORTED_STEMS:
        stems.append(
            {
                "name": stem_name,
                "filename": f"{stem_name}.wav",
                "url": f"/api/download/{file_id}?stem={stem_name}",
            }
        )
    return stems


@router.post("/split/{file_id}")
async def split_track(file_id: str):
    """
    Trigger stem separation for a previously uploaded audio file.

    Stub implementation (no Demucs yet):
    - Finds the uploaded file by file_id prefix.
    - Creates STEMS_DIR/<file_id>/.
    - Copies the original audio into 4 placeholder stem files.
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
    output_dir.mkdir(parents=True, exist_ok=True)

    # Create placeholder stems by copying the original file
    for stem_name in SUPPORTED_STEMS:
        target_path = output_dir / f"{stem_name}.wav"
        shutil.copyfile(source_path, target_path)

    stems = _build_stem_metadata(file_id)

    return JSONResponse({"file_id": file_id, "status": "done", "stems": stems})


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

