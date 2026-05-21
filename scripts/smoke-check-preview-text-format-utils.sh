#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/preview-text-format-utils.js"
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

echo "Checking preview-text-format-utils exports..."
require_pattern '^export function getPreviewBadgeText' "$UTILS_FILE" 'getPreviewBadgeText export exists'
require_pattern '^export function getPdfPreviewFrameSrc' "$UTILS_FILE" 'getPdfPreviewFrameSrc export exists'
require_pattern '^export function getPreviewFallbackTileText' "$UTILS_FILE" 'getPreviewFallbackTileText export exists'

echo "Checking boundary re-exports and app wiring..."
require_pattern 'from "\./preview-text-format-utils\.js"' "$BOUNDARY_FILE" 'boundary re-exports preview-text-format-utils'
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'getPreviewBadgeText' "$APP_FILE" 'app.js references getPreviewBadgeText'
require_pattern 'getPdfPreviewFrameSrc' "$APP_FILE" 'app.js references getPdfPreviewFrameSrc'
require_pattern 'getPreviewFallbackTileText' "$APP_FILE" 'app.js references getPreviewFallbackTileText'

echo "Checking inline preview text/format fragments were removed from app.js..."
require_absent_pattern '<span class="thumb-badge">Видео</span>' "$APP_FILE" 'inline Видео badge removed'
require_absent_pattern '<span class="thumb-badge">PDF</span>' "$APP_FILE" 'inline PDF badge removed'
require_absent_pattern 'src="\$\{src\}#toolbar=0&navpanes=0&scrollbar=0"' "$APP_FILE" 'inline PDF iframe src format removed'
require_absent_pattern '\(mimeType \|\| "FILE"\)\.toUpperCase\(\)' "$APP_FILE" 'inline fallback MIME tile text format removed'

echo "Preview text/format utils smoke-check passed."
