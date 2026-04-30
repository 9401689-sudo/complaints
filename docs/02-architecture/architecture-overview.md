# Architecture Overview

## High-level runtime

- Frontend: single-page style app in root `app.js` with module-style `import` from `api.js`.
- Backend: Fastify app in `src/index.ts`, modular route/service architecture.
- Data: PostgreSQL schema `complaints` with ownership, soft-delete, favorites, sessions.
- State machine: Redis-backed FSM snapshots per case.
- File storage/integration: Nextcloud WebDAV for case folders, artifacts, incoming/result files.

## Request flow

1. Browser calls `api.js`.
2. `api.js` builds API base by URL prefix (`/complaints_m` -> `/complaints_m/api`).
3. Bearer token from `localStorage` is attached when present.
4. Fastify `onRequest` hook enforces auth policy:
   - public: health, register/login, GET institutions/templates
   - protected: all other routes
5. Route delegates to domain service.
6. Service uses Postgres/Redis/Nextcloud as needed.

## Domain boundaries

- UI orchestration remains in frontend `app.js`.
- Backend follows route -> service pattern.
- Infra clients are isolated in `db/postgres.ts`, `redis/redis.ts`, `nextcloud/nextcloud.client.ts`.

## Security/permission layer

- Roles: `user`, `admin_view`, `admin_full`.
- Role checks centralized through auth utilities + `ensureRole`.
- Resource visibility uses ownership + `visibility` fields (`public` / `private`).
