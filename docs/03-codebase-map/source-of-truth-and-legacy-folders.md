# Source Of Truth And Legacy Folders

## Source of truth

- Frontend source: repo root
  - `app.js`
  - `api.js`
  - `index.html`
  - `styles.css`
- Backend source: repo root backend TypeScript tree
  - `src/index.ts`
  - `src/modules/**`
  - `src/config/env.ts`
  - `sql/001_init_mvp.sql`
- Runtime container config (current active variant):
  - `docker-compose.yml` (root, `complaints-backend-m`, port `3018`, volume `complaints_m_backups`)
  - `Dockerfile` (root)

## Secondary/derived layers (not primary edit target)

- `dist/**` — build artifacts from TypeScript backend.
- `node_modules/**` — dependency cache.
- `backups/**` — backup files (host side).

## Legacy/ambiguity risks

- `complaints/**` nested tree exists and partially duplicates backend layout.
- For current `Complaints_m` flow, edit source in root `src/**`, not in nested duplicates.

## Rule for contributors

- Any behavior change must be made in root source-of-truth files first.
- If nested duplicates are still present, treat them as historical baggage until explicit cleanup stage.
