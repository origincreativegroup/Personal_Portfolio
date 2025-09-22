#!/bin/bash

# PortfolioForge - Simplified Architecture Startup Script
# This script starts the new simplified React + Fastify setup

set -e

echo "🚀 Starting PortfolioForge (Simplified Architecture)"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Start the frontend
echo "🎨 Starting React frontend on http://localhost:3000..."
cd frontend && npm run dev &

# Wait a moment for frontend to start
sleep 2

# Check if frontend is running
if curl -s -f http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running successfully!"
else
    echo "⚠️  Frontend may still be starting up..."
fi

echo ""
echo "🎉 PortfolioForge is starting up!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:3001 (when ready)"
echo ""
echo "💡 The simplified architecture eliminates:"
echo "   - Qwik circular JSON errors"
echo "   - Multiple conflicting frameworks"
echo "   - Complex build configurations"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
wait
