#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
CFG_FILE="$ROOT_DIR/fixed-variables-config.js"

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
require_file "$CFG_FILE"

echo "Checking FIXED_VARIABLES config export..."
require_pattern '^export const FIXED_VARIABLES' "$CFG_FILE" 'FIXED_VARIABLES export exists'
require_pattern 'complaint_date' "$CFG_FILE" 'complaint_date entry exists'
require_pattern 'address' "$CFG_FILE" 'address entry exists'
require_pattern 'license_plate' "$CFG_FILE" 'license_plate entry exists'

echo "Checking app.js wiring..."
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'FIXED_VARIABLES' "$APP_FILE" 'app.js references FIXED_VARIABLES'
require_absent_pattern '^const FIXED_VARIABLES' "$APP_FILE" 'local FIXED_VARIABLES declaration removed'

echo "FIXED_VARIABLES smoke-check passed."
