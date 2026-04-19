#!/bin/bash
# PixelPack — Setup Script
# Run: bash setup.sh

set -e

echo ""
echo "⬡  PixelPack — Setup"
echo "========================"
echo ""

# Check Node.js version
NODE_VER=$(node -v 2>/dev/null || echo "")
if [ -z "$NODE_VER" ]; then
  echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
  exit 1
fi

NODE_MAJOR=$(echo "$NODE_VER" | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "❌ Node.js 18+ is required. You have $NODE_VER"
  exit 1
fi

echo "✅ Node.js $NODE_VER detected"
echo ""

# Backend
echo "📦 Installing backend dependencies..."
cd backend
npm install
cp -n .env.example .env 2>/dev/null || true
cd ..
echo "✅ Backend ready"
echo ""

# Frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo "✅ Frontend ready"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "To start development:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm start"
echo ""
echo "Then open http://localhost:3000"
echo ""
