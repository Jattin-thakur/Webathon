#!/bin/bash

# RTB DSP ML Setup Script
# Automates the entire ML pipeline setup

echo "=========================================="
echo "RTB DSP Machine Learning Setup"
echo "=========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Create virtual environment
echo ""
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install -r requirements.txt

# Generate dataset
echo ""
echo "=========================================="
echo "Step 1: Generating Dataset"
echo "=========================================="
python generate_dataset.py

# Train models
echo ""
echo "=========================================="
echo "Step 2: Training Models"
echo "=========================================="
python train_ctr_cvr_model.py

# Test API
echo ""
echo "=========================================="
echo "Step 3: Testing API"
echo "=========================================="
echo "Starting API server in background..."
python model_api.py &
API_PID=$!

# Wait for API to start
sleep 5

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:5000/health | python -m json.tool

# Test prediction endpoint
echo ""
echo "Testing prediction endpoint..."
curl -s -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "userAge": 30,
    "deviceType": 1,
    "location": 0,
    "timeOfDay": 14,
    "adCategory": 3,
    "frequencyCount": 2,
    "floorPrice": 1.5,
    "competitionLevel": 2
  }' | python -m json.tool

# Stop API server
echo ""
echo "Stopping API server..."
kill $API_PID

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Files created:"
echo "  - rtb_dataset.csv (100,000 samples)"
echo "  - models/ctr_model.pkl"
echo "  - models/cvr_model.pkl"
echo "  - models/metrics.json"
echo "  - models/training_report.txt"
echo ""
echo "To start the API server:"
echo "  python model_api.py"
echo ""
echo "To activate virtual environment:"
echo "  source venv/bin/activate"
echo ""
