# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Biyo/Serkor is a dental clinic management system with a React/TypeScript frontend and Python FastAPI backend. The system manages patients, doctors, appointments (visits), services, and payments with multi-clinic support.

**Tech Stack:**
- **Frontend**: React 18 + TypeScript, Vite, shadcn-ui, Tailwind CSS, TanStack Query
- **Backend**: Python FastAPI + SQLAlchemy (SQLite database)
- **Desktop**: Tauri wrapper for offline-first desktop experience
- **Originally built with**: Lovable.dev platform

## Development Commands

### Frontend Development
```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:8080)
npm run build            # Production build
npm run build:dev        # Development build
npm run lint             # Run ESLint
npm run preview          # Preview production build
```

### Backend Development
```bash
cd backend
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py                # Start backend (http://localhost:4000)
# OR
uvicorn main:app --host 0.0.0.0 --port 4000 --reload
```

### Desktop (Tauri) Development
```bash
npm run tauri:dev        # Run desktop app in dev mode
npm run tauri:build      # Create distributable desktop build
```

**Note**: Tauri requires Rust toolchain (install via `rustup`)

## Architecture

### Data Flow Pattern

The application follows a **client-server architecture with API-first design**:

1. **Frontend Store (`src/lib/store.ts`)**: Manages in-memory cache and localStorage for authentication only
2. **API Client (`src/lib/api.ts`)**: All data operations go through RESTful API calls
3. **Backend (`backend/main.py`)**: FastAPI server with SQLite database via SQLAlchemy ORM

**Key Pattern**:
- Store provides synchronous getters (returns cached data) and async fetch methods (fetches from API)
- All mutations go directly to API and update cache on success
- Only authentication state is persisted in localStorage (`biyo_current_user`)
- Custom events (`biyo-data-updated`, `biyo-auth-changed`) trigger UI updates

### Frontend Architecture

**State Management:**
- `store.ts` - Central data store with in-memory caching
- TanStack Query for server state management in components
- Custom events for cross-component reactivity

**Key Components:**
- `Schedule` page - Calendar view with drag-drop appointments
- `Patients` page - CRM-style patient management with dental charts
- `Analytics` page - Financial and operational dashboards
- `ToothChart` component - Interactive dental chart (32 teeth, numbering system)

**Routing:**
- `/` - Landing page (logged out) or Schedule (logged in)
- `/login`, `/signup` - Authentication
- `/patients` - Patient management
- `/analytics` - Analytics dashboard
- `/profile` - User settings
- `/migrate` - Data migration utility

### Backend Architecture

**Database Models** (`backend/models.py`):
- `Clinic` - Multi-tenancy root entity
- `User` - Authentication and clinic membership
- `Patient` - Patient records with dental chart data (JSON)
- `Doctor` - Healthcare providers with calendar colors
- `Service` - Billable services with default prices
- `Visit` - Appointments with services, payments, and treated teeth
- `Payment` - Payment records linked to visits
- `PatientFile` - File attachments (base64 encoded)

**API Endpoints** (all under `/api/`):
- `/clinics`, `/users`, `/patients`, `/doctors`, `/services`, `/visits`, `/files`, `/payments`
- All support GET (list/get by ID), POST (upsert), DELETE
- Query params: `id`, `clinicId`, `email`, `patientId`
- `/health` - Health check endpoint
- `/docs` - Auto-generated Swagger UI

**Schemas** (`backend/schemas.py`):
- Pydantic models for request/response validation
- Automatic camelCase ↔ snake_case conversion via aliases
- ID generation utility: `create_id(prefix)` generates IDs like `patient_abc123`

### Multi-Clinic Design

All entities (except Clinic itself) have a `clinicId` foreign key. API endpoints filter by clinic automatically when `clinicId` query param is provided. Frontend automatically includes current user's clinic ID.

### Dental Chart System

Teeth are represented as an array of `ToothStatus` objects:
```typescript
interface ToothStatus {
  toothNumber: number;      // 1-32 (adult) or 1-20 (child)
  status: "healthy" | "problem" | "treating" | "treated" | "missing";
}
```

Visit services can specify which teeth were treated via `teeth: number[]` field.

## Important Patterns

### API Error Handling

The `ApiClient` class wraps fetch with:
- 10-second timeout
- Custom `ApiError` class with status codes
- Russian error messages for network failures
- Automatic JSON response parsing

### Patient Balance Calculation

Patient balance is calculated on-demand from visits:
```typescript
totalCost = sum of all visit costs (status !== 'cancelled')
totalPaid = sum of all payment amounts
balance = max(0, totalCost - totalPaid)
```

### Protected Routes

`ProtectedRoute` component checks authentication and redirects to `/` if not logged in. Uses custom `biyo-auth-changed` event for cross-tab auth sync.

### Default Services Initialization

When a new clinic is created, `store.initializeDefaultServices()` creates a predefined list of Russian dental services (see `store.ts:547-596`).

## Environment Variables

**Frontend** (`.env`):
```bash
VITE_API_URL=http://localhost:4000/api  # Backend API URL
VITE_ENABLE_API_SYNC=true               # Enable/disable API sync (for Tauri offline mode)
```

**Backend** (`backend/.env`):
```bash
SERKOR_DB_PATH=backend/data.db          # SQLite database path
BACKEND_PORT=4000                       # Server port
```

## Common Development Tasks

### Adding a New Data Entity

1. Add SQLAlchemy model to `backend/models.py`
2. Add Pydantic schemas to `backend/schemas.py` (Payload + Response)
3. Add API endpoints to `backend/main.py` (GET, POST, DELETE)
4. Add TypeScript interface to `src/lib/store.ts`
5. Add API client methods to `src/lib/api.ts`
6. Add store methods to `src/lib/store.ts` (get, fetch, save, delete)
7. Update components to use new entity

### Working with the Database

Database schema is auto-created on first run via `Base.metadata.create_all(bind=engine)` in `backend/main.py`.

For schema changes:
1. Modify models in `backend/models.py`
2. Create migration script (see `backend/migrate_add_patient_status.py` as example)
3. Run migration manually or handle in `main.py` startup

### Testing API Endpoints

Use FastAPI's auto-generated docs at `http://localhost:4000/docs` or curl:
```bash
curl -X GET 'http://localhost:4000/api/patients?clinicId=clinic_123'
curl -X POST 'http://localhost:4000/api/patients' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Patient","phone":"555-1234","clinicId":"clinic_123",...}'
```

## Known Issues and Quirks

- TypeScript is configured with relaxed settings (`noImplicitAny: false`, `strictNullChecks: false`) for rapid development
- Patient email field is optional (can be empty string) despite EmailStr type in schemas
- Some components do local balance calculations rather than using API-calculated values
- Desktop (Tauri) mode disables API sync by default for offline operation
- All monetary values should use 2 decimal places (handled by payment normalization)

## Deployment

**Frontend**: Deploy to Vercel, Netlify, or any static host. Set `VITE_API_URL` to production backend URL.

**Backend**: Deploy to VPS, Railway, Render, or Fly.io. Requires:
- Python 3.11+
- Environment variables configured
- HTTPS with reverse proxy (Nginx + Let's Encrypt)
- Regular backups of SQLite database

**Desktop**: Build platform-specific installers with `npm run tauri:build` (generates .msi/.exe on Windows, .dmg on macOS, .deb/.appimage on Linux).
