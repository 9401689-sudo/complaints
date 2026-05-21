#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/case-status-badge-utils.js"
BOUNDARY_FILE="$ROOT_DIR/safe-modules-boundary.js"

require_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "[FAIL] file not found: $file" >&2
    exit 1
  fi
}

require_pattern() {
  local pattern="$1"
  local file="$2"
  local title="$3"
  if grep -Eq "$pattern" "$file"; then
    echo "[OK] $title"
  else
    echo "[FAIL] $title" >&2
    exit 1
  fi
}

require_absent_pattern() {
  local pattern="$1"
  local file="$2"
  local title="$3"
  if grep -Eq "$pattern" "$file"; then
    echo "[FAIL] $title" >&2
    exit 1
  else
    echo "[OK] $title"
  fi
}

require_file "$APP_FILE"
require_file "$UTILS_FILE"
require_file "$BOUNDARY_FILE"

echo "Checking case-status-badge-utils exports..."
require_pattern '^export function getCaseStatusBadges' "$UTILS_FILE" 'getCaseStatusBadges export exists'

echo "Checking boundary re-exports and app wiring..."
require_pattern 'from "\./case-status-badge-utils\.js"' "$BOUNDARY_FILE" 'boundary re-exports case-status-badge-utils'
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'getCaseStatusBadges' "$APP_FILE" 'app.js references getCaseStatusBadges'

echo "Checking removed local helper declaration in app.js..."
require_absent_pattern '^function getCaseStatusBadges' "$APP_FILE" 'local getCaseStatusBadges declaration removed'

echo "Case-status badge utils smoke-check passed."
