from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
from typing import List

from ..main import STEMS_DIR
from ..services.demucs_service import split_into_stems


router = APIRouter(tags=["stems"])


@router.post("/split/{file_id}")
async def split_track(file_id: str):
    """
    Trigger stem separation for a previously uploaded audio file.

    This is a placeholder implementation. The final version should:
    - Resolve file_id to the original uploaded file
    - Run the Demucs model asynchronously
    - Track and expose processing status
    """
    # TODO: Resolve file path from file_id and pass to Demucs
    fake_input_path = Path("uploads") / f"{file_id}.wav"
    output_dir = Path(STEMS_DIR) / file_id

    # Placeholder call into Demucs integration layer
    stems = split_into_stems(input_path=fake_input_path, output_dir=output_dir)

    return JSONResponse({"file_id": file_id, "stems": stems})


@router.get("/stems/{file_id}")
async def list_stems(file_id: str) -> dict:
    """
    List available stems for a given file_id.

    The final implementation should:
    - Inspect the stems directory for the given file_id
    - Optionally return URLs, durations, and waveform metadata
    """
    stems_root = Path(STEMS_DIR) / file_id
    if not stems_root.exists():
        raise HTTPException(status_code=404, detail="Stems not found")

    files: List[str] = [p.name for p in stems_root.iterdir() if p.is_file()]

    return {"file_id": file_id, "stems": files}


@router.get("/download/{file_id}")
async def download_stem(file_id: str, stem_name: str):
    """
    Download a specific stem file.

    This is a placeholder endpoint. The final version should:
    - Return the actual audio file as a StreamingResponse or FileResponse
    - Validate stem_name to prevent path traversal
    """
    # TODO: Implement actual file download response
    return JSONResponse(
        {
            "message": "Download endpoint is a placeholder.",
            "file_id": file_id,
            "stem_name": stem_name,
        }
    )

