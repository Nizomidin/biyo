# Quick Fix for API Connection Errors

## The Problem
Your frontend can't connect to backend at `http://46.173.27.246:4000` because of **mixed content** (HTTPS frontend calling HTTP backend).

## Immediate Solutions

### Option 1: Setup Nginx Reverse Proxy (5 minutes)

**On your VPS (46.173.27.246):**

```bash
# 1. Install Nginx
sudo apt update
sudo apt install nginx -y

# 2. Create Nginx config
sudo nano /etc/nginx/sites-available/serkor-backend
```

Paste this:
```nginx
server {
    listen 80;
    server_name 46.173.27.246;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 3. Enable site
sudo ln -s /etc/nginx/sites-available/serkor-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 4. Allow Nginx through firewall
sudo ufw allow 'Nginx Full'
```

**Update Frontend:**
- Change `VITE_API_URL` to: `http://46.173.27.246/api` (no port needed)
- Or use port 80: `http://46.173.27.246:80/api`

### Option 2: Add HTTPS with Let's Encrypt (10 minutes)

**If you have a domain pointing to 46.173.27.246:**

```bash
# 1. Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# 2. Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# 3. Certbot will automatically configure Nginx for HTTPS
```

**Update Frontend:**
- Change `VITE_API_URL` to: `https://yourdomain.com/api`

### Option 3: Test Locally with HTTP (Development)

**If testing locally (not production):**

1. Make sure frontend runs on HTTP (not HTTPS):
   ```bash
   npm run dev
   # Should show: http://localhost:5173
   ```

2. Update `.env`:
   ```bash
   VITE_API_URL=http://46.173.27.246:4000/api
   ```

3. Restart dev server:
   ```bash
   npm run dev
   ```

### Option 4: Change Backend Port to 80 (Quick Test)

**On VPS, if you don't have Nginx:**

```bash
# 1. Stop current backend
sudo systemctl stop serkor-backend

# 2. Edit systemd service
sudo nano /etc/systemd/system/serkor-backend.service
# Change port from 4000 to 80

# 3. Restart
sudo systemctl daemon-reload
sudo systemctl start serkor-backend

# 4. Allow port 80
sudo ufw allow 80/tcp
```

**Update Frontend:**
- Change to: `http://46.173.27.246/api` (port 80 is default)

## Verify It Works

```bash
# Test backend
curl http://46.173.27.246:4000/health
# Or with Nginx:
curl http://46.173.27.246/health
```

## For Production (Recommended)

**Best setup:**
1. ✅ Use Nginx as reverse proxy (port 80/443)
2. ✅ Add SSL certificate (HTTPS)
3. ✅ Update frontend to use HTTPS backend URL
4. ✅ Test from production frontend

**Frontend Environment Variables (Vercel):**
```
VITE_API_URL=https://yourdomain.com/api
VITE_ENABLE_API_SYNC=true
```

## Common Issues

### "Still getting errors after Nginx setup"
- Check Nginx is running: `sudo systemctl status nginx`
- Check backend is running: `sudo systemctl status serkor-backend`
- Check firewall: `sudo ufw status`
- Test locally on VPS: `curl http://localhost:4000/health`

### "SSL certificate not working"
- Make sure domain DNS points to VPS IP
- Wait for DNS propagation (can take up to 48 hours)
- Check certificate: `sudo certbot certificates`

### "Frontend still can't connect"
- Clear browser cache
- Check browser console for specific error
- Verify backend URL in frontend `.env`
- Restart frontend dev server after changing `.env`

## Next Steps

1. **Choose a solution** (Option 1 or 2 recommended)
2. **Configure Nginx** on VPS
3. **Update frontend** environment variables
4. **Test** from browser
5. **Deploy** frontend with new API URL

