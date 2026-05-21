# Cutover Checklist (Old VPS -> New VPS)

## 1. Pre-cutover preparation
- [ ] Confirm access to GitHub repo and branch `server-backup-2026-05-21`.
- [ ] Confirm SSH access to new VPS.
- [ ] Confirm domain DNS TTL lowered in advance (recommended).
- [ ] Confirm required ports are open on new VPS: `22`, `80`, `443`.
- [ ] Confirm Docker and Docker Compose are installed on new VPS.
- [ ] Confirm GPG is installed on new VPS (for decrypting backups).

## 2. Deploy code on new VPS
- [ ] Clone repository.
- [ ] Checkout `server-backup-2026-05-21`.
- [ ] Verify files exist:
  - `docker-compose.yml`
  - `docker-compose.proxy.yml`
  - `docker-compose.proxy-ssl.yml`
  - `RESTORE_FROM_BACKUP.md`

## 3. Restore secrets and config
- [ ] Decrypt required `_server_secrets/*.gpg`.
- [ ] Place `.env` in project root (next to `docker-compose.yml`).
- [ ] Validate critical env keys:
  - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
  - `REDIS_HOST`, `REDIS_PORT` (if overridden)
  - API/public base URL related keys
  - Nextcloud/other external integration keys (if used)

## 4. Start core services
- [ ] Run `docker compose up -d --build`.
- [ ] Verify containers are healthy:
  - backend
  - postgres
  - redis
- [ ] Run health checks:
  - `curl http://127.0.0.1:3018/health`
  - `curl http://127.0.0.1:3018/complaints_m/api/health`

## 5. Database restore (if required)
- [ ] Decrypt DB backup from `deploy/db/*.gpg`.
- [ ] Restore dump into PostgreSQL container/service.
- [ ] Validate key entities/tables are present.

## 6. HTTPS and reverse proxy
- [ ] Issue TLS certificate with Certbot (or install existing cert).
- [ ] Place cert files:
  - `deploy/nginx/certs/fullchain.pem`
  - `deploy/nginx/certs/privkey.pem`
- [ ] Set real `server_name` in `deploy/nginx/complaints-proxy-ssl.conf`.
- [ ] Start proxy stack:
  - `docker compose -f docker-compose.yml -f docker-compose.proxy.yml -f docker-compose.proxy-ssl.yml up -d --build`
- [ ] External checks:
  - `curl -I https://<domain>/health`
  - `curl https://<domain>/complaints_m/api/health`

## 7. Functional smoke checks
- [ ] Open frontend and verify no `failed to fetch` on login.
- [ ] Login with admin and regular user.
- [ ] Create test case and verify expected status flow.
- [ ] Verify template/org visibility rules and filters.
- [ ] Verify file upload and preview.
- [ ] Verify backup list is visible in admin area.

## 8. DNS cutover
- [ ] Point production domain(s) to new VPS IP.
- [ ] Wait for propagation.
- [ ] Repeat health and login checks via public domain.

## 9. Post-cutover monitoring (first 1-2 hours)
- [ ] Watch container logs for backend/proxy/db errors.
- [ ] Watch auth requests and API 4xx/5xx rates.
- [ ] Confirm no sustained restart loops.

## 10. Rollback plan (if needed)
- [ ] Keep old VPS running until new VPS is verified stable.
- [ ] If critical failure occurs, revert DNS to old VPS.
- [ ] Re-validate old VPS health endpoints.
- [ ] Capture incident notes and root cause before retrying cutover.

## Exit criteria (cutover complete)
- [ ] Public HTTPS health endpoint is stable.
- [ ] Login and core user flows work.
- [ ] Data integrity checks pass.
- [ ] Monitoring is clean for agreed stabilization window.
