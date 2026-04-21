#!/bin/bash

echo "🚀 Starting Aviator Project Setup..."

# 1. Setup Server
echo "📦 Installing Server Dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Server npm install failed!"
    exit 1
fi

# 2. Setup Client
echo "📦 Installing Client Dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Client npm install failed!"
    exit 1
fi

# 3. Running
echo "✨ Setup Complete!"
echo "------------------------------------------------"
echo "To run the project, open TWO terminals:"
echo ""
echo "Terminal 1 (Server):"
echo "cd server && npm start"
echo ""
echo "Terminal 2 (Frontend):"
echo "cd client && npm run dev"
echo "------------------------------------------------"
echo "Note: The server will automatically create a 'database.sqlite' file."
