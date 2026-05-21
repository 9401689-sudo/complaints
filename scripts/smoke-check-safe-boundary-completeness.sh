#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
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

require_file "$BOUNDARY_FILE"

echo "Checking safe-modules-boundary completeness..."

require_pattern 'from "\./case-status-constants\.js"' "$BOUNDARY_FILE" 're-export source case-status-constants.js exists'
require_pattern 'CASE_STATUS_CLASSES' "$BOUNDARY_FILE" 'CASE_STATUS_CLASSES re-export exists'
require_pattern 'CASE_STATUS_FILTER_OPTIONS' "$BOUNDARY_FILE" 'CASE_STATUS_FILTER_OPTIONS re-export exists'
require_pattern 'CASE_STATUS_LABELS' "$BOUNDARY_FILE" 'CASE_STATUS_LABELS re-export exists'
require_pattern 'ROLE_LABELS' "$BOUNDARY_FILE" 'ROLE_LABELS re-export exists'

require_pattern 'from "\./directory-category-constants\.js"' "$BOUNDARY_FILE" 're-export source directory-category-constants.js exists'
require_pattern 'DIRECTORY_CATEGORIES' "$BOUNDARY_FILE" 'DIRECTORY_CATEGORIES re-export exists'
require_pattern 'DIRECTORY_CATEGORY_LABELS' "$BOUNDARY_FILE" 'DIRECTORY_CATEGORY_LABELS re-export exists'

require_pattern 'from "\./fixed-variables-config\.js"' "$BOUNDARY_FILE" 're-export source fixed-variables-config.js exists'
require_pattern 'FIXED_VARIABLES' "$BOUNDARY_FILE" 'FIXED_VARIABLES re-export exists'

require_pattern 'from "\./date-text-utils\.js"' "$BOUNDARY_FILE" 're-export source date-text-utils.js exists'
require_pattern 'collapseDuplicateDateSuffixes' "$BOUNDARY_FILE" 'collapseDuplicateDateSuffixes re-export exists'
require_pattern 'formatComplaintDate' "$BOUNDARY_FILE" 'formatComplaintDate re-export exists'
require_pattern 'formatDateForInput' "$BOUNDARY_FILE" 'formatDateForInput re-export exists'
require_pattern 'maskDateInputValue' "$BOUNDARY_FILE" 'maskDateInputValue re-export exists'
require_pattern 'normalizeDisplayDate' "$BOUNDARY_FILE" 'normalizeDisplayDate re-export exists'
require_pattern 'parseStrictDisplayDate' "$BOUNDARY_FILE" 'parseStrictDisplayDate re-export exists'

require_pattern 'from "\./text-display-utils\.js"' "$BOUNDARY_FILE" 're-export source text-display-utils.js exists'
require_pattern 'escapeHtml' "$BOUNDARY_FILE" 'escapeHtml re-export exists'
require_pattern 'formatUrlPreview' "$BOUNDARY_FILE" 'formatUrlPreview re-export exists'
require_pattern 'sanitizeFilename' "$BOUNDARY_FILE" 'sanitizeFilename re-export exists'
require_pattern 'shorten' "$BOUNDARY_FILE" 'shorten re-export exists'

require_pattern 'from "\./display-format-utils\.js"' "$BOUNDARY_FILE" 're-export source display-format-utils.js exists'
require_pattern 'formatBytes' "$BOUNDARY_FILE" 'formatBytes re-export exists'
require_pattern 'getVisibilityLabel' "$BOUNDARY_FILE" 'getVisibilityLabel re-export exists'

echo "Safe boundary completeness smoke-check passed."
