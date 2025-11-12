# Serkor Backend (Python)

FastAPI service that stores clinic data in Google Sheets.

## Prerequisites

- Python 3.11+
- Google service account with access to the target spreadsheet

## Setup

```bash
cd backend-python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create an `.env` file (see `.env.example` below):

```
GOOGLE_SHEETS_ID=your-spreadsheet-id
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
BACKEND_PORT=4000
```

Share the spreadsheet with the service account email and give it **Editor** access.

## Run locally

```bash
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 4000 --reload
```

API docs will be available at `http://localhost:4000/docs`.

## Environment variables

- `GOOGLE_SHEETS_ID` – Spreadsheet ID
- `GOOGLE_CLIENT_EMAIL` – Service account email
- `GOOGLE_PRIVATE_KEY` – Private key (escape newlines with `\n`)
- `BACKEND_PORT` – Optional, defaults to 4000

## Deployment tips

- Run behind Nginx or a reverse proxy for HTTPS
- Use `systemd` or similar process manager for reliability
- Keep the `.env` file secure (never commit it)

## Health check

- `GET /health` returns `{ "ok": true, ... }`
