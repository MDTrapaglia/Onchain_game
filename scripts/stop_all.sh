#!/usr/bin/env bash
set -euo pipefail

# Defaults aligned with nginx: frontend 3005, backend 3006
BACKEND_PORT="${BACKEND_PORT:-3006}"
FRONTEND_PORT="${FRONTEND_PORT:-3005}"

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -t -i :"${port}" || true)
  if [[ -n "${pids}" ]]; then
    echo "Stopping processes on port ${port}: ${pids}"
    kill ${pids} 2>/dev/null || kill -9 ${pids} 2>/dev/null || true
  else
    echo "No processes found on port ${port}"
  fi
}

kill_port "${BACKEND_PORT}"
kill_port "${FRONTEND_PORT}"
