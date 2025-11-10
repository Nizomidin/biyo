# Quick Start: Deploy Backend to VPS

## Prerequisites
- VPS with Ubuntu/Debian
- Domain name (optional)
- SSH access

## 5-Minute Setup

### 1. Connect to VPS
```bash
ssh user@your-vps-ip
```

### 2. Install Dependencies
```bash
sudo apt update && sudo apt install -y python3.11 python3.11-venv python3-pip nginx certbot python3-certbot-nginx git
```

### 3. Clone and Setup
```bash
cd /home/$USER
git clone <your-repo-url> serkor-dental
cd serkor-dental/backend-python
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Configure Environment
```bash
cp .env.example .env
nano .env
# Fill in: GOOGLE_SHEETS_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY
```

### 5. Create Systemd Service
```bash
sudo nano /etc/systemd/system/serkor-backend.service
```

Paste:
```ini
[Unit]
Description=Serkor Dental Backend API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/serkor-dental/backend-python
Environment="PATH=/home/$USER/serkor-dental/backend-python/venv/bin"
ExecStart=/home/$USER/serkor-dental/backend-python/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### 6. Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable serkor-backend
sudo systemctl start serkor-backend
sudo systemctl status serkor-backend
```

### 7. Setup Nginx
```bash
sudo nano /etc/nginx/sites-available/serkor-backend
```

Paste:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Change to your domain or IP

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/serkor-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Setup SSL (if using domain)
```bash
sudo certbot --nginx -d api.yourdomain.com
```

### 9. Configure Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 10. Test
```bash
curl http://localhost:8000/health
# Should return: {"ok": true, "timestamp": "..."}
```

## Update Frontend

In your frontend `.env` or Vercel environment variables:
```bash
VITE_API_URL=https://api.yourdomain.com/api
VITE_ENABLE_API_SYNC=true
```

Then rebuild and redeploy frontend.

## Useful Commands

```bash
# View logs
sudo journalctl -u serkor-backend -f

# Restart backend
sudo systemctl restart serkor-backend

# Update code
cd /home/$USER/serkor-dental/backend-python
git pull
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart serkor-backend
```

## Troubleshooting

**Backend not starting?**
```bash
sudo journalctl -u serkor-backend -n 50
```

**Nginx 502 error?**
- Check backend is running: `sudo systemctl status serkor-backend`
- Check port: `sudo netstat -tlnp | grep 8000`

**SSL issues?**
```bash
sudo certbot renew
sudo nginx -t
```

For detailed instructions, see `DEPLOY_VPS.md`

