# Serkor Dental Backend (Python)

FastAPI backend for Serkor Dental that stores all data in Google Sheets.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Google Sheets credentials
   ```

3. **Share your Google Sheet with the service account:**
   - Open your Google Sheet
   - Click "Share" and add the service account email (from `GOOGLE_CLIENT_EMAIL`)
   - Give it "Editor" permissions

## Running Locally

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 4000 --reload
```

The API will be available at `http://localhost:4000`

API docs available at `http://localhost:4000/docs`

## Deployment

### Render

1. Create a new Web Service on Render
2. Connect your repository
3. Set root directory to `backend-python`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables in Render dashboard

### Railway

1. Create a new project on Railway
2. Deploy from GitHub
3. Set root directory to `backend-python`
4. Railway auto-detects Python and installs from `requirements.txt`
5. Add environment variables in Railway dashboard
6. Railway automatically sets `PORT` environment variable

### Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Create `Dockerfile`:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```
3. Run `fly launch` and follow prompts
4. Set secrets: `fly secrets set GOOGLE_SHEETS_ID=... GOOGLE_CLIENT_EMAIL=... GOOGLE_PRIVATE_KEY=...`

### Google Cloud Run

1. Create `Dockerfile` (same as Fly.io)
2. Build and deploy:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/serkor-backend
   gcloud run deploy serkor-backend --image gcr.io/PROJECT_ID/serkor-backend --platform managed
   ```
3. Set environment variables in Cloud Run console

### Any Linux Server (VPS)

1. SSH into your server
2. Install Python 3.11+ and pip
3. Clone repository
4. Install dependencies: `pip install -r requirements.txt`
5. Set up systemd service or use PM2/supervisor
6. Configure nginx as reverse proxy (optional)

## API Endpoints

All endpoints are prefixed with `/api`:

- `GET /api/patients?clinicId=...` - Get patients
- `POST /api/patients` - Create/update patient
- `DELETE /api/patients?id=...&clinicId=...` - Delete patient
- `GET /api/doctors?clinicId=...` - Get doctors
- `POST /api/doctors` - Create/update doctor
- `DELETE /api/doctors?id=...&clinicId=...` - Delete doctor
- `GET /api/services?clinicId=...` - Get services
- `POST /api/services` - Create/update service
- `DELETE /api/services?id=...&clinicId=...` - Delete service
- `GET /api/visits?clinicId=...` - Get visits
- `POST /api/visits` - Create/update visit
- `DELETE /api/visits?id=...&clinicId=...` - Delete visit
- `POST /api/payments` - Add payment to visit
- `GET /api/clinics?id=...` - Get clinics
- `POST /api/clinics` - Create/update clinic
- `GET /api/users?email=...&clinicId=...` - Get users
- `POST /api/users` - Create/update user
- `GET /api/files?patientId=...&clinicId=...` - Get files
- `POST /api/files` - Create file
- `DELETE /api/files?id=...&clinicId=...` - Delete file

## Health Check

- `GET /health` - Returns server status

