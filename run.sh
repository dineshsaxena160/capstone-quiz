#!/usr/bin/env bash
set -euo pipefail

# Project locations and service ports. Override the ports when launching, for example:
# BACKEND_PORT=3010 FRONTEND_PORT=5174 ./run.sh
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/logs"
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_URL="http://localhost:${BACKEND_PORT}"
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
STARTUP_TIMEOUT_SECONDS=30

BACKEND_PID=""
FRONTEND_PID=""

# Stop a background service and wait for its process to exit.
stop_process() {
  local process_id="$1"

  if [[ -n "$process_id" ]] && kill -0 "$process_id" 2>/dev/null; then
    kill "$process_id" 2>/dev/null || true
    wait "$process_id" 2>/dev/null || true
  fi
}

# Clean up both development servers when the launcher exits or receives Ctrl+C.
cleanup() {
  local exit_code=$?

  trap - EXIT INT TERM
  stop_process "$FRONTEND_PID"
  stop_process "$BACKEND_PID"

  if ((exit_code == 130)); then
    echo "Stopped by Ctrl+C."
  elif ((exit_code != 0)); then
    echo "Application stopped with an error." >&2
  fi

  exit "$exit_code"
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Confirm the required command-line tools and install workspace dependencies only when needed.
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required to start this application." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required to check server readiness." >&2
  exit 1
fi

mkdir -p "$LOG_DIR"

if [[ ! -d "$ROOT_DIR/node_modules" || ! -x "$ROOT_DIR/node_modules/.bin/tsx" || ! -x "$ROOT_DIR/node_modules/.bin/vite" ]]; then
  echo "Installing workspace dependencies..."
  (cd "$ROOT_DIR" && npm install)
fi

# Start the Express API from its package directory and send all output to its log.
echo "Starting backend on $BACKEND_URL..."
(
  cd "$BACKEND_DIR"
  PORT="$BACKEND_PORT" CLIENT_ORIGIN="$FRONTEND_URL" npm run dev
) >"$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Start the Vite development server from its package directory and send all output to its log.
echo "Starting frontend on $FRONTEND_URL..."
(
  cd "$FRONTEND_DIR"
  VITE_API_BASE_URL="$BACKEND_URL" npm run dev -- --host localhost --port "$FRONTEND_PORT"
) >"$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Poll each endpoint so the browser opens only after both services are ready.
wait_for_url() {
  local service_name="$1"
  local url="$2"
  local process_id="$3"
  local deadline=$((SECONDS + STARTUP_TIMEOUT_SECONDS))

  until curl --silent --show-error --fail --max-time 2 "$url" >/dev/null 2>&1; do
    if ! kill -0 "$process_id" 2>/dev/null; then
      echo "Error: $service_name stopped before becoming reachable." >&2
      echo "See $LOG_DIR/${service_name}.log for details." >&2
      return 1
    fi

    if ((SECONDS >= deadline)); then
      echo "Error: $service_name did not become reachable within ${STARTUP_TIMEOUT_SECONDS} seconds." >&2
      echo "See $LOG_DIR/${service_name}.log for details." >&2
      return 1
    fi

    sleep 1
  done

  echo "$service_name is ready."
}

wait_for_url "backend" "$BACKEND_URL/health" "$BACKEND_PID"
wait_for_url "frontend" "$FRONTEND_URL" "$FRONTEND_PID"

# Open the running frontend in Google Chrome, with platform-specific fallbacks.
open_frontend() {
  echo "Opening browser at $FRONTEND_URL..."

  case "${OSTYPE:-}" in
    linux*)
      if command -v google-chrome >/dev/null 2>&1; then
        google-chrome "$FRONTEND_URL" >/dev/null 2>&1 &
      elif command -v google-chrome-stable >/dev/null 2>&1; then
        google-chrome-stable "$FRONTEND_URL" >/dev/null 2>&1 &
      elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$FRONTEND_URL" >/dev/null 2>&1 &
        echo "Google Chrome was not found; opened the URL with the system browser."
      else
        echo "Google Chrome and xdg-open were not found. Open $FRONTEND_URL manually."
      fi
      ;;
    darwin*)
      if command -v open >/dev/null 2>&1 && open -a "Google Chrome" "$FRONTEND_URL" >/dev/null 2>&1; then
        :
      elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$FRONTEND_URL" >/dev/null 2>&1 &
        echo "Google Chrome was not found; opened the URL with the system browser."
      else
        echo "Google Chrome was not found. Open $FRONTEND_URL manually."
      fi
      ;;
    msys*|mingw*|cygwin*)
      if start chrome "$FRONTEND_URL" >/dev/null 2>&1; then
        :
      elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$FRONTEND_URL" >/dev/null 2>&1 &
        echo "Google Chrome was not found; opened the URL with the system browser."
      else
        echo "Google Chrome was not found. Open $FRONTEND_URL manually."
      fi
      ;;
    *)
      if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$FRONTEND_URL" >/dev/null 2>&1 &
        echo "Google Chrome was not found; opened the URL with the system browser."
      else
        echo "Open $FRONTEND_URL manually."
      fi
      ;;
  esac
}

open_frontend
echo "Quiz app is running. Press Ctrl+C to stop both servers."

# Keep this launcher in the foreground so its signal traps remain active.
while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 1
done

echo "Error: a development server stopped unexpectedly." >&2
exit 1