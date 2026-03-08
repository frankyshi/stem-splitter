# stem-splitter

Skeleton full‑stack project for an audio stem separation app.

The app is split into a React frontend and a FastAPI backend. Audio files are
uploaded to the backend, processed with an AI model (Demucs), and exposed as
separate stems (vocals, drums, bass, other) for preview and download.

> **Note**: This repository currently contains a clean project skeleton only.
> The actual Demucs integration and full business logic are left as TODOs.

---

## Project structure

- `frontend/` – React app (Vite) for upload, status, and stem preview UI
- `backend/` – FastAPI app and service layer
  - `main.py` – FastAPI app factory and router wiring
  - `routes/` – API route modules
    - `upload.py` – `POST /api/upload`
    - `split.py` – `POST /api/split/{file_id}`, `GET /api/stems/{file_id}`, `GET /api/download/{file_id}`
  - `services/demucs_service.py` – placeholder for Demucs integration
  - `models/` – placeholder for Pydantic models
  - `utils/` – placeholder for shared utilities
- `uploads/` – where uploaded audio files will be stored
- `stems/` – where processed stems will be stored

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
cd .. # Go back to the stem-splitter directory
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` and the interactive docs
at `http://localhost:8000/docs`.

### Key endpoints (skeleton)

- `POST /api/upload` – accept an uploaded audio file and return a `file_id`
- `POST /api/split/{file_id}` – placeholder endpoint to trigger Demucs stem splitting
- `GET /api/stems/{file_id}` – list available stems for a given `file_id`
- `GET /api/download/{file_id}` – placeholder endpoint for downloading a stem

Implementation details (validation, persistence, real Demucs inference, and
file downloads) are intentionally left as TODOs in the code.

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

## Where to implement AI audio processing

The placeholder for Demucs integration lives in:

- `backend/services/demucs_service.py`

Comments in that file outline the expected responsibilities:

- Load and configure the Demucs model
- Run source separation on the uploaded audio file
- Save stems (vocals, drums, bass, other) into the `stems/` directory
- Return the list of generated stem files to the API layer

Once that logic is implemented, the existing API routes and frontend skeleton
can be wired up to provide full end‑to‑end stem splitting.