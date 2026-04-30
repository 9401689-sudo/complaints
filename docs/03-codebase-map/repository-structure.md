# Repository Structure

## Current root layout (`Complaints_m`)

- `/app.js` — main frontend orchestration/state/render/events.
- `/api.js` — frontend API transport/auth token wiring.
- `/index.html` — page shell + modal/tab structure.
- `/styles.css` — full UI styling.
- `/src/**` — backend TypeScript source (active).
- `/sql/001_init_mvp.sql` — DB schema + migration-like evolution block.
- `/scripts/**` — backend utility scripts (`create-admin-user`, smoke checks, restore scripts).
- `/docker-compose.yml` + `/Dockerfile` — container run/build.
- `/backups/**` — backup files (host side).

## Backend module map (active)

- `auth` — register/login/session/role/admin endpoints.
- `admin` — backup management service.
- `cases` — case lifecycle + ownership + soft-delete/purge/restore.
- `files` — sync/upload/preview/download + result files.
- `institutions` — directory + visibility + favorites + soft-delete.
- `templates` — template directory + visibility + favorites + soft-delete.
- `variables`, `text`, `case-config`, `package` — workspace data slices.
- `fsm` — Redis snapshot state machine service.
- `nextcloud` — WebDAV integration client.
- `db`, `redis` — infra adapters.

## Non-primary trees

- `/dist/**` — compiled JS output.
- `/node_modules/**` — dependencies.
- `/complaints/**` — nested duplicate tree; do not treat as primary until consolidation stage.
