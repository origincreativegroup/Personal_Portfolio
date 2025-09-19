#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_ONLY=0
SKIP_INSTALL=0
USE_DOCKER=1
RUN_PRISMA=0
VITE_API_BASE_URL_DEFAULT="http://localhost:3001"

usage() {
  cat <<'USAGE'
Usage: scripts/startup.sh [options]

Bootstraps the portfolio workspace by installing dependencies, starting
supporting services, and launching both the backend API and the React front-end.

Options:
  --frontend-only     Skip backend, Prisma, and Docker setup.
  --skip-install      Assume dependencies are already installed.
  --no-docker         Do not attempt to start Docker Compose services.
  --prisma-deploy     Run `prisma migrate deploy` before starting the backend.
  -h, --help          Show this help message.

Press Ctrl+C at any time to stop the dev servers. Docker services started by
this script stay running so you can restart quickly (use `docker compose down`
when you want to stop them).
USAGE
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: '$1' is required but was not found in PATH." >&2
    exit 1
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --frontend-only)
      FRONTEND_ONLY=1
      USE_DOCKER=0
      ;;
    --skip-install)
      SKIP_INSTALL=1
      ;;
    --no-docker)
      USE_DOCKER=0
      ;;
    --prisma-deploy)
      RUN_PRISMA=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

require_command npm

if [[ "$SKIP_INSTALL" -ne 1 ]]; then
  echo "Installing front-end dependencies..."
  (cd "$ROOT_DIR" && npm install)

  if [[ "$FRONTEND_ONLY" -ne 1 ]]; then
    echo "Installing backend dependencies..."
    (cd "$ROOT_DIR/server" && npm install)
  fi
fi

if [[ "$FRONTEND_ONLY" -ne 1 ]]; then
  export VITE_API_BASE_URL="${VITE_API_BASE_URL:-$VITE_API_BASE_URL_DEFAULT}"

  if [[ "$USE_DOCKER" -eq 1 ]]; then
    if command -v docker >/dev/null 2>&1; then
      if docker compose version >/dev/null 2>&1; then
        echo "Starting Docker services (Postgres, Redis, backend image)..."
        (cd "$ROOT_DIR" && docker compose up -d)
      else
        echo "Warning: docker compose is not available. Skip Docker startup." >&2
      fi
    else
      echo "Warning: docker command is not available. Skip Docker startup." >&2
    fi
  fi

  if [[ "$RUN_PRISMA" -eq 1 ]]; then
    echo "Running Prisma migrations..."
    (cd "$ROOT_DIR/server" && npx prisma migrate deploy)
  fi
fi

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && ps -p "$BACKEND_PID" >/dev/null 2>&1; then
    echo "Stopping backend (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

if [[ "$FRONTEND_ONLY" -ne 1 ]]; then
  echo "Starting backend on http://localhost:3001 ..."
  (cd "$ROOT_DIR/server" && npm run dev) &
  BACKEND_PID=$!
  sleep 2
fi

echo "Starting front-end on http://localhost:5173 ..."
cd "$ROOT_DIR"
npm run dev -- --host 0.0.0.0

if [[ "$FRONTEND_ONLY" -ne 1 && -n "${BACKEND_PID:-}" ]]; then
  wait "$BACKEND_PID"
fi
