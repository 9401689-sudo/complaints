#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/submit-workspace-precondition-utils.js"

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

echo "Checking submit-workspace-precondition-utils exports..."
require_pattern '^export function deriveSubmitActionGate' "$UTILS_FILE" 'deriveSubmitActionGate export exists'
require_pattern '^export function deriveOpenSubmitTabDecision' "$UTILS_FILE" 'deriveOpenSubmitTabDecision export exists'
require_pattern '^export function deriveWorkspaceTabLeavePersistenceDecision' "$UTILS_FILE" 'deriveWorkspaceTabLeavePersistenceDecision export exists'

echo "Checking app.js wiring for submit/workspace precondition seam..."
require_pattern 'from "\./submit-workspace-precondition-utils\.js"' "$APP_FILE" 'app.js imports submit-workspace-precondition-utils.js'
require_pattern 'const gate = deriveSubmitActionGate\(\{' "$APP_FILE" 'submit action gate derivation exists'
require_pattern 'const decision = deriveOpenSubmitTabDecision\(\{' "$APP_FILE" 'open-submit decision derivation exists'
require_pattern 'const tabLeaveDecision = deriveWorkspaceTabLeavePersistenceDecision\(\{' "$APP_FILE" 'workspace tab-leave decision derivation exists'
require_pattern 'if \(tabLeaveDecision\.shouldPersistSubmitMetaOnLeave\)' "$APP_FILE" 'submit metadata persistence uses decision output'
require_pattern 'if \(tabLeaveDecision\.shouldPersistResultCommentOnLeave\)' "$APP_FILE" 'result comment persistence uses decision output'

echo "Running submit/workspace precondition fixtures..."
node - "$UTILS_FILE" <<'NODE'
const fs = require('fs');
const vm = require('vm');

const utilsPath = process.argv[2];
let source = fs.readFileSync(utilsPath, 'utf8');
source = source.replace(/export function\s+/g, 'function ');
source += '\nmodule.exports = { deriveSubmitActionGate, deriveOpenSubmitTabDecision, deriveWorkspaceTabLeavePersistenceDecision };\n';

const context = { module: { exports: {} }, exports: {} };
vm.createContext(context);
vm.runInContext(source, context, { filename: utilsPath });

const {
  deriveSubmitActionGate,
  deriveOpenSubmitTabDecision,
  deriveWorkspaceTabLeavePersistenceDecision
} = context.module.exports;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const unauth = deriveSubmitActionGate({ isAuthenticated: false, hasCurrentCase: false });
assert(unauth.canRun === false && unauth.blockingReason === 'unauthenticated', 'unauthenticated gate branch mismatch');

const missingCase = deriveSubmitActionGate({ isAuthenticated: true, hasCurrentCase: false });
assert(missingCase.canRun === false && missingCase.blockingReason === 'missing_case', 'missing_case gate branch mismatch');

const allowed = deriveSubmitActionGate({ isAuthenticated: true, hasCurrentCase: true });
assert(allowed.canRun === true && allowed.blockingReason === null, 'allowed gate branch mismatch');

const withSubmitData = deriveOpenSubmitTabDecision({ hasSubmitData: true, currentFsmState: 'draft' });
assert(withSubmitData.shouldRenderExistingSubmitData === true, 'shouldRenderExistingSubmitData mismatch');
assert(withSubmitData.requiresPackageBuild === true, 'requiresPackageBuild mismatch when submit data exists');

const readyPackage = deriveOpenSubmitTabDecision({ hasSubmitData: false, currentFsmState: 'package_ready' });
assert(readyPackage.requiresPackageBuild === false, 'package_ready branch must not require package build');
assert(readyPackage.submitProgressLabel === 'Подготавливаем отправку...', 'package_ready progress label mismatch');

const needsBuild = deriveOpenSubmitTabDecision({ hasSubmitData: false, currentFsmState: 'text_saved' });
assert(needsBuild.requiresPackageBuild === true, 'non-ready package must require package build');
assert(needsBuild.submitProgressLabel === 'Собираем пакет...', 'non-ready package progress label mismatch');

const submitLeave = deriveWorkspaceTabLeavePersistenceDecision({ currentWorkspaceTab: 'submit', targetTab: 'files' });
assert(submitLeave.shouldPersistSubmitMetaOnLeave === true, 'submit leave persistence mismatch');
assert(submitLeave.shouldPersistResultCommentOnLeave === false, 'submit leave should not persist result comment');

const resultLeave = deriveWorkspaceTabLeavePersistenceDecision({ currentWorkspaceTab: 'result', targetTab: 'text' });
assert(resultLeave.shouldPersistSubmitMetaOnLeave === false, 'result leave should not persist submit meta');
assert(resultLeave.shouldPersistResultCommentOnLeave === true, 'result leave persistence mismatch');

const sameTab = deriveWorkspaceTabLeavePersistenceDecision({ currentWorkspaceTab: 'submit', targetTab: 'submit' });
assert(sameTab.shouldPersistSubmitMetaOnLeave === false, 'same submit tab should not persist submit meta');

console.log('Submit/workspace precondition fixture checks passed.');
NODE

echo "Submit/workspace precondition smoke-check passed."
