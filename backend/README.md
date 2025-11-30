# Serkor Backend (Python)

FastAPI service that stores clinic data in a SQLite database.

## Prerequisites

- Python 3.11+

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create an `.env` file (optional – only needed if you wish to customize defaults):

```
# Optional: override defaults
BACKEND_PORT=4000
SERKOR_DB_PATH=backend/data.db
```

## Run locally

```bash
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 4000 --reload
```

Or:

```bash
cd backend
python3 main.py
```

The first run creates `backend/data.db` automatically. API docs are served at `http://localhost:4000/docs`.

## Environment variables

- `SERKOR_DB_PATH` – Path to the SQLite database file (defaults to `backend/data.db`)
- `BACKEND_PORT` – Optional, defaults to 4000

## Deployment tips

- Run behind Nginx or a reverse proxy for HTTPS
- Use `systemd` or a process manager to keep Uvicorn running
- Keep the `.env` file secure (never commit it)
- Back up `backend/data.db` regularly or point `SERKOR_DB_PATH` at a managed volume

## API Endpoints

- `GET /health` – Health check returns `{ "ok": true, ... }`
- `GET /docs` – Interactive API documentation (Swagger UI)
- `GET /api/*` – All data endpoints (patients, doctors, services, visits, payments, files, users, clinics)

## Database

All data is stored in a SQLite database. The database file is automatically created on first run.
