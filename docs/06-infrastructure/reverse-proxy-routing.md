# Reverse Proxy Routing

## Required public contract

- Frontend host path: `https://www.doorsvip.ru/complaints_m/...`
- API host/path: `https://complaints-api.doorsvip.ru/complaints_m/api/...`

## Upstream expectation

- `complaints-api.doorsvip.ru` route for `/complaints_m/api/*` must proxy to:
  - container/service: `complaints-backend-m`
  - port: `3018`

## Typical failure mode

- If upstream points to old service/port (`3017`/single-user container), browser shows:
  - `failed to fetch`
  - HTTP 502 on health/auth endpoints.

## Preflight/CORS

- Backend uses `@fastify/cors` with `origin: true`.
- `OPTIONS` requests are allowed by auth hook and should pass through proxy unchanged.
