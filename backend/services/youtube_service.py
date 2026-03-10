"""
YouTube import service: validate URL, download audio via yt-dlp, convert to MP3 with ffmpeg,
and save into uploads/ using the same file_id naming convention as the upload flow.
"""

from __future__ import annotations

import logging
import os
import re
import subprocess
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Accept standard YouTube URL patterns; reject non-YouTube
YOUTUBE_URL_PATTERN = re.compile(
    r"^https?://(?:www\.)?(?:youtube\.com/(?:watch\?v=|shorts/)|youtu\.be/)[\w-]+"
)


def is_valid_youtube_url(url: str) -> bool:
    """Return True if the URL is a supported YouTube watch/shorts URL."""
    if not url or not isinstance(url, str):
        return False
    return bool(YOUTUBE_URL_PATTERN.match(url.strip()))


def _env_flag(name: str, default: bool = False) -> bool:
    """
    Parse a boolean-ish environment variable.

    Accepted truthy values: 1, true, yes, on (case-insensitive).
    """
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def _tail_lines(text: str, max_lines: int) -> str:
    """Return the last ``max_lines`` lines of ``text`` as a single string."""
    if not text:
        return ""
    lines = text.splitlines()
    return "\n".join(lines[-max_lines:])


def _classify_yt_dlp_error(stdout: str, stderr: str) -> Optional[str]:
    """
    Inspect yt-dlp output and return a short error category string.

    Categories:
    - forbidden
    - embed_restricted
    - age_restricted
    - private_unavailable
    - generic (fallback)
    """
    combined = f"{stdout}\n{stderr}".lower()

    if "http error 403" in combined or "forbidden" in combined:
        return "forbidden"

    if "error code: 152 - 18" in combined or "watch video on youtube" in combined:
        return "embed_restricted"

    if "sign in to confirm your age" in combined or "age-restricted" in combined:
        return "age_restricted"

    if "private video" in combined or "this video is private" in combined:
        return "private_unavailable"

    if "video unavailable" in combined or "this video is unavailable" in combined:
        return "private_unavailable"

    return "generic"


def _run_yt_dlp_with_strategies(url: str, output_path: Path) -> int:
    """
    Run yt-dlp with a sequence of strategies and return the size of the output file.

    Fallback order:
    1. default client
    2. web_safari client
    3. web_embedded client (may fail for embedding-restricted videos)
    4. default client + cookies-from-browser (if YTDLP_COOKIES_FROM_BROWSER is set)

    This avoids hard-coding a single fragile player client while still giving us
    options when YouTube changes behavior.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    debug_enabled = _env_flag("YTDLP_DEBUG", default=False)
    cookies_browser = os.getenv("YTDLP_COOKIES_FROM_BROWSER")

    base_cmd_prefix = [
        "yt-dlp",
        "--no-playlist",
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "0",
    ]

    strategies: List[Dict[str, Any]] = [
        {"name": "default", "extra_args": []},
        {
            "name": "web_safari",
            "extra_args": [
                "--extractor-args",
                "youtube:player_client=web_safari",
            ],
        },
        {
            "name": "web_embedded",
            "extra_args": [
                "--extractor-args",
                "youtube:player_client=web_embedded",
            ],
            # Note: web_embedded can fail for videos with embedding disabled.
        },
    ]

    if cookies_browser:
        strategies.append(
            {
                "name": "default+cookies",
                "extra_args": [
                    "--cookies-from-browser",
                    cookies_browser,
                ],
            }
        )

    attempts: List[Dict[str, Any]] = []

    for strategy in strategies:
        name = strategy["name"]

        # Skip the cookies strategy entirely if env is not configured.
        if name == "default+cookies" and not cookies_browser:
            continue

        cmd = [
            *base_cmd_prefix,
            *strategy["extra_args"],
            "-o",
            str(output_path),
            url.strip(),
        ]

        logger.info("[yt] attempt=%s", name)

        try:
            completed = subprocess.run(
                cmd,
                check=False,
                capture_output=True,
                text=True,
                timeout=600,
            )
        except subprocess.TimeoutExpired:
            logger.error("yt-dlp timed out for url=%s attempt=%s", url, name)
            raise HTTPException(
                status_code=504,
                detail="Download timed out. Try a shorter video or check your connection.",
            ) from None
        except FileNotFoundError:
            logger.error("yt-dlp not found on PATH")
            raise HTTPException(
                status_code=500,
                detail=(
                    "yt-dlp is not installed. Install it to use YouTube import "
                    "(e.g. brew install yt-dlp)."
                ),
            ) from None

        stdout = completed.stdout or ""
        stderr = completed.stderr or ""
        stderr_tail = _tail_lines(stderr, max_lines=8)

        category = None
        if completed.returncode != 0:
            category = _classify_yt_dlp_error(stdout, stderr)

        attempts.append(
            {
                "strategy": name,
                "returncode": completed.returncode,
                "category": category,
            }
        )

        if debug_enabled:
            logger.error(
                "[yt] attempt=%s rc=%s stdout=%s stderr=%s",
                name,
                completed.returncode,
                stdout,
                stderr,
            )
        else:
            logger.warning(
                "[yt] attempt=%s rc=%s stderr_tail=%s",
                name,
                completed.returncode,
                stderr_tail,
            )

        if completed.returncode == 0 and output_path.exists():
            size_bytes = output_path.stat().st_size
            logger.info(
                "[yt] attempt=%s succeeded size_bytes=%s", name, size_bytes
            )
            return size_bytes

    # All strategies failed
    last_category: Optional[str] = None
    for attempt in attempts:
        if attempt["category"]:
            last_category = attempt["category"]

    # Map error category to user-facing message.
    if last_category == "forbidden":
        user_message = "YouTube blocked the download request for this video."
    elif last_category == "embed_restricted":
        user_message = (
            "This video cannot be accessed through YouTube’s embedded player. "
            "Try another public video or browser-cookie fallback."
        )
    elif last_category == "age_restricted":
        user_message = "This video requires a signed-in YouTube session."
    elif last_category == "private_unavailable":
        user_message = "This video is private or unavailable."
    else:
        user_message = "Failed to download audio from YouTube."

    # Short debug summary of attempts; kept compact for production logs/clients.
    debug_summary_parts: List[str] = []
    for attempt in attempts:
        debug_summary_parts.append(
            f"{attempt['strategy']}: rc={attempt['returncode']}, "
            f"cat={attempt['category'] or 'unknown'}"
        )
    debug_summary = " | ".join(debug_summary_parts)

    logger.error(
        "[yt] all attempts failed url=%s category=%s attempts=%s",
        url,
        last_category or "unknown",
        debug_summary,
    )

    raise HTTPException(
        status_code=502,
        detail=f"{user_message} (debug: {debug_summary})",
    )


def download_youtube_audio_as_mp3(url: str, output_path: Path) -> int:
    """
    Download audio from a YouTube URL and write an MP3 file to output_path.

    Uses yt-dlp with multiple fallback strategies and ffmpeg for extraction/
    conversion. Assumes ffmpeg is installed on the system.

    Returns the size of the written file in bytes.
    Raises HTTPException on validation or subprocess failure.
    """
    if not is_valid_youtube_url(url):
        raise HTTPException(
            status_code=400,
            detail="Invalid or non-YouTube URL. Only YouTube watch and shorts URLs are supported.",
        )

    return _run_yt_dlp_with_strategies(url, Path(output_path))


def import_youtube_to_uploads(url: str, uploads_dir: Path) -> Dict[str, Any]:
    """
    Import audio from a YouTube URL into the uploads directory.

    - Validates the URL
    - Creates a file_id and stored filename (file_id_audio.mp3)
    - Downloads and converts to MP3, saves to uploads_dir
    - Returns metadata compatible with the upload response so the frontend
      can pass file_id into the existing split flow.

    Returns dict with: file_id, original_filename, stored_filename, size_bytes.
    """
    if not is_valid_youtube_url(url):
        raise HTTPException(
            status_code=400,
            detail="Invalid or non-YouTube URL. Only YouTube watch and shorts URLs are supported.",
        )

    file_id = str(uuid.uuid4())
    stored_filename = f"{file_id}_audio.mp3"
    upload_path = Path(uploads_dir) / stored_filename

    size_bytes = download_youtube_audio_as_mp3(url, upload_path)

    return {
        "file_id": file_id,
        "original_filename": "audio.mp3",
        "stored_filename": stored_filename,
        "size_bytes": size_bytes,
    }
