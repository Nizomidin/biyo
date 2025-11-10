#!/bin/bash
# Deployment script for VPS
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3.11 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝 Please create .env file with required environment variables"
    echo "   Copy from .env.example and fill in your values"
    exit 1
fi

# Check environment variables
echo "🔍 Checking environment variables..."
source .env

if [ -z "$GOOGLE_SHEETS_ID" ] || [ -z "$GOOGLE_CLIENT_EMAIL" ] || [ -z "$GOOGLE_PRIVATE_KEY" ]; then
    echo "❌ Error: Missing required environment variables!"
    echo "   Required: GOOGLE_SHEETS_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY"
    exit 1
fi

# Test backend
echo "🧪 Testing backend..."
python -c "from main import app; print('✅ Backend imports successfully')"

# Restart systemd service if it exists
if systemctl is-active --quiet serkor-backend 2>/dev/null; then
    echo "🔄 Restarting backend service..."
    sudo systemctl restart serkor-backend
    echo "✅ Backend service restarted"
elif [ -f "/etc/systemd/system/serkor-backend.service" ]; then
    echo "🔄 Starting backend service..."
    sudo systemctl start serkor-backend
    echo "✅ Backend service started"
else
    echo "ℹ️  Backend service not found. Run manually with:"
    echo "   python main.py"
    echo "   or"
    echo "   uvicorn main:app --host 0.0.0.0 --port 8000"
fi

echo "✅ Deployment complete!"
echo ""
echo "📊 Check status: sudo systemctl status serkor-backend"
echo "📋 View logs: sudo journalctl -u serkor-backend -f"
echo "🌐 Test API: curl http://localhost:8000/health"

