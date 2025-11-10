# Production Deployment Guide

This guide covers deploying both frontend and backend to production.

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│   Frontend      │────────▶│   Backend API    │────────▶│  Google Sheets  │
│   (Vercel)      │  HTTPS  │   (VPS)          │  HTTPS  │                 │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Step 1: Deploy Backend to VPS

### 1.1 Follow VPS Deployment Guide
See `backend-python/DEPLOY_VPS.md` for complete instructions.

**Quick summary:**
1. SSH into your VPS
2. Clone repository
3. Install Python dependencies
4. Configure `.env` file with Google Sheets credentials
5. Setup systemd service
6. Configure Nginx reverse proxy
7. Install SSL certificate with Let's Encrypt

### 1.2 Backend URL
After deployment, your backend will be available at:
- `https://api.yourdomain.com` (if using domain)
- Or `http://YOUR_VPS_IP:8000` (if using IP directly)

## Step 2: Configure Frontend for Production

### 2.1 Update Environment Variables

Create a `.env.production` file in the root directory:

```bash
VITE_API_URL=https://api.yourdomain.com/api
VITE_ENABLE_API_SYNC=true
```

### 2.2 Build Frontend with Production URL

**Option A: Local Build**
```bash
# Set production environment variables
export VITE_API_URL=https://api.yourdomain.com/api
export VITE_ENABLE_API_SYNC=true

# Build
npm run build

# The dist/ folder contains your production build
```

**Option B: Vercel Deployment (Recommended)**

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - `VITE_API_URL` = `https://api.yourdomain.com/api`
   - `VITE_ENABLE_API_SYNC` = `true`
4. Redeploy your application

Vercel will automatically use these variables during build.

### 2.3 Deploy to Vercel

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel --prod
```

Or push to your main branch if auto-deployment is enabled.

## Step 3: Verify Deployment

### 3.1 Test Backend
```bash
# Health check
curl https://api.yourdomain.com/health

# Should return: {"ok": true, "timestamp": "..."}
```

### 3.2 Test Frontend
1. Open your deployed frontend URL
2. Try logging in or creating a patient
3. Check browser console for any API errors
4. Verify data appears in Google Sheets

### 3.3 Check CORS
If you see CORS errors, ensure:
- Backend CORS middleware allows your frontend domain
- Nginx is properly configured (see DEPLOY_VPS.md)

## Step 4: Domain Configuration

### 4.1 Backend Domain (api.yourdomain.com)
- Point A record to your VPS IP
- SSL certificate will be handled by Certbot

### 4.2 Frontend Domain
- Configure in Vercel project settings
- Add custom domain in Vercel dashboard
- DNS records will be provided by Vercel

## Step 5: Security Checklist

### Backend Security
- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] Environment variables secured (600 permissions)
- [ ] Service account has minimal required permissions
- [ ] Regular security updates applied
- [ ] Backend logs monitored

### Frontend Security
- [ ] HTTPS enabled (Vercel does this automatically)
- [ ] Environment variables not exposed in client code
- [ ] CORS properly configured
- [ ] API keys stored securely (backend only)

## Step 6: Monitoring

### 6.1 Backend Monitoring
```bash
# View real-time logs
sudo journalctl -u serkor-backend -f

# Check service status
sudo systemctl status serkor-backend

# View recent errors
sudo journalctl -u serkor-backend -p err -n 50
```

### 6.2 Frontend Monitoring
- Use Vercel analytics dashboard
- Monitor browser console for errors
- Set up error tracking (Sentry, etc.)

### 6.3 External Monitoring
Consider using:
- **UptimeRobot**: Monitor backend availability
- **Sentry**: Error tracking for both frontend and backend
- **Google Analytics**: Frontend usage analytics

## Step 7: Backup Strategy

### 7.1 Backend Configuration
```bash
# Backup .env file
sudo cp /home/serkor/serkor-dental/backend-python/.env /backup/serkor-backend.env

# Backup systemd service file
sudo cp /etc/systemd/system/serkor-backend.service /backup/
```

### 7.2 Google Sheets
- Google automatically backs up Sheets
- Consider periodic exports of critical data
- Use Google Takeout for full backup

### 7.3 Frontend
- Code is in Git repository (backed up)
- Build artifacts can be regenerated
- Environment variables stored in Vercel

## Step 8: Updates and Maintenance

### 8.1 Update Backend
```bash
# SSH into VPS
ssh user@your-vps-ip

# Navigate to backend directory
cd /home/serkor/serkor-dental/backend-python

# Pull latest changes
git pull

# Run deployment script
./deploy.sh

# Or manually:
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart serkor-backend
```

### 8.2 Update Frontend
- Push changes to Git repository
- Vercel will auto-deploy if connected to Git
- Or manually deploy: `vercel --prod`

### 8.3 SSL Certificate Renewal
Certbot automatically renews certificates. Test renewal:
```bash
sudo certbot renew --dry-run
```

## Troubleshooting

### Backend Not Responding
1. Check service status: `sudo systemctl status serkor-backend`
2. Check logs: `sudo journalctl -u serkor-backend -n 50`
3. Test locally: `curl http://localhost:8000/health`
4. Check Nginx: `sudo nginx -t && sudo systemctl status nginx`

### Frontend Can't Connect to Backend
1. Verify backend URL in frontend env vars
2. Check CORS configuration in backend
3. Test backend directly: `curl https://api.yourdomain.com/health`
4. Check browser console for specific errors
5. Verify SSL certificate is valid

### Google Sheets Not Updating
1. Verify service account has Editor access to sheet
2. Check backend logs for Google API errors
3. Test Google Sheets API credentials
4. Verify spreadsheet ID is correct

### SSL Certificate Issues
1. Check certificate: `sudo certbot certificates`
2. Renew manually: `sudo certbot renew`
3. Verify Nginx configuration: `sudo nginx -t`
4. Check DNS records point to correct IP

## Production URLs

After deployment, you should have:

- **Frontend**: `https://yourdomain.com` (or Vercel URL)
- **Backend API**: `https://api.yourdomain.com/api`
- **Backend Health**: `https://api.yourdomain.com/health`
- **API Docs**: `https://api.yourdomain.com/docs` (FastAPI automatic docs)

## Cost Estimation

### VPS Hosting
- **DigitalOcean**: $6-12/month (basic droplet)
- **Linode**: $5-10/month
- **Vultr**: $6-12/month
- **AWS Lightsail**: $5-10/month

### Domain
- **Domain name**: $10-15/year

### Frontend Hosting
- **Vercel**: Free tier (generous limits)
- **Netlify**: Free tier

### Google Sheets
- **Free**: Up to 10 million cells
- Should be sufficient for most use cases

### Total Monthly Cost
- **Minimum**: ~$6-12/month (VPS + domain)
- **Recommended**: ~$10-15/month with better VPS specs

## Next Steps

1. ✅ Deploy backend to VPS
2. ✅ Configure frontend with production API URL
3. ✅ Deploy frontend to Vercel
4. ✅ Set up monitoring
5. ✅ Configure backups
6. ✅ Test all functionality
7. ✅ Set up alerts for downtime
8. ✅ Document any custom configurations

## Support

For issues or questions:
1. Check logs: `sudo journalctl -u serkor-backend -f`
2. Review deployment guide: `backend-python/DEPLOY_VPS.md`
3. Check FastAPI docs: `https://api.yourdomain.com/docs`
4. Review Google Sheets API documentation

