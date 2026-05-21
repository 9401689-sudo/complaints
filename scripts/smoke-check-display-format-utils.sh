#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/display-format-utils.js"
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

echo "Checking display-format-utils exports..."
require_pattern '^export function getVisibilityLabel' "$UTILS_FILE" 'getVisibilityLabel export exists'
require_pattern '^export function formatBytes' "$UTILS_FILE" 'formatBytes export exists'

echo "Checking boundary re-exports and app wiring..."
require_pattern 'from "\./display-format-utils\.js"' "$BOUNDARY_FILE" 'boundary re-exports display-format-utils'
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'getVisibilityLabel' "$APP_FILE" 'app.js references getVisibilityLabel'
require_pattern 'formatBytes' "$APP_FILE" 'app.js references formatBytes'

echo "Checking removed local declarations in app.js..."
require_absent_pattern '^function getVisibilityLabel' "$APP_FILE" 'local getVisibilityLabel declaration removed'
require_absent_pattern '^function formatBytes' "$APP_FILE" 'local formatBytes declaration removed'

echo "Display-format-utils smoke-check passed."
