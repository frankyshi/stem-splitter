"""
Convert MP4 file to MP3 and save into uploads/ using the same file_id naming as YouTube import.
"""

from __future__ import annotations

import logging
import subprocess
import uuid
from pathlib import Path
from typing import Dict, Any

from fastapi import HTTPException

logger = logging.getLogger(__name__)


def convert_mp4_to_mp3(upload_path: Path, output_path: Path) -> int:
    """
    Run ffmpeg to extract audio from video (MP4, MOV, etc.) and write MP3 to output_path.
    Returns size of the written file in bytes.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(upload_path),
        "-vn",
        "-acodec",
        "libmp3lame",
        "-q:a",
        "2",
        str(output_path),
    ]

    try:
        completed = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
            timeout=300,
        )
    except subprocess.TimeoutExpired:
        logger.error("ffmpeg timed out for %s", upload_path)
        raise HTTPException(
            status_code=504,
            detail="Conversion timed out.",
        ) from None
    except FileNotFoundError:
        logger.error("ffmpeg not found")
        raise HTTPException(
            status_code=500,
            detail="ffmpeg is not installed. Install it to use video to mp3 (e.g. brew install ffmpeg).",
        ) from None

    if completed.returncode != 0:
        logger.error(
            "ffmpeg failed code=%s stderr=%s",
            completed.returncode,
            completed.stderr,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to convert video to mp3. Check that the file is a valid video.",
        )

    if not output_path.exists():
        raise HTTPException(
            status_code=500,
            detail="Conversion completed but output file was not created.",
        )

    return output_path.stat().st_size


def import_mp4_to_uploads(temp_mp4_path: Path, uploads_dir: Path) -> Dict[str, Any]:
    """
    Convert video (MP4, MOV, etc.) at temp_mp4_path to MP3 and store in uploads_dir.
    Returns same shape as YouTube import: file_id, original_filename, stored_filename, size_bytes.
    """
    file_id = str(uuid.uuid4())
    stored_filename = f"{file_id}_audio.mp3"
    output_path = Path(uploads_dir) / stored_filename

    size_bytes = convert_mp4_to_mp3(Path(temp_mp4_path), output_path)

    return {
        "file_id": file_id,
        "original_filename": "audio.mp3",
        "stored_filename": stored_filename,
        "size_bytes": size_bytes,
    }
