#!/bin/bash

echo "🚀 Starting CREWCUTMAIN..."

# Kill any existing Node.js processes running on port 3010 (the app port)
echo "🔪 Killing existing instances on port 3010..."
lsof -ti:3010 | xargs kill -9 2>/dev/null || echo "No processes found on port 3010"

# Kill any existing Node.js processes running on port 3015 (desktop dev port)
echo "🔪 Killing existing instances on port 3015..."
lsof -ti:3015 | xargs kill -9 2>/dev/null || echo "No processes found on port 3015"

# Kill any existing pnpm dev processes
echo "🔪 Killing existing pnpm dev processes..."
pkill -f "pnpm dev" 2>/dev/null || echo "No pnpm dev processes found"

# Wait a moment for processes to fully terminate
sleep 2

echo "✨ Starting fresh instance..."
echo "🌐 App will be available at: http://localhost:3010"
echo "🖥️  Desktop mode available at: http://localhost:3015"
echo ""
echo "Press Ctrl+C to stop the app"
echo ""

# Start the development server
pnpm dev
