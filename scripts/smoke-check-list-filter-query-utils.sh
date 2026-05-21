#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/list-filter-query-utils.js"

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

echo "Checking list-filter-query-utils exports..."
require_pattern '^export function deriveVisibleCases' "$UTILS_FILE" 'deriveVisibleCases export exists'
require_pattern '^export function deriveVisibleInstitutions' "$UTILS_FILE" 'deriveVisibleInstitutions export exists'
require_pattern '^export function deriveVisibleTemplates' "$UTILS_FILE" 'deriveVisibleTemplates export exists'

echo "Checking app.js wiring for unified filter/query pipeline..."
require_pattern 'from "\./list-filter-query-utils\.js"' "$APP_FILE" 'app.js imports list-filter-query-utils.js'
require_pattern 'deriveVisibleCases\(state\.cases' "$APP_FILE" 'renderCases uses deriveVisibleCases'
require_pattern 'deriveVisibleInstitutions\(state\.institutions' "$APP_FILE" 'renderInstitutions uses deriveVisibleInstitutions'
require_pattern 'deriveVisibleTemplates\(state\.templates' "$APP_FILE" 'renderTemplates uses deriveVisibleTemplates'
require_absent_pattern 'const filteredCases = state\.cases\.filter' "$APP_FILE" 'inline cases filter removed from renderCases'
require_absent_pattern 'const filteredInstitutions = state\.institutions\.filter' "$APP_FILE" 'inline institutions filter removed from renderInstitutions'
require_absent_pattern 'const filteredTemplates = state\.templates\.filter' "$APP_FILE" 'inline templates filter removed from renderTemplates'

echo "Running semantic fixture checks for key branches..."
node - "$UTILS_FILE" <<'NODE'
const fs = require('fs');
const vm = require('vm');

const utilsPath = process.argv[2];
let source = fs.readFileSync(utilsPath, 'utf8');
source = source.replace(/export function\s+/g, 'function ');
source += '\nmodule.exports = { deriveVisibleCases, deriveVisibleInstitutions, deriveVisibleTemplates };\n';

const context = { module: { exports: {} }, exports: {} };
vm.createContext(context);
vm.runInContext(source, context, { filename: utilsPath });

const {
  deriveVisibleCases,
  deriveVisibleInstitutions,
  deriveVisibleTemplates
} = context.module.exports;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const cases = [
  { id: 'c1', institution_id: 'i1', owner_user_id: 'u1', case_status: 'created', title: 'A', description: 'alpha', case_number: 'CASE-1', institution_name: 'OrgA', template_name: 'TmpA', owner_nickname: 'Ilya' },
  { id: 'c2', institution_id: 'i1', owner_user_id: 'u2', case_status: 'sent', title: 'B', description: 'beta', case_number: 'CASE-2', institution_name: 'OrgB', template_name: 'TmpB', owner_nickname: 'Anna' },
  { id: 'c3', institution_id: 'i2', owner_user_id: 'u1', case_status: 'has_reply', title: 'C', description: 'gamma', case_number: 'CASE-3', institution_name: 'OrgC', template_name: 'TmpC', owner_nickname: 'Ilya' },
  { id: 'c4', institution_id: 'i2', owner_user_id: 'u1', case_status: 'no_template', title: 'D', description: 'delta', case_number: 'CASE-4', institution_name: 'OrgD', template_name: '', owner_nickname: 'Ilya' }
];

assert(deriveVisibleCases(cases, { statusFilter: 'created_group' }).map((x) => x.id).join(',') === 'c1,c4', 'created_group must include created + reminder statuses only');
assert(deriveVisibleCases(cases, { statusFilter: 'sent' }).map((x) => x.id).join(',') === 'c2', 'sent status filtering mismatch');
assert(deriveVisibleCases(cases, { userFilter: 'u1', institutionFilter: 'i2' }).map((x) => x.id).join(',') === 'c3,c4', 'user/institution combined filtering mismatch');
assert(deriveVisibleCases(cases, { query: 'anna' }).map((x) => x.id).join(',') === 'c2', 'case query matching mismatch');

const institutions = [
  { id: 'i1', visibility: 'public', owner_user_id: 'u1', is_favorite: true, category: 'authority', name: 'Alpha', submit_url: 'https://a', owner_nickname: 'Ilya' },
  { id: 'i2', visibility: 'private', owner_user_id: 'u2', is_favorite: false, category: 'state_org', name: 'Beta', submit_url: 'https://b', owner_nickname: 'Anna' },
  { id: 'i3', visibility: 'public', owner_user_id: 'u2', is_favorite: false, category: 'other_org', name: 'Gamma', submit_url: 'https://c', owner_nickname: 'Anna' }
];

assert(deriveVisibleInstitutions(institutions, { showOwner: false, scopeFilter: 'favorites' }).map((x) => x.id).join(',') === 'i1', 'favorites filtering mismatch for institutions');
assert(deriveVisibleInstitutions(institutions, { showOwner: true, scopeFilter: 'owned' }).map((x) => x.id).join(',') === 'i2', 'admin owned scope for institutions mismatch');
assert(deriveVisibleInstitutions(institutions, { showOwner: true, scopeFilter: 'public', userFilter: 'u2' }).map((x) => x.id).join(',') === 'i3', 'admin public+user filter for institutions mismatch');
assert(deriveVisibleInstitutions(institutions, { showOwner: true, categoryFilter: 'state_org' }).map((x) => x.id).join(',') === 'i2', 'institution category filtering mismatch');
assert(deriveVisibleInstitutions(institutions, { showOwner: true, search: 'anna' }).map((x) => x.id).join(',') === 'i2,i3', 'institution search filtering mismatch');

const templates = [
  { id: 't1', visibility: 'public', owner_user_id: 'u1', is_favorite: true, category: 'authority', name: 'Temp Alpha', body_template: 'Body A', owner_nickname: 'Ilya' },
  { id: 't2', visibility: 'private', owner_user_id: 'u2', is_favorite: false, category: 'state_org', name: 'Temp Beta', body_template: 'Body B', owner_nickname: 'Anna' },
  { id: 't3', visibility: 'public', owner_user_id: 'u2', is_favorite: false, category: 'other_org', name: 'Temp Gamma', body_template: 'Body C', owner_nickname: 'Anna' }
];

assert(deriveVisibleTemplates(templates, { showOwner: false, scopeFilter: 'favorites' }).map((x) => x.id).join(',') === 't1', 'favorites filtering mismatch for templates');
assert(deriveVisibleTemplates(templates, { showOwner: true, scopeFilter: 'owned' }).map((x) => x.id).join(',') === 't2', 'admin owned scope for templates mismatch');
assert(deriveVisibleTemplates(templates, { showOwner: true, scopeFilter: 'public', userFilter: 'u2' }).map((x) => x.id).join(',') === 't3', 'admin public+user filter for templates mismatch');
assert(deriveVisibleTemplates(templates, { showOwner: true, categoryFilter: 'state_org' }).map((x) => x.id).join(',') === 't2', 'template category filtering mismatch');
assert(deriveVisibleTemplates(templates, { showOwner: true, search: 'body c' }).map((x) => x.id).join(',') === 't3', 'template search filtering mismatch');

console.log('Fixture checks passed.');
NODE

echo "Unified filter/query pipeline smoke-check passed."
