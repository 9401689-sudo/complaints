#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/mime-preview-lookup-utils.js"
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

echo "Checking mime-preview-lookup-utils exports..."
require_pattern '^export function isImageMime' "$UTILS_FILE" 'isImageMime export exists'
require_pattern '^export function isVideoMime' "$UTILS_FILE" 'isVideoMime export exists'
require_pattern '^export function isPdfMime' "$UTILS_FILE" 'isPdfMime export exists'
require_pattern '^export function guessMimeByFileName' "$UTILS_FILE" 'guessMimeByFileName export exists'

echo "Checking boundary re-exports and app wiring..."
require_pattern 'from "\./mime-preview-lookup-utils\.js"' "$BOUNDARY_FILE" 'boundary re-exports mime-preview-lookup-utils'
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'isImageMime' "$APP_FILE" 'app.js references isImageMime'
require_pattern 'isVideoMime' "$APP_FILE" 'app.js references isVideoMime'
require_pattern 'isPdfMime' "$APP_FILE" 'app.js references isPdfMime'
require_pattern 'guessMimeByFileName' "$APP_FILE" 'app.js references guessMimeByFileName'

echo "Checking removed local helper declarations in app.js..."
require_absent_pattern '^function isImageMime' "$APP_FILE" 'local isImageMime declaration removed'
require_absent_pattern '^function isVideoMime' "$APP_FILE" 'local isVideoMime declaration removed'
require_absent_pattern '^function isPdfMime' "$APP_FILE" 'local isPdfMime declaration removed'
require_absent_pattern '^function guessMimeByFileName' "$APP_FILE" 'local guessMimeByFileName declaration removed'

echo "MIME preview lookup smoke-check passed."
