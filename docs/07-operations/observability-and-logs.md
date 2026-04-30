# Observability And Logs

## Primary log sources

- Backend container:
  - `docker logs complaints-backend-m`
- Compose service status:
  - `docker compose ps`
- Reverse proxy logs (NPM/host-specific location)
- Browser devtools network tab for client-visible transport failures

## Useful patterns

- Incoming request and completion lines from Fastify logger.
- `unauthorized` / `forbidden` responses for auth policy debugging.
- Nextcloud operation exceptions (`Nextcloud * failed`).
- DB/Redis connectivity errors on startup/runtime.
