#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_FILE="$ROOT_DIR/app.js"
UTILS_FILE="$ROOT_DIR/template-workspace-derivation-utils.js"

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

echo "Checking template-workspace-derivation-utils exports..."
require_pattern '^export function resolveCurrentTemplate' "$UTILS_FILE" 'resolveCurrentTemplate export exists'
require_pattern '^export function buildComputedTextPreview' "$UTILS_FILE" 'buildComputedTextPreview export exists'

echo "Checking app.js wiring for template/workspace derivation seam..."
require_pattern 'from "\./template-workspace-derivation-utils\.js"' "$APP_FILE" 'app.js imports template-workspace-derivation-utils.js'
require_pattern 'return resolveCurrentTemplate\(state\.templates, templateId\);' "$APP_FILE" 'getCurrentTemplate delegates to extracted lookup helper'
require_pattern 'return buildComputedTextPreviewDerived\(getCurrentTemplate\(\), state\.variables\);' "$APP_FILE" 'buildComputedTextPreview delegates to extracted computed-text helper'

echo "Running computed-text and template-lookup fixtures..."
node - "$UTILS_FILE" <<'NODE'
const fs = require('fs');
const vm = require('vm');

const utilsPath = process.argv[2];
let source = fs.readFileSync(utilsPath, 'utf8');
source = source.replace(/import[\s\S]*?from\s+["'][^"']+["'];\n?/g, '');
source = source.replace(/export function\s+/g, 'function ');
source += '\nmodule.exports = { resolveCurrentTemplate, buildComputedTextPreview };\n';

const FIXED_VARIABLES = [
  { key: 'complaint_date', enabledKey: 'complaint_date_enabled' },
  { key: 'address', enabledKey: 'address_enabled' },
  { key: 'license_plate', enabledKey: 'license_plate_enabled' }
];

function normalizeVariableState(variables = {}) {
  const normalized = { ...variables };
  for (const field of FIXED_VARIABLES) {
    const rawEnabled = normalized[field.enabledKey];
    const enabled = rawEnabled === undefined ? true : String(rawEnabled).toLowerCase() === 'true';
    normalized[field.enabledKey] = String(enabled);
    if (normalized[field.key] === undefined || normalized[field.key] === null || normalized[field.key] === '') {
      normalized[field.key] = '';
    }
  }
  return normalized;
}

function getRenderableVariableValue(field, variables) {
  const enabled = String(variables[field.enabledKey] ?? 'true').toLowerCase() === 'true';
  if (!enabled) return '';
  if (field.key === 'complaint_date') {
    return String(variables[field.key] || '').trim() ? '1 января 2026 г.' : '';
  }
  return String(variables[field.key] ?? '');
}

function collapseDuplicateDateSuffixes(text) {
  return String(text || '').replace(/(\d{1,2}\s+[А-Яа-яЁё]+\s+\d{4})\s*г\.\s*г\./g, '$1 г.');
}

const context = {
  module: { exports: {} },
  exports: {},
  FIXED_VARIABLES,
  normalizeVariableState,
  getRenderableVariableValue,
  collapseDuplicateDateSuffixes
};
vm.createContext(context);
vm.runInContext(source, context, { filename: utilsPath });

const { resolveCurrentTemplate, buildComputedTextPreview } = context.module.exports;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const templates = [
  { id: 't1', body_template: 'A {{address}}', default_values: { address: 'Default st' } },
  { id: 't2', body_template: 'Дата: {{complaint_date}} г.', default_values: { complaint_date: '01.01.2026' } }
];

assert(resolveCurrentTemplate(templates, 't1')?.id === 't1', 'template lookup by id mismatch');
assert(resolveCurrentTemplate(templates, 'missing') === null, 'unknown template id must resolve to null');
assert(resolveCurrentTemplate(templates, '') === null, 'empty template id must resolve to null');

assert(buildComputedTextPreview(null, {}) === '', 'missing template must return empty preview');
assert(buildComputedTextPreview({ id: 'x', body_template: '' }, {}) === '', 'template without body must return empty preview');

const mergedPreview = buildComputedTextPreview(
  { id: 'x', body_template: 'Адрес: {{address}} | Номер: {{custom}}', default_values: { address: 'Default', custom: 'A' } },
  { address: 'Override', custom: 'B' }
);
assert(mergedPreview === 'Адрес: Override | Номер: B', 'default/state merge precedence mismatch');

const disabledPreview = buildComputedTextPreview(
  { id: 'x', body_template: 'Адрес: {{address}}', default_values: { address: 'Default' } },
  { address_enabled: 'false', address: 'Hidden' }
);
assert(disabledPreview === 'Адрес: ', 'disabled fixed variable must render as empty string');

const dateSuffixPreview = buildComputedTextPreview(
  { id: 'x', body_template: 'Дата: {{complaint_date}} г.', default_values: { complaint_date: '01.01.2026' } },
  {}
);
assert(dateSuffixPreview === 'Дата: 1 января 2026 г.', 'duplicate date suffix collapse mismatch');

console.log('Template/workspace derivation fixture checks passed.');
NODE

echo "Template/workspace derivation smoke-check passed."
