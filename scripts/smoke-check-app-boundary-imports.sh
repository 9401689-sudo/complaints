#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"

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

echo "Checking app boundary import discipline..."

# Positive guard: safe symbols must come through boundary import
require_pattern '^import \{.*CASE_STATUS_LABELS.*\} from "\./safe-modules-boundary\.js";' "$APP_FILE" 'safe symbol import includes CASE_STATUS_LABELS via boundary'
require_pattern '^import \{.*FIXED_VARIABLES.*\} from "\./safe-modules-boundary\.js";' "$APP_FILE" 'safe symbol import includes FIXED_VARIABLES via boundary'
require_pattern '^import \{.*formatDateForInput.*\} from "\./safe-modules-boundary\.js";' "$APP_FILE" 'safe symbol import includes date utils via boundary'
require_pattern '^import \{.*escapeHtml.*\} from "\./safe-modules-boundary\.js";' "$APP_FILE" 'safe symbol import includes text-display utils via boundary'
require_pattern '^import \{.*formatBytes.*\} from "\./safe-modules-boundary\.js";' "$APP_FILE" 'safe symbol import includes display-format utils via boundary'

# Regression guards: no direct imports from underlying safe modules
require_absent_pattern 'from "\./case-status-constants\.js"' "$APP_FILE" 'no direct import from case-status-constants.js'
require_absent_pattern 'from "\./directory-category-constants\.js"' "$APP_FILE" 'no direct import from directory-category-constants.js'
require_absent_pattern 'from "\./fixed-variables-config\.js"' "$APP_FILE" 'no direct import from fixed-variables-config.js'
require_absent_pattern 'from "\./date-text-utils\.js"' "$APP_FILE" 'no direct import from date-text-utils.js'
require_absent_pattern 'from "\./text-display-utils\.js"' "$APP_FILE" 'no direct import from text-display-utils.js'
require_absent_pattern 'from "\./display-format-utils\.js"' "$APP_FILE" 'no direct import from display-format-utils.js'

echo "App boundary-import smoke-check passed."
