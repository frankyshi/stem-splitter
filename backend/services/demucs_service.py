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

    returncode = completed.returncode
    logger.info("Demucs process finished returncode=%s", returncode)

    # Success is determined only by return code and presence of stem files, not stderr.
    # TorchCodec/torchaudio warnings on stderr are ignored when returncode is 0.
    if returncode != 0:
        logger.error(
            "Demucs process failed with code %s\nstdout:\n%s\nstderr:\n%s",
            returncode,
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

    if returncode == 0:
        logger.info(
            "Demucs exited 0 (stderr warnings e.g. TorchCodec are ignored for success)"
        )

    try:
        model_root = temp_root / "htdemucs"
        logger.info("Resolved Demucs output base: %s", model_root)

        if not model_root.exists():
            logger.error(
                "Demucs completed but output directory missing: checked %s",
                model_root,
            )
            shutil.rmtree(temp_root, ignore_errors=True)
            raise HTTPException(
                status_code=500,
                detail="Demucs completed, but no output stem files were found.",
            )

        # Demucs writes either htdemucs/<track_name>/{vocals,drums,bass,other}.wav
        # or (older/some configs) stems directly under htdemucs/
        if (model_root / "vocals.wav").exists():
            track_dir = model_root
        else:
            track_dirs = [p for p in model_root.iterdir() if p.is_dir()]
            if not track_dirs:
                logger.error(
                    "Demucs completed but no track subdir under %s; contents: %s",
                    model_root,
                    list(model_root.iterdir()) if model_root.exists() else "n/a",
                )
                shutil.rmtree(temp_root, ignore_errors=True)
                raise HTTPException(
                    status_code=500,
                    detail="Demucs completed, but no output stem files were found.",
                )
            track_dir = track_dirs[0]

        logger.info("Demucs track directory: %s", track_dir)

        # Log which stem files we found before moving
        found = [track_dir / f"{s}.wav" for s in SUPPORTED_STEMS if (track_dir / f"{s}.wav").exists()]
        missing = [f"{s}.wav" for s in SUPPORTED_STEMS if not (track_dir / f"{s}.wav").exists()]
        logger.info("Discovered stem files in %s: %s", track_dir, [p.name for p in found])
        if missing:
            logger.error(
                "Demucs completed but stem files missing in %s: %s",
                track_dir,
                missing,
            )
            shutil.rmtree(temp_root, ignore_errors=True)
            raise HTTPException(
                status_code=500,
                detail="Demucs completed, but no output stem files were found.",
            )

        stems: List[Dict[str, str]] = []
        for stem_name in SUPPORTED_STEMS:
            source = track_dir / f"{stem_name}.wav"
            target = output_dir / f"{stem_name}.wav"
            shutil.move(str(source), str(target))
            stems.append(
                {
                    "name": stem_name,
                    "filename": target.name,
                }
            )

        logger.info("Stems moved to app output dir: %s", output_dir)
        return stems

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error while processing Demucs output: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to process Demucs output. See server logs for details.",
        ) from exc
    finally:
        shutil.rmtree(temp_root, ignore_errors=True)


