# Backend Architecture

## Entry point

- `src/index.ts`
  - creates Fastify app
  - applies CORS/formbody
  - exposes health endpoints
  - registers auth routes
  - installs auth `onRequest` gate
  - registers domain routes

## Route -> service pattern

- Each domain module contains:
  - `*.routes.ts` (HTTP mapping and error/status normalization)
  - `*.service.ts` (business logic, DB/integration calls)
  - `*.types.ts` (typed payloads/records)

## Active backend domains

- `auth`:
  - register/login/logout/me/session token validation
  - role management and user admin operations
- `admin`:
  - backups list/create/restore/delete
- `cases`:
  - list/create/get/meta updates
  - text generation/package/submit preparation
  - soft delete, restore, purge
- `files`:
  - incoming sync/upload
  - result files upload/list
  - preview/download endpoints
- `institutions`, `templates`:
  - CRUD + visibility/ownership + favorites + soft-delete flows
- `variables`, `text`, `case-config`, `package`:
  - workspace content and configuration
- `fsm`:
  - Redis-backed case state snapshots

## Cross-cutting concerns

- Auth policy:
  - implemented in `onRequest` + `auth.utils.ts`
- Database access:
  - centralized pool in `db/postgres.ts`
- External file store:
  - Nextcloud WebDAV client
- Cache/state:
  - Redis for FSM snapshots

## Error strategy

- Services throw semantic errors (`not found`, `forbidden`, `invalid ...`, etc.).
- Routes map known messages to HTTP codes and return `{ ok: false, error }`.
