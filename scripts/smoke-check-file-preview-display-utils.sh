#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/file-preview-display-utils.js"
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

echo "Checking file-preview-display-utils exports..."
require_pattern '^export function getPreviewFileMeta' "$UTILS_FILE" 'getPreviewFileMeta export exists'
require_pattern '^export function getPreviewDisplayKind' "$UTILS_FILE" 'getPreviewDisplayKind export exists'
require_pattern '^export function getPreviewWrapperAttr' "$UTILS_FILE" 'getPreviewWrapperAttr export exists'

echo "Checking boundary re-exports and app wiring..."
require_pattern 'from "\./file-preview-display-utils\.js"' "$BOUNDARY_FILE" 'boundary re-exports file-preview-display-utils'
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'getPreviewFileMeta' "$APP_FILE" 'app.js references getPreviewFileMeta'
require_pattern 'getPreviewDisplayKind' "$APP_FILE" 'app.js references getPreviewDisplayKind'
require_pattern 'getPreviewWrapperAttr' "$APP_FILE" 'app.js references getPreviewWrapperAttr'

echo "Checking inline preview decision fragments were removed from app.js..."
require_absent_pattern 'const mimeType = file\.mime_type \|\| file\.mimeType \|\| guessMimeByFileName\(file\.file_name \|\| file\.fileName \|\| ""\);' "$APP_FILE" 'inline MIME/title decision in getPreviewMarkup removed'
require_absent_pattern 'const previewAttr = opts\.attrName \|\| "data-preview-file-id";' "$APP_FILE" 'inline preview attr decision removed'
require_absent_pattern 'const clickable = opts\.clickable !== false;' "$APP_FILE" 'inline clickable decision removed'

echo "File preview display utils smoke-check passed."
