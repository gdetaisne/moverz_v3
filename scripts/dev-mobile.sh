#!/bin/bash

# Script pour lancer le dev mobile facilement

echo "🚀 Starting Mobile Dev Server"
echo "=============================="
echo ""

cd "$(dirname "$0")/../apps/web-mobile" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
  echo ""
fi

echo "🌐 Mobile app will be available at:"
echo "   http://localhost:5174"
echo ""
echo "💡 Backend should be running on http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop"
echo ""

pnpm dev

