# Server vs Local Diff Summary

Comparison basis:
- Local repo: `C:\1_Work\Работа\Сайты\Complaints_m`
- Server copy: `/tmp/server-copy-Complaints_m` (copied from `/var/www/complaints-backend/complaints_m`)
- Commands/results:
  - `_server_audit/rsync_commands.md`
  - `_server_audit/server_vs_local.diff`
  - `_server_audit/server_vs_local_brief.txt`

## 1) Files that differ (present on both sides)

- `.env`
  - Local has old values (`PORT=3017`, `/complaints/api`, old DB password).
  - Server copy has active values (`PORT=3018`, `/complaints_m/api`, current DB password).
- `.gitignore`
  - Local updated with migration/audit ignores and encrypted-secrets policy.
  - Server copy has older `.gitignore`.

## 2) Files that exist only on server copy

- `.env.server.bak`
- `_server_audit/inventory.md`
- Legacy untracked helper JS files in root:
  - `auth-scope-policy-utils.js`
  - `case-status-badge-utils.js`
  - `case-status-constants.js`
  - `context-nav-model-utils.js`
  - `date-text-utils.js`
  - `directory-category-constants.js`
  - `display-format-utils.js`
  - `file-preview-display-utils.js`
  - `filter-option-derivation-utils.js`
  - `fixed-variables-config.js`
  - `label-lookup-utils.js`
  - `list-filter-query-utils.js`
  - `mime-preview-lookup-utils.js`
  - `preview-markup-template-utils.js`
  - `preview-text-format-utils.js`
  - `readonly-ui-decision-utils.js`
  - `safe-modules-boundary.js`
  - `submit-workspace-precondition-utils.js`
  - `template-workspace-derivation-utils.js`
  - `text-display-utils.js`
  - `variable-template-transform-utils.js`
  - `workspace-status-progress-text-utils.js`
- Legacy untracked smoke scripts in `scripts/`:
  - `smoke-check-*.sh` set (app-boundary, auth-scope, case-status, context-nav, date-text, display-format, extracted-constants, file-preview, filter-option, fixed-variables, label-lookup, list-filter, mime-preview, preview-markup, preview-text, readonly-ui, safe-boundary-completeness, submit-workspace, template-workspace, text-display, variable-template, workspace-status-progress).

## 3) Files/directories that exist only locally

- `_server_secrets/` (new local migration prep)
- `_server_snapshot/` (new local migration prep)
- `deploy/` (new local migration prep)
- `complaints/` (local-only nested directory in this repository layout)
- Local audit artifacts:
  - `_server_audit/server_vs_local.diff`
  - `_server_audit/server_vs_local_brief.txt`

## 4) Potential secrets detected

High risk:
- `.env` (contains DB/Redis/Nextcloud credentials)
- `.env.save` (environment values)
- `.env.server.bak` (server-side env backup; exists on server copy only)

Also sensitive by policy if present in future:
- `*.pem`, `*.key`, `id_rsa*`, `*_secret*`, `*_secrets*`

## 5) Runtime/data files that should not be blindly committed as code

- `backups/` (runtime backup payload directory; environment data, not source code)
- Any future runtime dirs of same class (`uploads`, `storage`, `data`, `media`, `public/uploads`, `logs`) should be migrated as data artifacts, not code commits.

## 6) Notes for migration

- Server currently contains important local state not in git (legacy helper/smoke files + `.env.server.bak`).
- Local repo contains new migration scaffolding not yet present on server (`_server_snapshot`, `_server_secrets`, `deploy/*`).
- Before VPS migration cutover, treat:
  - `.env*` as secrets/config to transfer securely,
  - `backups/` as data to transfer separately from source code,
  - server-only untracked files as decision items (keep/archive/drop).
