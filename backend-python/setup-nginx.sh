#!/bin/bash
# Quick Nginx setup script for Serkor Backend
# Run this on your VPS: sudo bash setup-nginx.sh

set -e

echo "🔧 Setting up Nginx reverse proxy for Serkor Backend..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt update
    apt install -y nginx
fi

# Get current user (for systemd service)
CURRENT_USER=${SUDO_USER:-$USER}
if [ "$CURRENT_USER" = "root" ]; then
    CURRENT_USER=$(who am i | awk '{print $1}')
fi

# Get backend path
BACKEND_PATH=$(pwd)
if [ ! -f "$BACKEND_PATH/main.py" ]; then
    echo "❌ Error: main.py not found in current directory"
    echo "   Please run this script from the backend-python directory"
    exit 1
fi

# Create Nginx config
echo "📝 Creating Nginx configuration..."
cat > /etc/nginx/sites-available/serkor-backend << EOF
server {
    listen 80;
    server_name _;  # Accept all hostnames

    # Increase body size for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeouts
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Enable site
echo "🔗 Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/serkor-backend /etc/nginx/sites-enabled/

# Remove default site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# Restart Nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx

# Configure firewall
echo "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow 22/tcp
    echo "✅ Firewall configured"
else
    echo "⚠️  UFW not found, please configure firewall manually"
fi

# Test backend connection
echo "🧪 Testing backend connection..."
sleep 2
if curl -s http://localhost:4000/health > /dev/null; then
    echo "✅ Backend is accessible on port 4000"
else
    echo "⚠️  Warning: Backend might not be running on port 4000"
    echo "   Make sure backend is running: sudo systemctl status serkor-backend"
fi

# Test Nginx proxy
echo "🧪 Testing Nginx proxy..."
sleep 2
if curl -s http://localhost/health > /dev/null; then
    echo "✅ Nginx proxy is working"
else
    echo "⚠️  Warning: Nginx proxy test failed"
    echo "   Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Backend is now accessible at:"
echo "   - Direct: http://$(hostname -I | awk '{print $1}'):4000"
echo "   - Via Nginx: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "🌐 Update your frontend .env:"
echo "   VITE_API_URL=http://$(hostname -I | awk '{print $1}')/api"
echo ""
echo "📋 Useful commands:"
echo "   - Check Nginx status: sudo systemctl status nginx"
echo "   - Check backend status: sudo systemctl status serkor-backend"
echo "   - View Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   - Restart Nginx: sudo systemctl restart nginx"
echo ""
echo "🔒 For HTTPS (if you have a domain):"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d yourdomain.com"

