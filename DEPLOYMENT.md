# Deployment Guide

This guide explains how to deploy the Serkor Dental application.

## Architecture

- **Frontend**: React + Vite (deployed to Vercel)
- **Backend**: FastAPI + SQLite (deployed to Railway/Render/Fly.io)

## Prerequisites

1. GitHub repository connected
2. Vercel account (for frontend)
3. Railway/Render/Fly.io account (for backend)
4. Environment variables configured

## Frontend Deployment (Vercel)

### Option 1: Automatic via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `/` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```

6. Deploy!

### Option 2: Via GitHub Actions

1. Get Vercel tokens:
   - Go to Vercel Settings → Tokens
   - Create a new token
   - Get your Organization ID and Project ID from project settings

2. Add GitHub Secrets:
   - `VERCEL_TOKEN`: Your Vercel token
   - `VERCEL_ORG_ID`: Your organization ID
   - `VERCEL_PROJECT_ID`: Your project ID

3. Uncomment the `deploy-vercel` job in `.github/workflows/frontend.yml`

## Backend Deployment

### Option 1: Railway (Recommended)

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add a new service → "Empty Service"
5. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Build Command**: `pip install -r requirements.txt`

6. Add Environment Variables:
   ```
   SERKOR_DB_PATH=/data/data.db
   BACKEND_PORT=8000
   ```

7. Add a volume for persistent database storage

8. Get your Railway token and add to GitHub Secrets:
   - `RAILWAY_TOKEN`: Your Railway token

9. Uncomment the `deploy-railway` job in `.github/workflows/backend.yml`

### Option 2: Render

1. Go to [Render](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `serkor-backend`
   - **Environment**: Python 3
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

5. Add Environment Variables:
   ```
   SERKOR_DB_PATH=/opt/render/project/src/backend/data.db
   ```

6. Get your Render deploy hook URL and add to GitHub Secrets:
   - `RENDER_DEPLOY_HOOK_URL`: Your Render deploy hook URL

7. Uncomment the `deploy-render` job in `.github/workflows/backend.yml`

### Option 3: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Initialize: `fly launch` (in backend directory)
4. Create `fly.toml`:
   ```toml
   app = "serkor-backend"
   primary_region = "iad"

   [build]

   [env]
     SERKOR_DB_PATH = "/data/data.db"
     BACKEND_PORT = "8080"

   [[services]]
     internal_port = 8080
     protocol = "tcp"
   ```

5. Deploy: `fly deploy`

## Environment Variables

### Frontend (.env or Vercel)
```
VITE_API_URL=https://your-backend-url.com/api
```

### Backend (Railway/Render/Fly.io)
```
SERKOR_DB_PATH=/data/data.db
BACKEND_PORT=8000
```

## Post-Deployment

1. **Update Frontend API URL**: 
   - Set `VITE_API_URL` in Vercel to point to your backend URL

2. **Test the deployment**:
   - Frontend: Visit your Vercel URL
   - Backend: Visit `https://your-backend-url.com/docs` for API docs

3. **Database Backup**:
   - Set up automated backups for your SQLite database
   - Railway/Render/Fly.io provide volume persistence

## CI/CD Workflow

The repository includes GitHub Actions workflows:

- **Frontend CI/CD** (`.github/workflows/frontend.yml`): Builds and tests frontend
- **Backend CI/CD** (`.github/workflows/backend.yml`): Tests backend
- **Deploy** (`.github/workflows/deploy.yml`): Deployment summary

These run automatically on pushes to `main` branch.

## Troubleshooting

### Frontend can't connect to backend
- Check CORS settings in `backend/main.py`
- Verify `VITE_API_URL` is set correctly
- Check backend is running and accessible

### Backend database errors
- Ensure database path is writable
- Check volume persistence is configured
- Verify `SERKOR_DB_PATH` environment variable

### Build failures
- Check Node.js version (should be 20+)
- Check Python version (should be 3.11+)
- Verify all dependencies are in `package.json` and `requirements.txt`

