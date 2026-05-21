# Code Migration Report (server copy -> repository)

## Source and target

- Source snapshot: `/tmp/server-copy-Complaints_m/` (copied from server)
- Target repo: `C:\1_Work\Работа\Сайты\Complaints_m`

## What was transferred

Transferred from server copy to repository working tree:

- Source code:
  - `api.js`, `app.js`
  - `src/**` (backend TypeScript modules and scripts)
  - server-local helper JS files (root-level `*-utils.js` cluster)
- Deployment/config files:
  - `docker-compose.yml`
  - `Dockerfile`
  - `.dockerignore`
  - `package.json`, `package-lock.json`, `tsconfig.json`
  - deploy scripts in `scripts/` (`deploy-complaints-m.ps1`, `deploy-complaints-m.sh`)
- Migrations / DB-related code artifacts:
  - `sql/001_init_mvp.sql`
  - `src/modules/db/**`
  - `src/modules/fsm/**`
- Documentation / README:
  - `docs/**`
  - `docs/README.md`
  - server audit file from server side: `_server_audit/inventory.md`
- Additional project assets and templates:
  - `templates/*.txt`
  - `dialog.png`, `favicon.svg`, `index.html`, `styles.css`

## What was intentionally NOT transferred

Excluded by policy during rsync:

- Secrets and env:
  - `.env`
  - `.env.*`
  - `*.pem`
  - `*.key`
  - `id_rsa*`
- Data/runtime and large mutable artifacts:
  - `backups/`
  - `uploads/`
  - `media/`
  - `storage/`
  - `data/`
  - `public/uploads/`
  - `logs/`
- Dependency/build artifacts:
  - `.git/`
  - `node_modules/`
  - `vendor/`
  - `dist/`
  - `build/`
  - `.next/`
  - `cache/`
  - `tmp/`
- DB dump-like patterns:
  - `*.sql.gz`
  - `*.dump`
  - `*.bak`

## Requires manual review

1. Server-only helper cluster now present as untracked files in local repo:
   - root `*-utils.js` set
   - `scripts/smoke-check-*.sh` set
   Decision needed: keep as migration artifacts, integrate, or archive.

2. Line ending normalization:
   - Git emitted many `LF will be replaced by CRLF` warnings.
   Decision needed: enforce `.gitattributes`/line-ending policy before commit.

3. `.vscode/extensions.json` changed:
   - Decide whether editor-specific changes should be committed.

4. Directory layout differences:
   - Local has `deploy/`, `_server_secrets/`, `_server_snapshot/` scaffold.
   - Ensure these stay as migration tooling and do not conflict with runtime deploy.

5. Secrets reconciliation:
   - `.env` intentionally excluded, but server values differ from local baseline.
   - Prepare encrypted secret package before migration cutover.
