# GitHub Actions Workflows

This directory contains CI/CD workflows for the Serkor Dental application.

## Available Workflows

### 1. `test-ci.yml` - Test CI/CD
- **Purpose**: Simple workflow to verify CI/CD is working
- **Triggers**: Runs on every push to `main` branch
- **What it does**: Verifies workflows are configured correctly

### 2. `frontend.yml` - Frontend CI/CD
- **Purpose**: Build and test the frontend React application
- **Triggers**: Runs on every push to `main` branch
- **What it does**:
  - Installs dependencies
  - Runs linter
  - Builds the frontend
  - Uploads build artifacts

### 3. `backend.yml` - Backend CI/CD
- **Purpose**: Test the backend FastAPI application
- **Triggers**: Runs on every push to `main` branch
- **What it does**:
  - Installs Python dependencies
  - Checks backend syntax
  - Runs tests (when available)

### 4. `deploy.yml` - Deployment Summary
- **Purpose**: Provides deployment summary
- **Triggers**: Runs on every push to `main` branch or manual dispatch

## Viewing Workflow Runs

1. Go to your repository on GitHub
2. Click on the **Actions** tab
3. You'll see all workflow runs listed there

## Manual Triggering

You can manually trigger workflows:
1. Go to **Actions** tab
2. Select a workflow from the left sidebar
3. Click **Run workflow** button
4. Select branch and click **Run workflow**

## Troubleshooting

### Workflows not showing up?
- Make sure workflows are in `.github/workflows/` directory
- Check that files have `.yml` or `.yaml` extension
- Verify workflows are committed and pushed to the repository

### Workflows not running?
- Check that you're pushing to the correct branch (`main`)
- Verify workflow syntax is correct (no YAML errors)
- Check the **Actions** tab for any error messages

### Need to test workflows?
- Use `test-ci.yml` - it's a simple workflow that always runs
- Or manually trigger a workflow using the **Run workflow** button

## Next Steps

1. ✅ Workflows are set up and will run automatically
2. 🔧 Configure deployment (see `DEPLOYMENT.md`)
3. 🚀 Add secrets for deployment (Vercel token, Railway token, etc.)

