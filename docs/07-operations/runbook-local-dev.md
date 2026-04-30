# Runbook Local Dev

## Prerequisites

- Node.js (matching project lockfile expectations).
- PostgreSQL and Redis reachable with `.env` values.
- Nextcloud credentials for file flows (optional for limited UI work).

## Local start

1. Install deps:
   - `npm ci`
2. Start backend dev:
   - `npm run dev`
3. Open frontend from repo root static files (same path prefix assumptions as deployed app).

## Useful local checks

- `curl http://127.0.0.1:<PORT>/health`
- `curl http://127.0.0.1:<PORT>/<API_BASE_PATH>/health`

## Auth bootstrap

- Create admin user (built backend):
  - `npm run build`
  - `node dist/scripts/create-admin-user.js <nickname> <password> admin_full`
