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

The project includes a Python FastAPI backend (see `backend/`) that persists all clinic data in Google Sheets.

**Quick start:**

1. Install dependencies:
   ```sh
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Create `.env` (there is an `.env.example`):
   ```sh
   GOOGLE_SHEETS_ID=<spreadsheet id>
   GOOGLE_CLIENT_EMAIL=<service account email>
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   BACKEND_PORT=4000 # optional, defaults to 4000
   ```

3. Share the spreadsheet with the service account email (Editor rights).

4. Run the server:
   ```sh
   python main.py
   # or
   uvicorn main:app --host 0.0.0.0 --port 4000 --reload
   ```

By default the frontend points to `http://localhost:4000/api`. Set `VITE_API_URL` before `npm run dev` to use a different backend URL.

For production, host the backend on a VPS or any Node/Python-friendly provider behind HTTPS (e.g. Nginx + Let's Encrypt) and point `VITE_API_URL` to `https://api.yourdomain.com/api`.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/62edfae4-4db9-403b-ad17-5854d5725e0c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
