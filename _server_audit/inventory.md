# Server Inventory (pre-migration)

## Project path
- `/var/www/complaints-backend/complaints_m`

## Git state
- Current branch: `multi-user`
- Last commit: `103341d Complete full refactor pass, baseline verification, and docs sync`
- Remote:
  - `origin git@github.com:9401689-sudo/complaints.git (fetch)`
  - `origin git@github.com:9401689-sudo/complaints.git (push)`

### Working tree status
- Tracked modified files:
  - `.env`
- Staged files:
  - none
- Untracked files:
  - `.env.server.bak`
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
  - `scripts/smoke-check-app-boundary-imports.sh`
  - `scripts/smoke-check-auth-scope-policy-utils.sh`
  - `scripts/smoke-check-case-status-badge-utils.sh`
  - `scripts/smoke-check-context-nav-model-utils.sh`
  - `scripts/smoke-check-date-text-utils.sh`
  - `scripts/smoke-check-display-format-utils.sh`
  - `scripts/smoke-check-extracted-constants.sh`
  - `scripts/smoke-check-file-preview-display-utils.sh`
  - `scripts/smoke-check-filter-option-derivation-utils.sh`
  - `scripts/smoke-check-fixed-variables-config.sh`
  - `scripts/smoke-check-label-lookup-utils.sh`
  - `scripts/smoke-check-list-filter-query-utils.sh`
  - `scripts/smoke-check-mime-preview-lookup-utils.sh`
  - `scripts/smoke-check-preview-markup-template-utils.sh`
  - `scripts/smoke-check-preview-text-format-utils.sh`
  - `scripts/smoke-check-readonly-ui-decision-utils.sh`
  - `scripts/smoke-check-safe-boundary-completeness.sh`
  - `scripts/smoke-check-submit-workspace-precondition-utils.sh`
  - `scripts/smoke-check-template-workspace-derivation-utils.sh`
  - `scripts/smoke-check-text-display-utils.sh`
  - `scripts/smoke-check-variable-template-transform-utils.sh`
  - `scripts/smoke-check-workspace-status-progress-text-utils.sh`
  - `submit-workspace-precondition-utils.js`
  - `template-workspace-derivation-utils.js`
  - `text-display-utils.js`
  - `variable-template-transform-utils.js`
  - `workspace-status-progress-text-utils.js`

## Environment files (.env*)
- `./.env`
- `./.env.save`
- `./.env.server.bak`

## Docker / deploy / infra-related files
### Docker
- `./docker-compose.yml`
- `./Dockerfile`

### Deploy scripts
- `./scripts/deploy-complaints-m.ps1`
- `./scripts/deploy-complaints-m.sh`

### Scripts and migration-related references
- Script directories:
  - `./scripts`
  - `./src/scripts`
- Script files:
  - `./scripts/verify-baseline.ps1`
  - `./scripts/smoke-check-*.sh` (multiple files, see untracked list)
  - `./src/scripts/create-admin-user.ts`
  - `./src/scripts/restore-case-from-nextcloud.ts`
- Migration/README docs found nearby:
  - `./docs/04-data/migrations-and-sql.md`
  - `./docs/06-infrastructure/deployment-runbook.md`
  - `./docs/README.md`
  - `./docs/00-overview/README.md`

### nginx/apache/systemd configs рядом с проектом
- Dedicated runtime config files (`nginx.conf`, `apache*.conf`, `*.service`) in project root tree: not found.
- Only documentation-style `.conf` hits were detected by broad filename pattern.

## Runtime directories (potentially important)
Detected inside project tree:
- `./backups`

Also matched by generic name pattern (not application runtime payload, but git internals):
- `./.git/logs`

No explicit matches found for:
- `uploads`
- `storage`
- `data`
- `media`
- `public/uploads`
- top-level `logs`

## What is already in git vs not
### Already tracked in git
- Main project files and docs currently at commit `103341d`.
- `.env` is tracked and currently locally modified on server.

### Not tracked in git (server-local)
- All files listed in “Untracked files” above (helper JS and smoke scripts cluster + `.env.server.bak`).

## Notes for migration preparation
- Server working tree is **not clean** (`.env` modified + large untracked set).
- Before migration/copy, preserve both:
  1. tracked state at commit `103341d`, and
  2. server-local deltas listed above (especially `.env` and untracked scripts/helpers).
