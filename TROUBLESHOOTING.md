# Troubleshooting Guide

## Blank Page / Nothing Appearing

If you see a blank page or "No search results" when trying to use the app:

### 1. Check Browser Console
- Press **F12** to open Developer Tools
- Go to **Console** tab
- Look for **red error messages**
- Share these errors to debug the issue

### 2. Check Network Tab
- In Developer Tools, go to **Network** tab
- Reload the page
- Look for failed requests (red entries)
- Check if the JavaScript files are loading (should see `.js` files)

### 3. Common Issues

#### Backend Not Deployed
- The app is **API-only** and requires a backend
- Check if backend is deployed and accessible
- Verify `VITE_API_URL` environment variable in Vercel

#### API URL Not Configured
1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add: `VITE_API_URL=https://your-backend-url.com/api`
3. **Redeploy** after adding environment variables

#### JavaScript Errors
- Check browser console for errors
- Common errors:
  - `Failed to fetch` - Backend not accessible
  - `Network error` - Backend URL incorrect
  - `CORS error` - Backend CORS settings

### 4. Verify Backend is Running

Check if your backend is accessible:
```bash
curl https://your-backend-url.com/health
```

Should return: `{"ok": true, ...}`

### 5. Hard Refresh

Clear cache and reload:
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### 6. Check Vercel Deployment

1. Go to Vercel Dashboard
2. Click on your project
3. Check **Deployments** tab
4. Look for build errors in logs

## Login Not Working

If login doesn't work:

### 1. Check API Connection
- Open browser console (F12)
- Try to log in
- Look for API errors in console

### 2. Verify Backend Endpoint
- Backend should be running at the URL specified in `VITE_API_URL`
- Test: `https://your-backend-url.com/api/users?email=test@example.com`

### 3. Check CORS Settings
- Backend must allow requests from your Vercel domain
- In `backend/main.py`, CORS should allow your domain:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["https://your-vercel-domain.vercel.app", "*"],
      ...
  )
  ```

### 4. User Doesn't Exist
- If user doesn't exist, you'll be redirected to signup
- Create account first, then try logging in

## Still Not Working?

1. **Share browser console errors** (F12 → Console)
2. **Share network errors** (F12 → Network → failed requests)
3. **Check backend logs** to see if requests are reaching it
4. **Verify environment variables** are set correctly in Vercel

## Quick Checklist

- [ ] Backend is deployed and running
- [ ] `VITE_API_URL` is set in Vercel environment variables
- [ ] Backend CORS allows your Vercel domain
- [ ] JavaScript files are loading (check Network tab)
- [ ] No console errors (check Console tab)
- [ ] Hard refresh cleared cache

