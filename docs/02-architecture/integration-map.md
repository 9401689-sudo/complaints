# Integration Map

## Frontend -> API

- Protocol: HTTPS JSON.
- Base: `https://complaints-api.doorsvip.ru/<prefix>/api`.
- Auth: Bearer token (`Authorization`) and fallback query token for preview links.

## API -> PostgreSQL

- Adapter: `pg` Pool (`db/postgres.ts`).
- Schema: `complaints` (via `POSTGRES_SCHEMA` search_path option).
- Stores:
  - users/sessions
  - cases/directories/favorites
  - workspace records
  - soft-delete metadata

## API -> Redis

- Adapter: `ioredis`.
- Purpose: FSM snapshots (`complaints:case:<id>:fsm`).
- Lifecycle:
  - saved/updated during case transitions
  - purged during deletes/restore backup flows

## API -> Nextcloud WebDAV

- Protocol: DAV verbs (`PROPFIND`, `MKCOL`, `PUT`, `GET`, `MOVE`, `DELETE`).
- Purpose:
  - create case folder structure
  - sync incoming files
  - store/read generated text and package artifacts
  - manage result files

## API -> system tools (admin backups)

- `pg_dump` for backup creation.
- `psql` for restore.
- Backup directory via `BACKUP_DIR` + Docker volume `complaints_m_backups`.

## High-risk failure surfaces

- Reverse proxy path mismatch (`/<prefix>/api`) -> browser `failed to fetch`/502.
- Nextcloud credentials/path issues -> sync/upload/submit failures.
- Redis unavailability -> FSM operations fail.
- DB restore without cache cleanup -> stale FSM state (handled by backup service).
