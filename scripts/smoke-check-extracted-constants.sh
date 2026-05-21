#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
STATUS_CONSTS="$ROOT_DIR/case-status-constants.js"
DIR_CONSTS="$ROOT_DIR/directory-category-constants.js"

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
require_file "$STATUS_CONSTS"
require_file "$DIR_CONSTS"

echo "Checking exports in constants modules..."
require_pattern '^export const CASE_STATUS_LABELS' "$STATUS_CONSTS" 'CASE_STATUS_LABELS export exists'
require_pattern '^export const CASE_STATUS_CLASSES' "$STATUS_CONSTS" 'CASE_STATUS_CLASSES export exists'
require_pattern '^export const ROLE_LABELS' "$STATUS_CONSTS" 'ROLE_LABELS export exists'
require_pattern '^export const CASE_STATUS_FILTER_OPTIONS' "$STATUS_CONSTS" 'CASE_STATUS_FILTER_OPTIONS export exists'
require_pattern '^export const DIRECTORY_CATEGORIES' "$DIR_CONSTS" 'DIRECTORY_CATEGORIES export exists'
require_pattern '^export const DIRECTORY_CATEGORY_LABELS' "$DIR_CONSTS" 'DIRECTORY_CATEGORY_LABELS export exists'

echo "Checking app.js imports..."
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'CASE_STATUS_LABELS' "$APP_FILE" 'app.js references CASE_STATUS_LABELS'
require_pattern 'CASE_STATUS_CLASSES' "$APP_FILE" 'app.js references CASE_STATUS_CLASSES'
require_pattern 'ROLE_LABELS' "$APP_FILE" 'app.js references ROLE_LABELS'
require_pattern 'CASE_STATUS_FILTER_OPTIONS' "$APP_FILE" 'app.js references CASE_STATUS_FILTER_OPTIONS'
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'DIRECTORY_CATEGORIES' "$APP_FILE" 'app.js references DIRECTORY_CATEGORIES'
require_pattern 'DIRECTORY_CATEGORY_LABELS' "$APP_FILE" 'app.js references DIRECTORY_CATEGORY_LABELS'

echo "Checking removed local declarations in app.js..."
require_absent_pattern '^const CASE_STATUS_LABELS' "$APP_FILE" 'local CASE_STATUS_LABELS declaration removed'
require_absent_pattern '^const CASE_STATUS_CLASSES' "$APP_FILE" 'local CASE_STATUS_CLASSES declaration removed'
require_absent_pattern '^const ROLE_LABELS' "$APP_FILE" 'local ROLE_LABELS declaration removed'
require_absent_pattern '^const CASE_STATUS_FILTER_OPTIONS' "$APP_FILE" 'local CASE_STATUS_FILTER_OPTIONS declaration removed'
require_absent_pattern '^const DIRECTORY_CATEGORIES' "$APP_FILE" 'local DIRECTORY_CATEGORIES declaration removed'
require_absent_pattern '^const DIRECTORY_CATEGORY_LABELS' "$APP_FILE" 'local DIRECTORY_CATEGORY_LABELS declaration removed'

echo "Smoke-check passed."
