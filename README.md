# Serkor Dental

## Stack

- Vite + React + TypeScript (frontend)
- Tailwind CSS + shadcn/ui component primitives
- FastAPI + SQLAlchemy (backend)
- SQLite (default datastore)

## Getting Started

```sh
# install frontend dependencies
yarn install # or npm install

# create and activate a Python virtualenv (recommended)
python3 -m venv .venv
source .venv/bin/activate

# install backend dependencies
pip install -r backend/requirements.txt

# run the FastAPI server (defaults to http://localhost:8000)
npm run server

# in a separate terminal, start the frontend
yarn dev # or npm run dev
```

Set `VITE_API_URL` to point the frontend at a different backend origin if required (defaults to `http://localhost:8000/api`).

Database files are written to `backend/data/app.db`; remove the file to start with a clean slate.

## Scripts

- `npm run dev` – start the Vite dev server.
- `npm run build` / `npm run build:dev` – production or development builds.
- `npm run lint` – run ESLint across the project.
- `npm run preview` – preview the built frontend locally.
- `npm run server` – run the FastAPI backend with `uvicorn --reload`.

## Backend Overview

The new FastAPI backend exposes the following high-level resources under `/api`:

| Resource | Description |
| --- | --- |
| `/clinics` | Create, update, list, and delete clinics |
| `/users` | Clinic users with optional role linkage |
| `/doctors` | Doctors tied to clinics/users |
| `/services` | Billable services per clinic |
| `/patients` | Patient records, tooth charts, balances |
| `/visits` | Scheduled/completed visits with services and payments |
| `/payments` | Payment records linked to visits |
| `/files` | Metadata for patient file uploads (string URLs) |

All endpoints accept and return camelCase JSON to remain compatible with the existing React store. IDs are stable string identifiers (e.g. `patient_abcdef12`).

## Environment Variables

FastAPI settings live in `backend/app/config.py` and can be overridden via a `.env` file placed inside `backend/`:

```env
APP_NAME=Serkor Dental API
SQLITE_PATH=backend/data/app.db
DATABASE_URL=sqlite:///custom/path.db
DEBUG=true
```

`DATABASE_URL` takes precedence if provided (any SQLAlchemy-compatible URL). When absent, the app falls back to the SQLite file inside `backend/data/`.

## Notes

- Binary patient files are not uploaded automatically; the API expects a string URL. Extend the `/files` endpoint to integrate with your preferred storage if needed.
- Remove `backend/data/app.db` if you want to reseed the database locally.
- Replace the SQLite engine with Postgres/MySQL by updating `DATABASE_URL` and installing the corresponding driver.
