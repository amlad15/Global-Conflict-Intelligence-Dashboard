#!/usr/bin/env bash
# ─── GCID Development Setup Script ───────────────────────────────────────────
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     GCID — Global Conflict Intelligence Dashboard        ║"
echo "║     Development Environment Setup                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "✗ $1 is not installed. Please install it first."
    exit 1
  else
    echo "✓ $1 found"
  fi
}

echo "Checking prerequisites..."
check_command docker
check_command node
check_command npm
echo ""

# Copy env file
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "✓ .env created — edit it to add API keys (optional)"
else
  echo "✓ .env already exists"
fi
echo ""

# Install dependencies
echo "Installing backend dependencies..."
(cd backend && npm install)
echo "✓ Backend deps installed"

echo "Installing worker dependencies..."
(cd workers && npm install)
echo "✓ Worker deps installed"

echo "Installing frontend dependencies..."
(cd frontend && npm install)
echo "✓ Frontend deps installed"
echo ""

# Start PostgreSQL
echo "Starting PostgreSQL with PostGIS..."
docker-compose up -d postgres
echo "Waiting for PostgreSQL to be ready..."
sleep 5

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Setup complete! Next steps:                             ║"
echo "║                                                          ║"
echo "║  Option A — Full Docker:                                 ║"
echo "║    docker-compose up --build                             ║"
echo "║                                                          ║"
echo "║  Option B — Local dev (3 terminals):                     ║"
echo "║    Terminal 1: cd backend && npm run dev                 ║"
echo "║    Terminal 2: cd workers && npm run dev                 ║"
echo "║    Terminal 3: cd frontend && npm run dev                ║"
echo "║                                                          ║"
echo "║  Don't forget to start Ollama:                           ║"
echo "║    ollama serve                                          ║"
echo "║    ollama pull llama3                                    ║"
echo "║                                                          ║"
echo "║  Dashboard: http://localhost:3000                        ║"
echo "║  API:       http://localhost:4000                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
