# Serkor Backend (Python)

FastAPI service that stores clinic data in a local SQLite database by default (with optional Google Sheets sync).

## Prerequisites

- Python 3.11+

## Setup

```bash
cd backend-python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create an `.env` file (optional – only needed if you wish to keep Google Sheets storage):

```
# Optional: override defaults
BACKEND_PORT=4000
SERKOR_DB_PATH=backend/data.db

# Optional: enable Google Sheets sync instead of SQLite
GOOGLE_SHEETS_ID=your-spreadsheet-id
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

If you provide the Google variables, the backend automatically switches from SQLite to Sheets. Otherwise all data is stored in the `.db` file. When using Sheets, share the spreadsheet with the service-account email and grant **Editor** access.

## Run locally

```bash
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 4000 --reload
```

API docs will be available at `http://localhost:4000/docs`.

## Environment variables

- `SERKOR_DB_PATH` – Path to the SQLite database file (defaults to `backend/data.db`)
- `BACKEND_PORT` – Optional, defaults to 4000
- `GOOGLE_SHEETS_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` – (optional) enable Google Sheets backend instead of SQLite

## Deployment tips

- Run behind Nginx or a reverse proxy for HTTPS
- Use `systemd` or similar process manager for reliability
- Keep the `.env` file secure (never commit it)

## Health check

- `GET /health` returns `{ "ok": true, ... }`
