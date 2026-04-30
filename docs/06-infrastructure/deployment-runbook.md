# Deployment Runbook

## Minimal deploy sequence (server)

1. Switch to project dir:
   - `/var/www/complaints-backend/complaints_m`
2. Pull target branch.
3. Verify `.env` contains:
   - `PORT=3018`
   - `API_BASE_PATH=/complaints_m/api`
   - Nextcloud/Postgres/Redis credentials
   - `BACKUP_DIR=/app/backups`
4. Rebuild/restart:
   - `docker compose up -d --build`
5. Verify container and health:
   - `docker compose ps`
   - `curl http://127.0.0.1:3018/health`
   - `curl http://127.0.0.1:3018/complaints_m/api/health`

## Reverse proxy contract

- Public API host expected by frontend:
  - `https://complaints-api.doorsvip.ru/complaints_m/api/*`
- Upstream target must route to container `complaints-backend-m` on port `3018`.
- Mismatch here causes browser `failed to fetch` / 502 symptoms.
