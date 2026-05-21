#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/filter-option-derivation-utils.js"

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

echo "Checking filter-option-derivation-utils exports..."
require_pattern '^export function deriveAdminUserDatalistOptions' "$UTILS_FILE" 'deriveAdminUserDatalistOptions export exists'
require_pattern '^export function getAdminUserByFilterValue' "$UTILS_FILE" 'getAdminUserByFilterValue export exists'
require_pattern '^export function getAdminUserFilterInputValue' "$UTILS_FILE" 'getAdminUserFilterInputValue export exists'
require_pattern '^export function deriveCaseFilterOptions' "$UTILS_FILE" 'deriveCaseFilterOptions export exists'

echo "Checking app.js wiring for option derivation seam..."
require_pattern 'from "\./filter-option-derivation-utils\.js"' "$APP_FILE" 'app.js imports filter-option-derivation-utils.js'
require_pattern 'deriveAdminUserDatalistOptions\(' "$APP_FILE" 'renderDirectoryUserFilters uses deriveAdminUserDatalistOptions'
require_pattern 'getAdminUserByFilterValueDerived\(' "$APP_FILE" 'getAdminUserByFilterValue delegates to derived helper'
require_pattern 'getAdminUserFilterInputValueDerived\(' "$APP_FILE" 'getAdminUserFilterInputValue delegates to derived helper'
require_pattern 'deriveCaseFilterOptions\(' "$APP_FILE" 'renderCaseFilters uses deriveCaseFilterOptions'

echo "Running option-derivation fixtures..."
node - "$UTILS_FILE" <<'NODE'
const fs = require('fs');
const vm = require('vm');

const utilsPath = process.argv[2];
let source = fs.readFileSync(utilsPath, 'utf8');
source = source.replace(/export function\s+/g, 'function ');
source += '\nmodule.exports = { deriveAdminUserDatalistOptions, getAdminUserByFilterValue, getAdminUserFilterInputValue, deriveCaseFilterOptions };\n';

const context = { module: { exports: {} }, exports: {} };
vm.createContext(context);
vm.runInContext(source, context, { filename: utilsPath });

const {
  deriveAdminUserDatalistOptions,
  getAdminUserByFilterValue,
  getAdminUserFilterInputValue,
  deriveCaseFilterOptions
} = context.module.exports;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const users = [
  { id: 'u1', nickname: 'Ilya', role: 'admin_full' },
  { id: 'u2', nickname: 'Anna', role: 'user' }
];

const toLabel = (user) => `${user.nickname} [${user.role}]`;
const userOptions = deriveAdminUserDatalistOptions(users, toLabel).map((item) => item.value).join(',');
assert(userOptions === 'Ilya [admin_full],Anna [user]', 'admin user datalist options mismatch');
assert(getAdminUserByFilterValue(users, 'Ilya [admin_full]', toLabel)?.id === 'u1', 'exact user filter value lookup mismatch');
assert(getAdminUserByFilterValue(users, '  Anna [user]  ', toLabel)?.id === 'u2', 'trimmed user filter value lookup mismatch');
assert(getAdminUserByFilterValue(users, 'unknown', toLabel) === null, 'unknown user filter value must resolve to null');
assert(getAdminUserFilterInputValue(users, 'u2', toLabel) === 'Anna [user]', 'user filter input value by id mismatch');
assert(getAdminUserFilterInputValue(users, '', toLabel) === '', 'empty user id must resolve to empty string');
assert(getAdminUserFilterInputValue(users, 'missing', toLabel) === '', 'missing user id must resolve to empty string');

const institutions = [
  { id: 'i1', name: 'Org A' },
  { id: 'i2', name: 'Org B' }
];
const statuses = [
  { value: '', label: 'Все статусы' },
  { value: 'created_group', label: 'Создано' },
  { value: 'sent', label: 'Отправлено' }
];

const options = deriveCaseFilterOptions(institutions, statuses);
assert(options.institutionOptions.map((x) => `${x.value}:${x.label}`).join('|') === ':Все организации|i1:Org A|i2:Org B', 'institution filter options mismatch');
assert(options.statusOptions.map((x) => `${x.value}:${x.label}`).join('|') === ':Все статусы|created_group:Создано|sent:Отправлено', 'status filter options mismatch');

console.log('Option-derivation fixture checks passed.');
NODE

echo "Filter option derivation smoke-check passed."
