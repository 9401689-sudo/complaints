#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/text-display-utils.js"
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

echo "Checking text-display-utils exports..."
require_pattern '^export function escapeHtml' "$UTILS_FILE" 'escapeHtml export exists'
require_pattern '^export function shorten' "$UTILS_FILE" 'shorten export exists'
require_pattern '^export function sanitizeFilename' "$UTILS_FILE" 'sanitizeFilename export exists'
require_pattern '^export function formatUrlPreview' "$UTILS_FILE" 'formatUrlPreview export exists'

echo "Checking boundary re-exports and app wiring..."
require_pattern 'from "\./text-display-utils\.js"' "$BOUNDARY_FILE" 'boundary re-exports text-display-utils'
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'escapeHtml' "$APP_FILE" 'app.js references escapeHtml'
require_pattern 'shorten' "$APP_FILE" 'app.js references shorten'
require_pattern 'sanitizeFilename' "$APP_FILE" 'app.js references sanitizeFilename'
require_pattern 'formatUrlPreview' "$APP_FILE" 'app.js references formatUrlPreview'

echo "Checking removed local helper declarations in app.js..."
require_absent_pattern '^function escapeHtml' "$APP_FILE" 'local escapeHtml declaration removed'
require_absent_pattern '^function shorten' "$APP_FILE" 'local shorten declaration removed'
require_absent_pattern '^function sanitizeFilename' "$APP_FILE" 'local sanitizeFilename declaration removed'
require_absent_pattern '^function formatUrlPreview' "$APP_FILE" 'local formatUrlPreview declaration removed'

echo "Text-display-utils smoke-check passed."
