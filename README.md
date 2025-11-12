# Welcome to your Lovable project
12
## Project info

**URL**: https://lovable.dev/projects/62edfae4-4db9-403b-ad17-5854d5725e0c

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/62edfae4-4db9-403b-ad17-5854d5725e0c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Tauri (desktop wrapper)

## Desktop (Tauri) development

You can run the app as an offline-first desktop experience using Tauri. Make sure the Rust toolchain is installed (`rustup` recommended), then:

```sh
# install dependencies
npm install

# run the desktop app in dev mode (wraps npm run dev)
npm run tauri:dev

# create a distributable build (Windows .msi/.exe, plus other targets on macOS/Linux)
npm run tauri:build
```

The desktop build points to the same local data store as the web app and keeps API sync disabled by default so it works fully offline. You can re-enable remote sync by setting `VITE_ENABLE_API_SYNC=true` before running the Tauri commands.

## Backend service (Google Sheets)

The project includes a Python FastAPI backend that persists all clinic data in Google Sheets. See `backend-python/README.md` for detailed setup and deployment instructions.

**Quick start:**

1. Install Python dependencies:
   ```sh
   cd backend-python
   pip install -r requirements.txt
   ```

2. Configure environment variables (copy from `.env.example`):
   ```sh
   GOOGLE_SHEETS_ID=<spreadsheet id>
   GOOGLE_CLIENT_EMAIL=<service account email>
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   BACKEND_PORT=4000 # optional, defaults to 4000
   ```

3. Start the backend:
   ```sh
   python main.py
   # or
   uvicorn main:app --host 0.0.0.0 --port 4000 --reload
   ```

4. Share your Google Sheet with the service account email (give it Editor permissions)

By default the frontend points to `http://localhost:4000/api`. To target a different backend URL, set `VITE_API_URL` before running `npm run dev`.

**Deployment:** The Python backend can be deployed to:
- **VPS (Recommended for production)**: See `backend-python/DEPLOY_VPS.md` for complete VPS setup guide
- **Render, Railway, Fly.io**: See `backend-python/README.md` for platform-specific instructions
- **Google Cloud Run**: See `backend-python/README.md` for container deployment

For production VPS deployment with SSL, reverse proxy, and systemd service, follow the detailed guide in `backend-python/DEPLOY_VPS.md`.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/62edfae4-4db9-403b-ad17-5854d5725e0c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
