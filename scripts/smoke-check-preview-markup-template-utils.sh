#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/preview-markup-template-utils.js"
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

echo "Checking preview-markup-template-utils exports..."
require_pattern '^export function buildPreviewMarkupByKind' "$UTILS_FILE" 'buildPreviewMarkupByKind export exists'

echo "Checking boundary re-exports and app wiring..."
require_pattern 'from "\./preview-markup-template-utils\.js"' "$BOUNDARY_FILE" 'boundary re-exports preview-markup-template-utils'
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'buildPreviewMarkupByKind' "$APP_FILE" 'app.js references buildPreviewMarkupByKind'

echo "Checking template-selection branch moved out of app.js..."
require_absent_pattern 'if \(previewKind === "image"\)' "$APP_FILE" 'inline image template-selection branch removed from app.js'
require_absent_pattern 'if \(previewKind === "video"\)' "$APP_FILE" 'inline video template-selection branch removed from app.js'
require_absent_pattern 'if \(previewKind === "pdf"\)' "$APP_FILE" 'inline pdf template-selection branch removed from app.js'
require_absent_pattern '<video class="media-thumb"' "$APP_FILE" 'inline video preview markup removed from app.js'
require_absent_pattern '<iframe class="pdf-thumb"' "$APP_FILE" 'inline pdf preview markup removed from app.js'

echo "Preview markup template utils smoke-check passed."
