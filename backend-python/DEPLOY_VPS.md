# Deploying Backend to VPS (Production)

This guide covers deploying the Python FastAPI backend to a Linux VPS (Ubuntu/Debian).

## Prerequisites

- VPS with Ubuntu 20.04+ or Debian 11+
- SSH access to your VPS
- Domain name pointing to your VPS IP (optional but recommended)
- Python 3.11+ installed

## Step 1: Initial VPS Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Python and Dependencies
```bash
sudo apt install -y python3.11 python3.11-venv python3-pip nginx certbot python3-certbot-nginx git
```

### 1.3 Create Application User (Optional but Recommended)
```bash
sudo adduser --disabled-password --gecos "" serkor
sudo su - serkor
```

## Step 2: Deploy Backend Code

### 2.1 Clone Repository
```bash
cd /home/serkor
git clone <your-repo-url> serkor-dental
cd serkor-dental/backend-python
```

### 2.2 Create Virtual Environment
```bash
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 2.3 Create Environment File
```bash
nano .env
```

Add your production environment variables:
```bash
GOOGLE_SHEETS_ID=your-spreadsheet-id
GOOGLE_CLIENT_EMAIL=serkor@serkor.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR-PRIVATE-KEY\n-----END PRIVATE KEY-----\n"
BACKEND_PORT=8000
PORT=8000
```

**Important Security Notes:**
- Never commit `.env` to git
- Use strong file permissions: `chmod 600 .env`
- Store private key with proper escaping (keep `\n` in the key)

### 2.4 Test Backend Locally
```bash
python main.py
# Or
uvicorn main:app --host 0.0.0.0 --port 8000
```

Test it works: `curl http://localhost:8000/health`

## Step 3: Setup Systemd Service

### 3.1 Create Service File
```bash
sudo nano /etc/systemd/system/serkor-backend.service
```

Add this configuration:
```ini
[Unit]
Description=Serkor Dental Backend API
After=network.target

[Service]
Type=simple
User=serkor
WorkingDirectory=/home/serkor/serkor-dental/backend-python
Environment="PATH=/home/serkor/serkor-dental/backend-python/venv/bin"
ExecStart=/home/serkor/serkor-dental/backend-python/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3.2 Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable serkor-backend
sudo systemctl start serkor-backend
sudo systemctl status serkor-backend
```

### 3.3 Check Logs
```bash
sudo journalctl -u serkor-backend -f
```

## Step 4: Setup Nginx Reverse Proxy

### 4.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/serkor-backend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your domain or IP

    # Increase body size for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers (if not already handled by FastAPI)
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }
}
```

### 4.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/serkor-backend /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

## Step 5: Setup SSL with Let's Encrypt

### 5.1 Install SSL Certificate
```bash
sudo certbot --nginx -d api.yourdomain.com
```

Follow the prompts. Certbot will automatically:
- Obtain SSL certificate
- Configure Nginx to use HTTPS
- Set up automatic renewal

### 5.2 Test Auto-Renewal
```bash
sudo certbot renew --dry-run
```

## Step 6: Configure Firewall

### 6.1 Setup UFW (Uncomplicated Firewall)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

## Step 7: Update Frontend Configuration

### 7.1 Update Frontend Environment Variables

In your frontend `.env` file (for production build):
```bash
VITE_API_URL=https://api.yourdomain.com/api
VITE_ENABLE_API_SYNC=true
```

### 7.2 Build Frontend with Production URL
```bash
# In your local machine or CI/CD
export VITE_API_URL=https://api.yourdomain.com/api
export VITE_ENABLE_API_SYNC=true
npm run build
```

The built frontend will have the production API URL embedded.

## Step 8: Monitoring and Maintenance

### 8.1 View Backend Logs
```bash
# Real-time logs
sudo journalctl -u serkor-backend -f

# Last 100 lines
sudo journalctl -u serkor-backend -n 100

# Logs since today
sudo journalctl -u serkor-backend --since today
```

### 8.2 Restart Backend
```bash
sudo systemctl restart serkor-backend
```

### 8.3 Update Backend Code
```bash
cd /home/serkor/serkor-dental
git pull
cd backend-python
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart serkor-backend
```

## Step 9: Security Hardening

### 9.1 Secure Environment File
```bash
chmod 600 /home/serkor/serkor-dental/backend-python/.env
chown serkor:serkor /home/serkor/serkor-dental/backend-python/.env
```

### 9.2 Disable Root Login (Optional)
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 9.3 Setup Fail2Ban (Optional)
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Step 10: Backup Strategy

### 10.1 Backup Environment File
```bash
# Backup .env to secure location
sudo cp /home/serkor/serkor-dental/backend-python/.env /backup/serkor-backend.env
```

### 10.2 Backup Google Sheets
- Google Sheets are automatically backed up by Google
- Consider exporting important data periodically

## Troubleshooting

### Backend Won't Start
```bash
# Check service status
sudo systemctl status serkor-backend

# Check logs
sudo journalctl -u serkor-backend -n 50

# Test manually
cd /home/serkor/serkor-dental/backend-python
source venv/bin/activate
python main.py
```

### Nginx 502 Bad Gateway
- Check if backend is running: `sudo systemctl status serkor-backend`
- Check backend logs: `sudo journalctl -u serkor-backend -f`
- Verify port 8000 is listening: `sudo netstat -tlnp | grep 8000`

### SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Permission Issues
```bash
# Fix ownership
sudo chown -R serkor:serkor /home/serkor/serkor-dental

# Fix permissions
chmod 600 /home/serkor/serkor-dental/backend-python/.env
```

## Quick Reference

```bash
# Start backend
sudo systemctl start serkor-backend

# Stop backend
sudo systemctl stop serkor-backend

# Restart backend
sudo systemctl restart serkor-backend

# View logs
sudo journalctl -u serkor-backend -f

# Reload Nginx
sudo systemctl reload nginx

# Test Nginx config
sudo nginx -t
```

## Production Checklist

- [ ] Backend running as systemd service
- [ ] Nginx configured as reverse proxy
- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (UFW)
- [ ] Environment variables set securely
- [ ] Google Sheets shared with service account
- [ ] Frontend configured with production API URL
- [ ] Backend logs being monitored
- [ ] Backup strategy in place
- [ ] Domain DNS pointing to VPS IP

## Next Steps

1. Deploy frontend to Vercel/Netlify with production API URL
2. Test all API endpoints from production
3. Monitor logs for any errors
4. Set up monitoring/alerting (optional: use services like UptimeRobot)
5. Regular backups of environment configuration

