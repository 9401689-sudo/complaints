# Auth Transport Incident

## Symptom

- Browser login flow surfaced alert: `failed to fetch`.
- External API calls returned transport-level failures (`502`) for `/complaints_m/api/*`.

## Root cause

- Reverse proxy upstream/path mapping mismatch for multi-user API prefix.
- Requests were routed to wrong backend target/port instead of `complaints-backend-m:3018`.

## Fix

- Corrected proxy route for `/complaints_m/api/*` to current multi-user backend service.
- Revalidated with:
  - external `GET /complaints_m/api/health`
  - auth endpoint transport checks.

## Prevention

- Keep explicit reverse-proxy contract in docs.
- Include external health check in release checklist.
