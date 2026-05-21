#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/date-text-utils.js"

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

echo "Checking date-text-utils exports..."
require_pattern '^export function formatDateForInput' "$UTILS_FILE" 'formatDateForInput export exists'
require_pattern '^export function maskDateInputValue' "$UTILS_FILE" 'maskDateInputValue export exists'
require_pattern '^export function normalizeDisplayDate' "$UTILS_FILE" 'normalizeDisplayDate export exists'
require_pattern '^export function parseStrictDisplayDate' "$UTILS_FILE" 'parseStrictDisplayDate export exists'
require_pattern '^export function formatComplaintDate' "$UTILS_FILE" 'formatComplaintDate export exists'
require_pattern '^export function collapseDuplicateDateSuffixes' "$UTILS_FILE" 'collapseDuplicateDateSuffixes export exists'

echo "Checking app.js imports and references..."
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'formatDateForInput' "$APP_FILE" 'app.js references formatDateForInput'
require_pattern 'maskDateInputValue' "$APP_FILE" 'app.js references maskDateInputValue'
require_pattern 'normalizeDisplayDate' "$APP_FILE" 'app.js references normalizeDisplayDate'
require_pattern 'parseStrictDisplayDate' "$APP_FILE" 'app.js references parseStrictDisplayDate'
require_pattern 'formatComplaintDate' "$APP_FILE" 'app.js references formatComplaintDate'
require_pattern 'collapseDuplicateDateSuffixes' "$APP_FILE" 'app.js references collapseDuplicateDateSuffixes'

echo "Checking removed local helper declarations in app.js..."
require_absent_pattern '^function formatDateForInput' "$APP_FILE" 'local formatDateForInput declaration removed'
require_absent_pattern '^function maskDateInputValue' "$APP_FILE" 'local maskDateInputValue declaration removed'
require_absent_pattern '^function normalizeDisplayDate' "$APP_FILE" 'local normalizeDisplayDate declaration removed'
require_absent_pattern '^function parseStrictDisplayDate' "$APP_FILE" 'local parseStrictDisplayDate declaration removed'
require_absent_pattern '^function formatComplaintDate' "$APP_FILE" 'local formatComplaintDate declaration removed'
require_absent_pattern '^function collapseDuplicateDateSuffixes' "$APP_FILE" 'local collapseDuplicateDateSuffixes declaration removed'

echo "Date-text-utils smoke-check passed."
