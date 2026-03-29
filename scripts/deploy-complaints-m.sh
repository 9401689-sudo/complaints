#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-oigoabtsgr}"
REMOTE_DIR="${2:-/var/www/complaints-backend/complaints_m}"
BRANCH="${3:-multi-user}"
SERVICE="${4:-complaints-backend-m}"

echo "Deploy host: ${HOST}"
echo "Remote dir: ${REMOTE_DIR}"
echo "Branch: ${BRANCH}"

ssh "${HOST}" "cd '${REMOTE_DIR}' \
  && git fetch origin \
  && git checkout '${BRANCH}' \
  && git pull --ff-only origin '${BRANCH}' \
  && docker compose up -d --build \
  && docker logs --tail=80 '${SERVICE}'"

echo "Deploy completed."
