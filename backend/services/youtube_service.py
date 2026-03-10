"""
YouTube import service: validate URL, download audio via yt-dlp, convert to MP3 with ffmpeg,
and save into uploads/ using the same file_id naming convention as the upload flow.

YouTube often requires cookies and/or attestation (PO Token / SABR). Client-selection alone
is not a universal fix: we try multiple strategies (default, then cookies, then alternate
clients with/without cookies) and classify failures for clear user feedback.
Optional PO Token provider integration (e.g. external attestation) could be added later
via env or config hooks if yt-dlp supports it.
"""

from __future__ import annotations

import logging
import os
import re
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Accept standard YouTube URL patterns; reject non-YouTube
YOUTUBE_URL_PATTERN = re.compile(
    r"^https?://(?:www\.)?(?:youtube\.com/(?:watch\?v=|shorts/)|youtu\.be/)[\w-]+"
)

# Error categories returned by _classify_yt_dlp_error (internal) and in diagnostic output.
USER_MESSAGES: Dict[str, str] = {
    "forbidden_403": "YouTube blocked the download request for this video.",
    "embed_restricted_152_18": "This video cannot be accessed through YouTube's embedded player.",
    "reload_required": "YouTube rejected this playback session and asked for a page reload.",
    "age_or_login_required": "This video requires a signed-in YouTube session.",
    "private_or_unavailable": "This video is private or unavailable.",
    "po_token_missing_or_attestation": "This video currently requires additional YouTube attestation/session data.",
    "cookie_extraction_failed": "Browser cookie access failed for the configured browser.",
    "unknown": "Failed to download audio from YouTube.",
}


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
    """Return the last max_lines lines of text as a single string."""
    if not text:
        return ""
    lines = text.splitlines()
    return "\n".join(lines[-max_lines:])


def _classify_yt_dlp_error(stdout: str, stderr: str) -> str:
    """
    Inspect yt-dlp stdout/stderr and return a stable category for user messaging and diagnostics.
    Order of checks matters: more specific patterns before generic ones.
    """
    combined = f"{stdout}\n{stderr}"
    lower = combined.lower()

    if "http error 403" in lower or "403: forbidden" in lower:
        return "forbidden_403"

    if "error code: 152 - 18" in lower or "watch video on youtube" in lower:
        return "embed_restricted_152_18"

    if "the page needs to be reloaded" in lower:
        return "reload_required"

    if "sign in to confirm your age" in lower or "age-restricted" in lower:
        return "age_or_login_required"

    if "private video" in lower or "this video is private" in lower:
        return "private_or_unavailable"
    if "video unavailable" in lower or "this video is unavailable" in lower:
        return "private_or_unavailable"

    if "po token" in lower or "sabr" in lower:
        return "po_token_missing_or_attestation"

    # Cookie extraction / browser access failure (e.g. macOS Safari permissions)
    if "cookie" in lower and (
        "unable to extract" in lower or "could not find" in lower
        or "failed" in lower or "error" in lower or "permission" in lower
    ):
        return "cookie_extraction_failed"

    return "unknown"


def _get_user_message(category: str) -> str:
    """Return the user-facing message for a given classification category."""
    return USER_MESSAGES.get(category, USER_MESSAGES["unknown"])


def _run_single_attempt(
    url: str,
    output_path: Path,
    extra_args: List[str],
    timeout: int = 600,
) -> Tuple[int, str, str]:
    """
    Run yt-dlp once with the given extra args. Returns (returncode, stdout, stderr).
    Raises subprocess.TimeoutExpired or FileNotFoundError on timeout or missing yt-dlp.
    """
    base = [
        "yt-dlp",
        "--no-playlist",
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "0",
    ]
    cmd = [*base, *extra_args, "-o", str(output_path), url.strip()]
    completed = subprocess.run(
        cmd,
        check=False,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return completed.returncode, completed.stdout or "", completed.stderr or ""


def _build_strategies(cookies_browser: Optional[str]) -> List[Dict[str, Any]]:
    """
    Build strategy list in order: a) default, b) default+cookies, c) web_safari,
    d) web_safari+cookies, e) web_embedded, f) web_embedded+cookies.
    Cookie-based strategies are only included when cookies_browser is set.
    log_name includes the browser for cookie attempts, e.g. default+cookies(chrome).
    """
    cookie_args = (
        ["--cookies-from-browser", cookies_browser]
        if cookies_browser
        else []
    )
    def log_name(base: str) -> str:
        if cookies_browser and "cookies" in base:
            return f"{base}({cookies_browser})"
        return base

    strategies: List[Dict[str, Any]] = [
        {"name": "default", "log_name": "default", "extra_args": []},
    ]
    if cookies_browser:
        strategies.append({
            "name": "default+cookies",
            "log_name": log_name("default+cookies"),
            "extra_args": cookie_args.copy(),
        })
    strategies.extend([
        {
            "name": "web_safari",
            "log_name": "web_safari",
            "extra_args": [
                "--extractor-args",
                "youtube:player_client=web_safari",
            ],
        },
    ])
    if cookies_browser:
        strategies.append({
            "name": "web_safari+cookies",
            "log_name": log_name("web_safari+cookies"),
            "extra_args": [
                "--extractor-args",
                "youtube:player_client=web_safari",
                "--cookies-from-browser",
                cookies_browser,
            ],
        })
    # web_embedded often fails for videos with embedding disabled (e.g. Error 152 - 18).
    strategies.append({
        "name": "web_embedded",
        "log_name": "web_embedded",
        "extra_args": [
            "--extractor-args",
            "youtube:player_client=web_embedded",
        ],
    })
    if cookies_browser:
        strategies.append({
            "name": "web_embedded+cookies",
            "log_name": log_name("web_embedded+cookies"),
            "extra_args": [
                "--extractor-args",
                "youtube:player_client=web_embedded",
                "--cookies-from-browser",
                cookies_browser,
            ],
        })
    return strategies


def _run_yt_dlp_with_strategies(url: str, output_path: Path) -> int:
    """
    Run yt-dlp with strategies A–F in order. On first success, return output file size.
    On total failure, classify from last attempt and raise HTTPException with user message
    and debug detail.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    debug_enabled = _env_flag("YTDLP_DEBUG", default=False)
    cookies_browser = (os.getenv("YTDLP_COOKIES_FROM_BROWSER") or "").strip() or None

    strategies = _build_strategies(cookies_browser)
    attempts: List[Dict[str, Any]] = []

    for strategy in strategies:
        name = strategy["name"]
        log_name = strategy.get("log_name", name)
        cmd_preview = "yt-dlp ... " + " ".join(strategy["extra_args"]) + " -o <path> " + url.strip()[:50] + "..."
        if debug_enabled:
            logger.info("[yt] attempt=%s cmd=%s", log_name, cmd_preview)
        else:
            logger.info("[yt] attempt=%s", log_name)

        try:
            rc, stdout, stderr = _run_single_attempt(
                url, output_path, strategy["extra_args"]
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

        stderr_tail = _tail_lines(stderr, max_lines=8)
        category = _classify_yt_dlp_error(stdout, stderr) if rc != 0 else None

        attempts.append({
            "strategy": name,
            "log_name": log_name,
            "returncode": rc,
            "category": category,
            "stderr_tail": stderr_tail,
        })

        if debug_enabled:
            logger.info(
                "[yt] attempt=%s rc=%s stdout=%s stderr=%s",
                log_name, rc, stdout, stderr,
            )
        else:
            logger.info(
                "[yt] attempt=%s rc=%s classification=%s stderr_tail=%s",
                log_name, rc, category or "ok", stderr_tail,
            )

        if rc == 0 and output_path.exists():
            size_bytes = output_path.stat().st_size
            logger.info("[yt] attempt=%s succeeded size_bytes=%s", log_name, size_bytes)
            return size_bytes

    # All failed: use last non-None category for user message
    last_category = "unknown"
    for a in reversed(attempts):
        if a.get("category"):
            last_category = a["category"]
            break

    user_message = _get_user_message(last_category)
    debug_summary = " | ".join(
        f"{a.get('log_name', a['strategy'])}: rc={a['returncode']}, cat={a.get('category') or 'n/a'}"
        for a in attempts
    )
    if cookies_browser:
        debug_summary += " | cookies_attempted=true"
    else:
        debug_summary += " | cookies_attempted=false"

    logger.error(
        "[yt] all attempts failed url=%s category=%s attempts=%s",
        url, last_category, debug_summary,
    )
    raise HTTPException(
        status_code=502,
        detail=f"{user_message} (debug: {debug_summary})",
    )


def download_youtube_audio_as_mp3(url: str, output_path: Path) -> int:
    """
    Download audio from a YouTube URL and write an MP3 file to output_path.
    Uses yt-dlp with multiple fallback strategies; assumes ffmpeg is installed.
    Returns the size of the written file in bytes.
    Raises HTTPException on validation or subprocess failure.
    """
    if not is_valid_youtube_url(url):
        raise HTTPException(
            status_code=400,
            detail="Invalid or non-YouTube URL. Only YouTube watch and shorts URLs are supported.",
        )
    return _run_yt_dlp_with_strategies(url, Path(output_path))


def diagnose_youtube_url(url: str) -> Dict[str, Any]:
    """
    Run a dry diagnostic: try the same strategy order as import but do not raise.
    Writes to a temp file and deletes it. For local debugging only.
    Returns: attempted strategies, per-attempt rc/category/stderr_tail, final classification,
    user_message, and debug_summary.
    """
    if not is_valid_youtube_url(url):
        return {
            "ok": False,
            "error": "invalid_url",
            "message": "Invalid or non-YouTube URL.",
            "attempts": [],
            "final_classification": None,
            "user_message": None,
            "debug_summary": None,
        }

    cookies_browser = (os.getenv("YTDLP_COOKIES_FROM_BROWSER") or "").strip() or None
    strategies = _build_strategies(cookies_browser)
    attempts: List[Dict[str, Any]] = []

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        temp_path = Path(f.name)
    try:
        for strategy in strategies:
            name = strategy["name"]
            try:
                rc, stdout, stderr = _run_single_attempt(
                    url, temp_path, strategy["extra_args"]
                )
            except subprocess.TimeoutExpired:
                attempts.append({
                    "strategy": name,
                    "returncode": -1,
                    "classification": "timeout",
                    "stderr_tail": "Download timed out.",
                })
                continue
            except FileNotFoundError:
                attempts.append({
                    "strategy": name,
                    "returncode": -1,
                    "classification": "yt_dlp_not_found",
                    "stderr_tail": "yt-dlp not found on PATH.",
                })
                continue

            stderr_tail = _tail_lines(stderr, max_lines=12)
            category = _classify_yt_dlp_error(stdout, stderr) if rc != 0 else None
            attempts.append({
                "strategy": name,
                "returncode": rc,
                "classification": category,
                "stderr_tail": stderr_tail,
            })
            if rc == 0 and temp_path.exists():
                return {
                    "ok": True,
                    "message": "Download succeeded.",
                    "attempts": attempts,
                    "succeeded_at": name,
                    "final_classification": None,
                    "user_message": None,
                    "debug_summary": f"{name}: rc=0",
                }
    finally:
        temp_path.unlink(missing_ok=True)

    last_category = "unknown"
    for a in reversed(attempts):
        if a.get("classification"):
            last_category = a["classification"]
            break

    debug_summary = " | ".join(
        f"{a['strategy']}: rc={a['returncode']}, cat={a.get('classification') or 'n/a'}"
        for a in attempts
    )
    return {
        "ok": False,
        "error": "all_attempts_failed",
        "message": "All download attempts failed.",
        "attempts": attempts,
        "final_classification": last_category,
        "user_message": _get_user_message(last_category),
        "debug_summary": debug_summary,
    }


def warn_ytdlp_nightly_if_configured() -> None:
    """
    If YTDLP_USE_NIGHTLY is true, check whether yt-dlp looks like a nightly build
    and log a warning if not. Does not install or modify anything.
    """
    if not _env_flag("YTDLP_USE_NIGHTLY", default=False):
        return
    try:
        result = subprocess.run(
            ["yt-dlp", "--version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        version_str = (result.stdout or result.stderr or "").strip().lower()
        if "nightly" in version_str or "2025" in version_str:
            logger.info("[yt] YTDLP_USE_NIGHTLY=true, yt-dlp version looks recent: %s", version_str[:80])
        else:
            logger.warning(
                "[yt] YTDLP_USE_NIGHTLY=true but yt-dlp does not appear to be nightly or recent. "
                "Consider: pip install -U yt-dlp or use a nightly build. Version: %s",
                version_str[:80] or "unknown",
            )
    except FileNotFoundError:
        logger.warning("[yt] YTDLP_USE_NIGHTLY=true but yt-dlp was not found on PATH.")
    except Exception as e:
        logger.warning("[yt] YTDLP_USE_NIGHTLY check failed: %s", e)


def import_youtube_to_uploads(url: str, uploads_dir: Path) -> Dict[str, Any]:
    """
    Import audio from a YouTube URL into the uploads directory.
    Validates URL, creates file_id and stored filename, downloads/converts to MP3,
    saves to uploads_dir. Returns metadata compatible with the upload response.
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
