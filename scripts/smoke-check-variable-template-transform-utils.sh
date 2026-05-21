#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/variable-template-transform-utils.js"
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

echo "Checking variable-template-transform-utils exports..."
require_pattern '^export function getRenderableVariableValue' "$UTILS_FILE" 'getRenderableVariableValue export exists'
require_pattern '^export function getDefaultTemplateValues' "$UTILS_FILE" 'getDefaultTemplateValues export exists'
require_pattern '^export function getTemplateVariablesSchema' "$UTILS_FILE" 'getTemplateVariablesSchema export exists'
require_pattern '^export function normalizeVariableState' "$UTILS_FILE" 'normalizeVariableState export exists'

echo "Checking boundary re-exports and app wiring..."
require_pattern 'from "\./variable-template-transform-utils\.js"' "$BOUNDARY_FILE" 'boundary re-exports variable-template-transform-utils'
require_pattern 'from "\./safe-modules-boundary\.js"' "$APP_FILE" 'app.js imports safe-modules-boundary.js'
require_pattern 'getRenderableVariableValue' "$APP_FILE" 'app.js references getRenderableVariableValue'
require_pattern 'getDefaultTemplateValues' "$APP_FILE" 'app.js references getDefaultTemplateValues'
require_pattern 'getTemplateVariablesSchema' "$APP_FILE" 'app.js references getTemplateVariablesSchema'
require_pattern 'normalizeVariableState' "$APP_FILE" 'app.js references normalizeVariableState'

echo "Checking removed local helper declarations in app.js..."
require_absent_pattern '^function getRenderableVariableValue' "$APP_FILE" 'local getRenderableVariableValue declaration removed'
require_absent_pattern '^function getDefaultTemplateValues' "$APP_FILE" 'local getDefaultTemplateValues declaration removed'
require_absent_pattern '^function getTemplateVariablesSchema' "$APP_FILE" 'local getTemplateVariablesSchema declaration removed'
require_absent_pattern '^function normalizeVariableState' "$APP_FILE" 'local normalizeVariableState declaration removed'

echo "Variable-template transform utils smoke-check passed."
