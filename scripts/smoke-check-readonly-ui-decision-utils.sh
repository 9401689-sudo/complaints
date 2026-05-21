#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/readonly-ui-decision-utils.js"

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

require_file "$APP_FILE"
require_file "$UTILS_FILE"

echo "Checking readonly-ui-decision-utils exports..."
require_pattern '^export function deriveReadonlyUiStateMatrix' "$UTILS_FILE" 'deriveReadonlyUiStateMatrix export exists'

echo "Checking app.js wiring for readonly decision seam..."
require_pattern 'from "\./readonly-ui-decision-utils\.js"' "$APP_FILE" 'app.js imports readonly-ui-decision-utils.js'
require_pattern 'const matrix = deriveReadonlyUiStateMatrix\(\{ isAuthenticated: isAuthenticated\(\) \}\);' "$APP_FILE" 'applyReadonlyUiState derives matrix from explicit input'
require_pattern 'matrix\.hiddenButtons\.forEach' "$APP_FILE" 'hidden-buttons DOM adapter consumes matrix'
require_pattern 'matrix\.disabledControls\.forEach' "$APP_FILE" 'disabled-controls DOM adapter consumes matrix'
require_pattern 'matrix\.readOnlyControls\.forEach' "$APP_FILE" 'readonly-controls DOM adapter consumes matrix'
require_pattern 'matrix\.hiddenZones\.forEach' "$APP_FILE" 'hidden-zones DOM adapter consumes matrix'

echo "Running readonly decision matrix fixtures..."
node - "$UTILS_FILE" <<'NODE'
const fs = require('fs');
const vm = require('vm');

const utilsPath = process.argv[2];
let source = fs.readFileSync(utilsPath, 'utf8');
source = source.replace(/export function\s+/g, 'function ');
source += '\nmodule.exports = { deriveReadonlyUiStateMatrix };\n';

const context = { module: { exports: {} }, exports: {} };
vm.createContext(context);
vm.runInContext(source, context, { filename: utilsPath });

const { deriveReadonlyUiStateMatrix } = context.module.exports;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const guest = deriveReadonlyUiStateMatrix({ isAuthenticated: false });
const user = deriveReadonlyUiStateMatrix({ isAuthenticated: true });

assert(guest.readOnly === true, 'guest must produce readOnly=true');
assert(user.readOnly === false, 'authenticated must produce readOnly=false');

const expectedHiddenButtons = [
  'btnCreateCase',
  'btnToggleInstitutionForm',
  'btnToggleTemplateForm',
  'btnCreateLinkedCase',
  'btnSaveCaseMeta',
  'btnSaveFilesSelection',
  'btnPickWorkspaceFiles',
  'btnSaveVariables',
  'btnSaveText',
  'btnRebuildSubmitPackage',
  'btnUploadResultFiles'
].join(',');

assert(guest.hiddenButtons.join(',') === expectedHiddenButtons, 'hiddenButtons matrix mismatch');
assert(user.hiddenButtons.join(',') === expectedHiddenButtons, 'hiddenButtons must be stable across auth states');

assert(guest.disabledControls.join(',') === 'resultComment,caseTitle,caseDescription,caseDate,caseInstitutionSelect,caseTemplateSelect', 'disabledControls matrix mismatch');
assert(guest.readOnlyControls.join(',') === 'caseTextEditor', 'readOnlyControls matrix mismatch');
assert(guest.hiddenZones.join(',') === 'workspaceDropzone', 'hiddenZones matrix mismatch');
assert(guest.variablesFormControlsDisabled === true, 'variablesFormControlsDisabled must remain true');

console.log('Readonly decision matrix fixture checks passed.');
NODE

echo "Readonly decision-matrix smoke-check passed."
