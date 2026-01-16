#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Defaults aligned with nginx: frontend 3005, backend 3006
BACKEND_PORT="${BACKEND_PORT:-3006}"
FRONTEND_PORT="${FRONTEND_PORT:-3005}"

# Stop any existing processes first to avoid duplicates
"${SCRIPT_DIR}/stop_all.sh"

echo "Starting stack (frontend: ${FRONTEND_PORT}, backend: ${BACKEND_PORT})..."

# Delegate to the existing start script, keeping ports consistent
BACKEND_PORT="${BACKEND_PORT}" FRONTEND_PORT="${FRONTEND_PORT}" exec "${ROOT_DIR}/start.sh"
