#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-3006}"
FRONTEND_PORT="${FRONTEND_PORT:-3005}"

cd "$ROOT_DIR"

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -t -i :"${port}" || true)
  if [[ -n "${pids}" ]]; then
    echo "Stopping processes on port ${port}: ${pids}"
    kill ${pids} 2>/dev/null || kill -9 ${pids} 2>/dev/null || true
    sleep 1
  fi
}

kill_port "${BACKEND_PORT}"
kill_port "${FRONTEND_PORT}"

echo "Starting backend on port ${BACKEND_PORT} (npm run dev)..."
PORT="${BACKEND_PORT}" FRONTEND_URL="http://localhost:${FRONTEND_PORT}" npm run dev &
backend_pid=$!

echo "Starting frontend on port ${FRONTEND_PORT} (npm --prefix frontend run dev)..."
PORT="${FRONTEND_PORT}" npm --prefix frontend run dev &
frontend_pid=$!

cleanup() {
  for pid in "${backend_pid:-}" "${frontend_pid:-}"; do
    if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
      kill "${pid}" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT

wait -n "${backend_pid}" "${frontend_pid}"
exit $?
