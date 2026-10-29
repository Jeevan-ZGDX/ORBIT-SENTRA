#!/usr/bin/env bash
# ============================================================
# ASTRA-Guard - Local Development Orchestrator
# NASA Space Apps Challenge 2026
# ============================================================

set -e

echo "🚀 [1/3] Verifying PostgreSQL container..."
if ! docker ps | grep -q astra_guard_postgres; then
    echo "Starting PostgreSQL via docker compose..."
    docker compose up -d postgres
    sleep 3
fi

echo "🛰️ [2/3] Starting FastAPI Backend on port 8000..."
source backend/venv/bin/activate
PYTHONPATH=. uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "🖥️ [3/3] Starting Next.js PWA Frontend on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "============================================================"
echo " ASTRA-Guard Development Environment is ACTIVE"
echo " - Frontend Dashboard: http://localhost:3000"
echo " - FastAPI API Docs:   http://localhost:8000/docs"
echo " - Backend API:        http://localhost:8000/api/v1"
echo " - Press Ctrl+C to terminate both servers"
echo "============================================================"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit" INT TERM
wait
