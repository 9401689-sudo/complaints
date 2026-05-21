#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/auth-scope-policy-utils.js"

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

echo "Checking auth-scope-policy-utils exports..."
require_pattern '^export function isAdminRole' "$UTILS_FILE" 'isAdminRole export exists'
require_pattern '^export function isAuthenticatedUser' "$UTILS_FILE" 'isAuthenticatedUser export exists'
require_pattern '^export function canManageDirectories' "$UTILS_FILE" 'canManageDirectories export exists'
require_pattern '^export function canManageUsers' "$UTILS_FILE" 'canManageUsers export exists'
require_pattern '^export function getDirectoryScopeOptions' "$UTILS_FILE" 'getDirectoryScopeOptions export exists'
require_pattern '^export function canOpenDirectoryItem' "$UTILS_FILE" 'canOpenDirectoryItem export exists'
require_pattern '^export function canEditDirectoryItem' "$UTILS_FILE" 'canEditDirectoryItem export exists'

echo "Checking app.js policy wiring..."
require_pattern 'from "\./auth-scope-policy-utils\.js"' "$APP_FILE" 'app.js imports auth-scope-policy-utils.js'
require_pattern 'return isAdminRolePolicy\(role\);' "$APP_FILE" 'isAdminRole delegates to policy module'
require_pattern 'return getDirectoryScopeOptionsPolicy\(state\.authUser, kind\);' "$APP_FILE" 'getDirectoryScopeOptions delegates with explicit authUser'
require_pattern 'return canManageDirectoriesPolicy\(state\.authUser\);' "$APP_FILE" 'canManageDirectories delegates with explicit authUser'
require_pattern 'return canManageUsersPolicy\(state\.authUser\);' "$APP_FILE" 'canManageUsers delegates with explicit authUser'
require_pattern 'return isAuthenticatedUserPolicy\(state\.authUser\);' "$APP_FILE" 'isAuthenticated delegates with explicit authUser'

echo "Running policy matrix fixtures..."
node - "$UTILS_FILE" <<'NODE'
const fs = require('fs');
const vm = require('vm');

const utilsPath = process.argv[2];
let source = fs.readFileSync(utilsPath, 'utf8');
source = source.replace(/export function\s+/g, 'function ');
source += '\nmodule.exports = { isAdminRole, isAuthenticatedUser, canManageDirectories, canManageUsers, canOpenDirectoryItem, canEditDirectoryItem, getDirectoryScopeOptions };\n';

const context = { module: { exports: {} }, exports: {} };
vm.createContext(context);
vm.runInContext(source, context, { filename: utilsPath });

const {
  isAdminRole,
  isAuthenticatedUser,
  canManageDirectories,
  canManageUsers,
  canOpenDirectoryItem,
  canEditDirectoryItem,
  getDirectoryScopeOptions
} = context.module.exports;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const guest = null;
const user = { id: 'u1', role: 'user' };
const adminView = { id: 'u2', role: 'admin_view' };
const adminFull = { id: 'u3', role: 'admin_full' };

assert(isAdminRole('admin_view') === true, 'admin_view must be admin role');
assert(isAdminRole('admin_full') === true, 'admin_full must be admin role');
assert(isAdminRole('user') === false, 'user must not be admin role');

assert(isAuthenticatedUser(guest) === false, 'guest must be unauthenticated');
assert(isAuthenticatedUser(user) === true, 'user must be authenticated');

assert(canManageDirectories(guest) === false, 'guest must not manage directories');
assert(canManageDirectories(adminView) === false, 'admin_view must not manage directories');
assert(canManageDirectories(adminFull) === true, 'admin_full must manage directories');

assert(canManageUsers(guest) === false, 'guest must not manage users');
assert(canManageUsers(adminView) === false, 'admin_view must not manage users');
assert(canManageUsers(adminFull) === true, 'admin_full must manage users');

assert(canOpenDirectoryItem(guest, { id: 'x' }) === false, 'guest must not open directory item');
assert(canOpenDirectoryItem(user, null) === false, 'authenticated with missing item must be false');
assert(canOpenDirectoryItem(user, { id: 'x' }) === true, 'authenticated with item must be true');

assert(canEditDirectoryItem({ can_edit: true }) === true, 'can_edit=true must be editable');
assert(canEditDirectoryItem({ can_edit: false }) === false, 'can_edit=false must not be editable');

const guestInst = getDirectoryScopeOptions(guest, 'institutions').map((x) => x.value).join(',');
const userInst = getDirectoryScopeOptions(user, 'institutions').map((x) => x.value).join(',');
const adminInst = getDirectoryScopeOptions(adminView, 'institutions').map((x) => x.value).join(',');
const adminTpl = getDirectoryScopeOptions(adminFull, 'templates').map((x) => x.value).join(',');

assert(guestInst === '', 'guest institutions options mismatch');
assert(userInst === ',favorites', 'user institutions options mismatch');
assert(adminInst === ',public,owned', 'admin institutions options mismatch');
assert(adminTpl === ',public,owned', 'admin templates options mismatch');

console.log('Policy matrix fixture checks passed.');
NODE

echo "Auth/scope policy smoke-check passed."
