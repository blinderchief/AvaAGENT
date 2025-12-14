#!/bin/bash
#
# AvaAgent Demo Runner
# Avalanche Hackathon 2025
#

echo ""
echo "======================================================"
echo "   AvaAgent Demo Runner"
echo "   Avalanche Hackathon 2025"
echo "======================================================"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    exit 1
fi

# Install requirements
echo "[1/3] Installing demo requirements..."
pip3 install requests rich web3 --quiet

# Check backend
echo "[2/3] Checking backend status..."
if ! curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    echo "[INFO] Backend not running. Please start it in a separate terminal:"
    echo "       cd backend"
    echo "       source .venv/bin/activate"
    echo "       uvicorn app.main:app --port 8000"
    echo ""
    read -p "Press Enter after starting the backend..."
fi

# Run the demo
echo "[3/3] Starting demo..."
echo ""
cd "$(dirname "$0")"
python3 demo.py
