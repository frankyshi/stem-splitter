# Stemsmith

AI-powered music processing tool that converts media into isolated audio stems.

Stemsmith is a full-stack web application that allows users to:

- Convert YouTube videos → MP3
- Convert video files (MP4/MOV) → MP3
- Split MP3 files into stems (vocals, drums, bass, other) using Demucs

The system is built with a React frontend and a FastAPI backend. Media files are processed using yt-dlp, FFmpeg, and Demucs, then returned to the client for playback and download.

## Features

- YouTube → MP3 conversion
- Video → MP3 extraction (MP4 / MOV)
- AI stem separation using Demucs
- FastAPI backend for media processing
- Audio playback for generated stems
- Downloadable output files

---

## Project structure

- `frontend/` – React app (Vite) for upload, status, and stem preview UI
- `backend/` – FastAPI app and service layer
  - `main.py` – FastAPI app factory and router wiring
  - `routes/` – API route modules
    - `upload.py` – `POST /api/upload`
    - `split.py` – `POST /api/split/{file_id}`, `GET /api/stems/{file_id}`, `GET /api/download/{file_id}`
  - `services/demucs_service.py` – Demucs stem separation (vocals/drums/bass/other)
  - `services/youtube_service.py` – YouTube import (yt-dlp + FFmpeg)
  - `services/mp4_service.py` – Video → MP3 conversion (FFmpeg)
  - `models/` – Pydantic models (request/response schemas)
  - `utils/` – shared utilities/helpers
- `uploads/` – stored uploaded/imported audio files (MP3)
- `stems/` – generated stem outputs (WAV per stem)

---

## Architecture

Below is the high-level architecture of Stemsmith.

![Stemsmith Architecture](docs/arch.svg)

---

### System Overview

Stemsmith is a full-stack music processing application that converts media into usable audio stems.

Workflow:

1. Users upload an MP3, MP4/MOV file, or a YouTube URL through the React frontend.
2. The frontend sends the request to a FastAPI backend.
3. The backend orchestrates media processing using:
   - yt-dlp (download YouTube audio)
   - FFmpeg (media conversion)
   - Demucs (AI-based stem separation)
4. Processed files are temporarily stored and returned to the client.
5. The frontend provides audio playback and download controls for the generated files.

---

## Backend (FastAPI)

### Install dependencies

From the project root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Run the backend

```bash
cd .. # Go back to the Stemsmith project root
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` and the interactive docs
at `http://localhost:8000/docs`.

### Key endpoints

- `POST /api/upload` – accept an uploaded audio file and return a `file_id`
- `POST /api/split/{file_id}` – run Demucs stem splitting for an uploaded/imported file
- `GET /api/stems/{file_id}` – list available stems for a given `file_id`
- `GET /api/download/{file_id}` – download a stem WAV by name (query param `stem`)
- `POST /api/import/youtube` – import YouTube audio to MP3 (yt-dlp + FFmpeg)
- `POST /api/import/mp4` – convert uploaded video to MP3 (FFmpeg)
- `GET /api/download-original/{file_id}` – download the original uploaded/imported MP3

---

## Frontend (React)

### Install dependencies

From the project root:

```bash
cd frontend
npm install
```

### Run the frontend dev server

```bash
cd frontend
npm run dev
```

By default, Vite will start the app on `http://localhost:5173`.

The frontend expects the backend to be running on `http://localhost:8000` and
uses the `/api/*` endpoints defined above. You can change the base URL in
`frontend/src/services/api.js` if needed.

---

## AI audio processing (Demucs)

Demucs processing is implemented in:

- `backend/services/demucs_service.py`

At a high level:

- The backend locates the uploaded/imported MP3 in `uploads/`
- It runs Demucs (htdemucs) to generate the 4 standard stems
- It writes stem WAV files to `stems/{file_id}/` and exposes them via download/list endpoints

---

## Troubleshooting

### YouTube import: common failures

YouTube frequently changes how videos are served, so yt-dlp may need different
strategies or cookies to succeed.

1. **Update yt-dlp** to the latest version (YouTube changes often; newer releases include fixes):
   ```bash
   pip install -U yt-dlp
   # or: brew upgrade yt-dlp
   ```
2. Use **Python 3.10+** for the backend (yt-dlp has deprecated 3.9; some fixes require 3.10+).
3. Some videos cannot be accessed via embedded players (`web_embedded`) and will
   return errors like `Error code: 152 - 18` or "Watch video on YouTube". Try
   another public video or configure cookies so yt-dlp can reuse your browser
   session.
4. For videos that require login/age confirmation, set an env var such as
   `YTDLP_COOKIES_FROM_BROWSER=chrome` (or `firefox`, `safari`, etc.) so the
   backend can fall back to `--cookies-from-browser` when needed.