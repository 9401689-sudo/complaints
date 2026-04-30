# API Contract

## Base URL derivation

- Frontend computes API base as:
  - `https://complaints-api.doorsvip.ru/<app-prefix>/api`
- `<app-prefix>` is the first path segment of current page URL.
  - Example: app opened at `/complaints_m/...` -> API base `/complaints_m/api`.

## Transport/auth

- Content type: JSON for all non-binary payloads.
- Auth: Bearer token in `Authorization` header.
- Public routes:
  - `/health`
  - `/<base>/health`
  - `/<base>/health/db`
  - `/<base>/auth/register`
  - `/<base>/auth/login`
  - GET `/<base>/institutions*`
  - GET `/<base>/templates*`

## Response envelope conventions

- Success usually includes `ok: true` plus domain payload.
- Failures include `ok: false` and `error` message.
- Some legacy handlers return plain domain object shapes; frontend expects mixed style.

## Common error semantics

- `401 unauthorized` — missing/invalid token.
- `403 forbidden` — role insufficient.
- `404` — resource not found.
- `409` — state conflict (FSM/business constraints).
- `500` — internal error.
