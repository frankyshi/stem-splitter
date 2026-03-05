from __future__ import annotations

import logging
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Dict, List

from fastapi import HTTPException

logger = logging.getLogger(__name__)

SUPPORTED_STEMS = ("vocals", "drums", "bass", "other")


def split_to_stems(input_path: Path, output_dir: Path) -> List[Dict[str, str]]:
    """
    Run Demucs on the given audio file and materialize stems into ``output_dir``.

    This function:
    - Spawns the Demucs CLI via subprocess (no audio loaded into Python memory).
    - Uses the htdemucs model to generate 4 stems.
    - Copies the resulting stem WAVs into ``output_dir`` as:
      vocals.wav, drums.wav, bass.wav, other.wav
    - Returns a list of stem metadata dicts: { "name": ..., "filename": ... }.

    Raises HTTPException with a user-friendly message if Demucs is missing
    or the separation step fails.
    """
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="Input audio file not found")

    # Ensure a clean output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    for existing in output_dir.glob("*.wav"):
        try:
            existing.unlink()
        except OSError as exc:
            logger.warning("Failed to remove existing stem file %s: %s", existing, exc)

    temp_root = Path(tempfile.mkdtemp(prefix="demucs_out_"))
    logger.info("Running Demucs on %s with temp output root %s", input_path, temp_root)

    cmd = [
        sys.executable,
        "-m",
        "demucs",
        "-n",
        "htdemucs",
        "-o",
        str(temp_root),
        str(input_path),
    ]

    try:
        completed = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        shutil.rmtree(temp_root, ignore_errors=True)
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to invoke Python for Demucs. "
                "Ensure your backend virtualenv is active and run "
                "`pip install -r backend/requirements.txt`."
            ),
        )

    if completed.returncode != 0:
        logger.error(
            "Demucs process failed with code %s\nstdout:\n%s\nstderr:\n%s",
            completed.returncode,
            completed.stdout,
            completed.stderr,
        )
        shutil.rmtree(temp_root, ignore_errors=True)

        raise HTTPException(
            status_code=500,
            detail=(
                "Demucs failed to run. Please make sure it is installed by running "
                "`pip install -r backend/requirements.txt` in the backend directory."
            ),
        )

    try:
        model_root = temp_root / "htdemucs"
        if not model_root.exists():
            raise RuntimeError(f"Demucs output directory not found at {model_root}")

        track_dirs = [p for p in model_root.iterdir() if p.is_dir()]
        if not track_dirs:
            raise RuntimeError(f"No track output found under {model_root}")

        track_dir = track_dirs[0]
        logger.info("Using Demucs track output directory %s", track_dir)

        stems: List[Dict[str, str]] = []
        for stem_name in SUPPORTED_STEMS:
            source = track_dir / f"{stem_name}.wav"
            if not source.exists():
                raise RuntimeError(f"Expected stem file not found: {source}")

            target = output_dir / f"{stem_name}.wav"
            shutil.move(str(source), str(target))
            stems.append(
                {
                    "name": stem_name,
                    "filename": target.name,
                }
            )

        return stems

    except Exception as exc:
        logger.exception("Error while processing Demucs output: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to process Demucs output. See server logs for details.",
        ) from exc
    finally:
        shutil.rmtree(temp_root, ignore_errors=True)


