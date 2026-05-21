#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/label-lookup-utils.js"
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

echo "Checking label-lookup-utils exports..."
require_pattern '^export function roleLabel' "$UTILS_FILE" 'roleLabel export exists'
require_pattern '^export function getCategoryLabel' "$UTILS_FILE" 'getCategoryLabel export exists'
require_pattern '^export function getAdminUserFilterValue' "$UTILS_FILE" 'getAdminUserFilterValue export exists'

echo "Checking boundary re-exports and app wiring..."
require_pattern 'from "\./label-lookup-utils\.js"' "$BOUNDARY_FILE" 'boundary re-exports label-lookup-utils'
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'roleLabel' "$APP_FILE" 'app.js references roleLabel'
require_pattern 'getCategoryLabel' "$APP_FILE" 'app.js references getCategoryLabel'
require_pattern 'getAdminUserFilterValue' "$APP_FILE" 'app.js references getAdminUserFilterValue'

echo "Checking removed local helper declarations in app.js..."
require_absent_pattern '^function roleLabel' "$APP_FILE" 'local roleLabel declaration removed'
require_absent_pattern '^function getCategoryLabel' "$APP_FILE" 'local getCategoryLabel declaration removed'
require_absent_pattern '^function getAdminUserFilterValue' "$APP_FILE" 'local getAdminUserFilterValue declaration removed'

echo "Label-lookup-utils smoke-check passed."
