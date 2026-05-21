#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/workspace-status-progress-text-utils.js"

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

echo "Checking workspace-status-progress-text-utils exports..."
require_pattern '^export function deriveWorkspaceSummaryText' "$UTILS_FILE" 'deriveWorkspaceSummaryText export exists'
require_pattern '^export function deriveWorkspaceFileSelectionStatusText' "$UTILS_FILE" 'deriveWorkspaceFileSelectionStatusText export exists'
require_pattern '^export function deriveCreateCaseProgressLabel' "$UTILS_FILE" 'deriveCreateCaseProgressLabel export exists'
require_pattern '^export function deriveFilesSyncProgressLabel' "$UTILS_FILE" 'deriveFilesSyncProgressLabel export exists'
require_pattern '^export function deriveResultUploadProgressLabel' "$UTILS_FILE" 'deriveResultUploadProgressLabel export exists'
require_pattern '^export function deriveSubmitProgressLabel' "$UTILS_FILE" 'deriveSubmitProgressLabel export exists'

echo "Checking app.js wiring for status/progress/summary derivation seam..."
require_pattern 'from "\./workspace-status-progress-text-utils\.js"' "$APP_FILE" 'app.js imports workspace-status-progress-text-utils.js'
require_pattern 'const summaryText = deriveWorkspaceSummaryText\(' "$APP_FILE" 'renderWorkspaceSummary uses derived summary text'
require_pattern 'deriveWorkspaceFileSelectionStatusText\(' "$APP_FILE" 'workspace file status text uses derived helper'
require_pattern 'deriveCreateCaseProgressLabel\(' "$APP_FILE" 'create-case progress uses derived helper'
require_pattern 'deriveFilesSyncProgressLabel\(' "$APP_FILE" 'files sync progress uses derived helper'
require_pattern 'deriveResultUploadProgressLabel\(' "$APP_FILE" 'result upload progress uses derived helper'
require_pattern 'deriveSubmitProgressLabel\(' "$APP_FILE" 'submit progress wording uses derived helper'

echo "Running status/progress/summary derivation fixtures..."
node - "$UTILS_FILE" <<'NODE'
const fs = require('fs');
const vm = require('vm');

const utilsPath = process.argv[2];
let source = fs.readFileSync(utilsPath, 'utf8');
source = source.replace(/export function\s+/g, 'function ');
source += '\nmodule.exports = { deriveWorkspaceSummaryText, deriveWorkspaceFileSelectionStatusText, deriveCreateCaseProgressLabel, deriveFilesSyncProgressLabel, deriveResultUploadProgressLabel, deriveSubmitProgressLabel };\n';

const context = { module: { exports: {} }, exports: {} };
vm.createContext(context);
vm.runInContext(source, context, { filename: utilsPath });

const {
  deriveWorkspaceSummaryText,
  deriveWorkspaceFileSelectionStatusText,
  deriveCreateCaseProgressLabel,
  deriveFilesSyncProgressLabel,
  deriveResultUploadProgressLabel,
  deriveSubmitProgressLabel
} = context.module.exports;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const summaryAdmin = deriveWorkspaceSummaryText({
  caseData: { title: '', case_number: 'CASE-1', description: 'Desc', owner_nickname: 'Ilya' },
  isAdmin: true
});
assert(summaryAdmin.title === 'Обращение CASE-1', 'workspace title derivation mismatch');
assert(summaryAdmin.subtitle === 'Desc · Пользователь: Ilya', 'admin subtitle derivation mismatch');

const summaryUser = deriveWorkspaceSummaryText({
  caseData: { title: 'My title', description: '', owner_nickname: 'Ilya' },
  isAdmin: false
});
assert(summaryUser.title === 'My title', 'workspace title from explicit title mismatch');
assert(summaryUser.subtitle === '', 'non-admin subtitle derivation mismatch');

assert(deriveWorkspaceFileSelectionStatusText(true, 4) === 'В подаче · порядок 4', 'selected file status text mismatch');
assert(deriveWorkspaceFileSelectionStatusText(false, 4) === 'Не выбран для подачи', 'unselected file status text mismatch');

assert(deriveCreateCaseProgressLabel() === 'Создаём обращение...', 'create-case progress label mismatch');
assert(deriveFilesSyncProgressLabel('sync_initial') === 'Синхронизируем файлы из incoming...', 'sync initial label mismatch');
assert(deriveFilesSyncProgressLabel('upload_batch', { done: 2, total: 5 }) === 'Загружено 2 из 5', 'upload batch label mismatch');
assert(deriveFilesSyncProgressLabel('unknown') === 'Синхронизируем файлы...', 'files sync fallback label mismatch');

assert(deriveResultUploadProgressLabel(3, 7) === 'Загружено 3 из 7', 'result upload label mismatch');
assert(deriveSubmitProgressLabel('rebuild') === 'Собираем пакет заново...', 'submit rebuild label mismatch');
assert(deriveSubmitProgressLabel('prepare') === 'Перемещаем файлы и готовим отправку...', 'submit prepare label mismatch');
assert(deriveSubmitProgressLabel('other') === 'Подготовка отправки...', 'submit fallback label mismatch');

console.log('Workspace status/progress text fixture checks passed.');
NODE

echo "Workspace status/progress text smoke-check passed."
