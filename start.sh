#!/usr/bin/env bash

# ==============================================================================
# KrishiMitra — Local Quick-Start Script (macOS / Linux)
# ==============================================================================

set -e

echo ""
echo "================================================================="
echo "  🌱 Starting KrishiMitra Local Development Server               "
echo "  Direct Farm-to-Buyer Marketplace (SIH26033)                    "
echo "================================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed on your system."
    echo "Please download and install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node -v)"
echo "✓ npm version: $(npm -v)"
echo ""

# Check if .env exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo "⚙️ Creating .env configuration from .env.example..."
    cp .env.example .env
    echo "✓ .env file created."
fi

# Check if node_modules exists, otherwise install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing project dependencies (npm install)..."
    npm install
    echo "✓ Dependencies installed."
fi

echo ""
echo "🚀 Launching KrishiMitra server on http://localhost:3000..."
echo "Press Ctrl+C to stop the server."
echo ""

# Start development server
npm run dev
