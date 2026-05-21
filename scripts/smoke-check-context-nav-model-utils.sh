#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/context-nav-model-utils.js"

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

echo "Checking context-nav-model-utils exports..."
require_pattern '^export function deriveContextNavModel' "$UTILS_FILE" 'deriveContextNavModel export exists'

echo "Checking app.js wiring for context-nav model seam..."
require_pattern 'from "\./context-nav-model-utils\.js"' "$APP_FILE" 'app.js imports context-nav-model-utils.js'
require_pattern 'const model = deriveContextNavModel\(' "$APP_FILE" 'renderContextNav uses derived nav model'
require_pattern 'els\.contextNavTitle\.textContent = model\.title;' "$APP_FILE" 'renderContextNav sets title from model'
require_pattern 'els\.contextNav\.innerHTML = model\.items\.map' "$APP_FILE" 'renderContextNav renders items from model'

echo "Running context-nav model fixtures..."
node - "$UTILS_FILE" <<'NODE'
const fs = require('fs');
const vm = require('vm');

const utilsPath = process.argv[2];
let source = fs.readFileSync(utilsPath, 'utf8');
source = source.replace(/export function\s+/g, 'function ');
source += '\nmodule.exports = { deriveContextNavModel };\n';

const context = { module: { exports: {} }, exports: {} };
vm.createContext(context);
vm.runInContext(source, context, { filename: utilsPath });

const { deriveContextNavModel } = context.module.exports;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const categories = [
  { value: '', label: 'Все категории' },
  { value: 'authority', label: 'Органы власти' }
];
const scopeOptions = [
  { value: '', label: 'Все' },
  { value: 'public', label: 'Общие' }
];

const workspace = deriveContextNavModel({
  currentScreen: 'case-workspace',
  currentWorkspaceTab: 'submit'
});
assert(workspace.title === 'Обращение', 'workspace title mismatch');
assert(workspace.items.length === 5, 'workspace nav items count mismatch');
assert(workspace.items.find((x) => x.action === 'tab:submit')?.active === true, 'workspace submit tab active mismatch');

const institutions = deriveContextNavModel({
  currentScreen: 'institutions',
  institutionsScopeFilter: 'public',
  institutionsCategoryFilter: 'authority',
  directoryCategories: categories,
  institutionsScopeOptions: scopeOptions
});
assert(institutions.title === 'Фильтры', 'institutions title mismatch');
assert(institutions.items.some((x) => x.action === '__divider__'), 'institutions divider expected when scope options exist');
assert(institutions.items.find((x) => x.action === 'institutions-scope:public')?.active === true, 'institutions scope active mismatch');
assert(institutions.items.find((x) => x.action === 'institutions-category:authority')?.active === true, 'institutions category active mismatch');

const templates = deriveContextNavModel({
  currentScreen: 'templates',
  templatesScopeFilter: '',
  templatesCategoryFilter: '',
  directoryCategories: categories,
  templatesScopeOptions: []
});
assert(templates.title === 'Фильтры', 'templates title mismatch');
assert(!templates.items.some((x) => x.action === '__divider__'), 'templates divider must be absent without scope options');
assert(templates.items.find((x) => x.action === 'templates-category:')?.active === true, 'templates empty category active mismatch');

const admin = deriveContextNavModel({
  currentScreen: 'admin',
  adminSection: 'deleted'
});
assert(admin.title === 'Панель администратора', 'admin title mismatch');
assert(admin.items.find((x) => x.action === 'admin-section:deleted')?.active === true, 'admin section active mismatch');

const authDashboard = deriveContextNavModel({
  currentScreen: 'dashboard',
  isAuthenticated: true
});
assert(authDashboard.title === 'Обращения', 'authenticated dashboard title mismatch');
assert(authDashboard.items.length === 1 && authDashboard.items[0].action === 'dashboard:create-case', 'authenticated dashboard items mismatch');

const guestDashboard = deriveContextNavModel({
  currentScreen: 'dashboard',
  isAuthenticated: false
});
assert(guestDashboard.title === 'О сервисе', 'guest dashboard title mismatch');
assert(guestDashboard.items.length === 0, 'guest dashboard items mismatch');

console.log('Context-nav model fixture checks passed.');
NODE

echo "Context-nav model smoke-check passed."
