# Troubleshooting API Connection Issues

## Issue: "Provisional headers are shown" / CORS Errors

### Problem
Frontend cannot connect to backend at `http://46.173.27.246:4000`

### Root Causes

1. **Mixed Content (Most Common)**
   - Frontend on HTTPS (Vercel) → Backend on HTTP
   - Browsers block HTTP requests from HTTPS pages
   - **Solution**: Use HTTPS for backend

2. **CORS Configuration**
   - Backend CORS not allowing frontend origin
   - **Solution**: Backend already allows all origins (`allow_origins=["*"]`)

3. **Firewall/Network**
   - Port 4000 not accessible from internet
   - **Solution**: Check firewall rules on VPS

4. **Backend Not Running**
   - Service stopped or crashed
   - **Solution**: Check backend status on VPS

## Solutions

### Solution 1: Add HTTPS to Backend (Recommended for Production)

```bash
# On your VPS
sudo apt install nginx certbot python3-certbot-nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/serkor-backend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name 46.173.27.246;  # Or your domain

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/serkor-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**For SSL (if you have a domain):**
```bash
sudo certbot --nginx -d yourdomain.com
```

**Update frontend to use HTTPS:**
```bash
VITE_API_URL=https://yourdomain.com/api
# Or if using IP with self-signed cert (not recommended):
VITE_API_URL=https://46.173.27.246/api
```

### Solution 2: Test with HTTP Frontend (Development Only)

If testing locally, make sure frontend is also HTTP:

```bash
# Run frontend on HTTP (not HTTPS)
npm run dev
# Should be http://localhost:5173
```

Update `.env`:
```bash
VITE_API_URL=http://46.173.27.246:4000/api
```

### Solution 3: Check Backend Status on VPS

```bash
# SSH into VPS
ssh user@46.173.27.246

# Check if backend is running
sudo systemctl status serkor-backend

# Check logs
sudo journalctl -u serkor-backend -n 50

# Test locally on VPS
curl http://localhost:4000/health
```

### Solution 4: Check Firewall

```bash
# On VPS, check if port 4000 is open
sudo ufw status
sudo netstat -tlnp | grep 4000

# If port is not accessible, open it
sudo ufw allow 4000/tcp
```

### Solution 5: Verify Backend Configuration

Check backend is listening on all interfaces:
```python
# In main.py, ensure it's:
uvicorn.run(app, host="0.0.0.0", port=4000)
# Not: host="127.0.0.1" (localhost only)
```

## Quick Diagnosis

### Test 1: Backend Health Check
```bash
curl http://46.173.27.246:4000/health
# Should return: {"ok": true, "timestamp": "..."}
```

### Test 2: Test API Endpoint
```bash
curl http://46.173.27.246:4000/api/patients
# Should return: [] (empty array if no patients)
```

### Test 3: Test CORS Headers
```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://46.173.27.246:4000/api/patients -v
# Should return CORS headers
```

### Test 4: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to load the page
4. Check for errors:
   - **CORS error**: Backend CORS issue
   - **Mixed content**: HTTPS → HTTP issue
   - **Connection refused**: Backend not running or firewall blocking
   - **Timeout**: Network issue or backend slow

## Immediate Fix for Testing

### Option A: Use HTTP for Both (Local Development)
1. Run frontend locally on HTTP: `npm run dev`
2. Backend on HTTP: `http://46.173.27.246:4000`
3. Update `.env`: `VITE_API_URL=http://46.173.27.246:4000/api`

### Option B: Add Nginx Reverse Proxy (Production Ready)
1. Install Nginx on VPS
2. Configure reverse proxy (see Solution 1)
3. Use HTTPS if you have a domain
4. Update frontend to use HTTPS URL

## Common Error Messages

### "Provisional headers are shown"
- **Cause**: Request blocked before completion
- **Fix**: Check mixed content, CORS, or network connectivity

### "CORS policy: No 'Access-Control-Allow-Origin' header"
- **Cause**: Backend not sending CORS headers
- **Fix**: Verify CORS middleware is enabled in backend

### "Mixed Content: The page was loaded over HTTPS"
- **Cause**: HTTPS page trying to load HTTP resource
- **Fix**: Use HTTPS for backend or HTTP for frontend (dev only)

### "net::ERR_CONNECTION_REFUSED"
- **Cause**: Backend not running or firewall blocking
- **Fix**: Check backend status and firewall rules

### "net::ERR_CONNECTION_TIMED_OUT"
- **Cause**: Network issue or backend not accessible
- **Fix**: Verify backend is running and port is open

## Production Setup Checklist

- [ ] Backend running on VPS
- [ ] Nginx configured as reverse proxy
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Firewall allows ports 80, 443, 22
- [ ] Backend accessible via HTTPS
- [ ] Frontend configured with HTTPS API URL
- [ ] CORS configured correctly
- [ ] Tested from production frontend

## Next Steps

1. **For Development**: Use HTTP for both frontend and backend
2. **For Production**: Set up HTTPS for backend (Nginx + Let's Encrypt)
3. **Verify**: Test API calls from browser console
4. **Monitor**: Check backend logs for errors

