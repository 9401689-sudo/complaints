# Restore From Backup (New VPS)

## 1) Clone repository
```bash
git clone git@github.com:9401689-sudo/complaints.git
cd complaints
```

## 2) Switch to backup branch
```bash
git fetch --all --prune
git checkout server-backup-2026-05-21
git pull
```

## 3) Decrypt secrets
Encrypted secrets are stored in:
- `_server_secrets/*.gpg`
- `deploy/db/*.gpg`

Decrypt example:
```bash
gpg -d _server_secrets/Complaints_m__.env.env.gpg > .env
```

Decrypt DB dump example:
```bash
gpg -d deploy/db/complaints_m_20260521_121527.sql.gz.gpg > /tmp/complaints_m.sql.gz
gunzip /tmp/complaints_m.sql.gz
```

Important:
- Do not commit decrypted files.
- Keep GPG passphrase outside repository.

## 4) Where to place `.env`
Project uses `.env` next to `docker-compose.yml` (repo root for `complaints_m` deployment layout).

Expected by compose:
- `docker-compose.yml` has `env_file: - .env`
- App container reads runtime env from this file.

## 5) Restore nginx / systemd / cron
Use collected configs as source:
- `deploy/nginx/*`
- `deploy/systemd/*`
- `deploy/cron/*`

Apply manually on new VPS:
- Nginx: copy/merge into `/etc/nginx/sites-available` or active include path.
- Systemd: copy/merge unit files into `/etc/systemd/system`, then:
  ```bash
  sudo systemctl daemon-reload
  # TODO: enable/start exact units after validating unit names and dependencies
  ```
- Cron: merge entries to root/user crontab or `/etc/cron.d`.

TODO:
- Validate exact final destination filenames and include chains on target VPS.

## 6) Restore Docker volumes (if needed)
Known volumes from compose:
- `complaints_m_backups` (app backups)
- `complaints_m_postgres_data` (PostgreSQL data)
- `complaints_m_redis_data` (Redis persistence)

If you have old volume data tarball:
```bash
docker volume create complaints_m_backups
# TODO: restore backup data into volume (depends on your archive format/tooling)
```

If no historical volume data is required, volumes are created automatically by `docker compose up`.

## 7) Restore database from encrypted dump
1. Decrypt `.gpg` dump (see section 3).
2. Restore into PostgreSQL.

Current compose runs local PostgreSQL service (`postgres`), so restore example:
  ```bash
  docker exec -i complaints-postgres-m psql -U <POSTGRES_USER> -d <POSTGRES_DB> -f /tmp/complaints_m.sql
  ```

TODO:
- Confirm DB/user in `.env` match the target restore command.

## 8) Start project
From project root:
```bash
docker compose up -d --build
docker compose ps
```

This compose starts:
- `complaints-backend-m`
- `complaints-postgres-m`
- `complaints-redis-m`

Optional reverse proxy layer (Nginx in Docker):
```bash
docker compose -f docker-compose.yml -f docker-compose.proxy.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.proxy.yml ps
```

Optional HTTPS proxy layer:
```bash
# 1) Put cert files:
#    deploy/nginx/certs/fullchain.pem
#    deploy/nginx/certs/privkey.pem
#
# 2) Start with SSL override:
docker compose -f docker-compose.yml -f docker-compose.proxy.yml -f docker-compose.proxy-ssl.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.proxy.yml -f docker-compose.proxy-ssl.yml ps
```

### How to get SSL certificates (Let's Encrypt, recommended)
Replace placeholders:
- `complaints-api.your-domain.com`
- `you@example.com`

1. Point domain DNS to new VPS (A-record to new public IP).
2. Open ports 80 and 443 in firewall/security group.
3. Stop proxy containers so port 80 is free:
```bash
docker compose -f docker-compose.yml -f docker-compose.proxy.yml down
```
4. Install Certbot:
```bash
sudo apt update
sudo apt install -y certbot
```
5. Issue certificate:
```bash
sudo certbot certonly --standalone \
  -d complaints-api.your-domain.com \
  -m you@example.com \
  --agree-tos \
  --no-eff-email
```
6. Copy cert files into project:
```bash
mkdir -p deploy/nginx/certs
sudo cp /etc/letsencrypt/live/complaints-api.your-domain.com/fullchain.pem deploy/nginx/certs/fullchain.pem
sudo cp /etc/letsencrypt/live/complaints-api.your-domain.com/privkey.pem deploy/nginx/certs/privkey.pem
sudo chown $(id -u):$(id -g) deploy/nginx/certs/*.pem
chmod 600 deploy/nginx/certs/privkey.pem
```
7. Set real domain in `deploy/nginx/complaints-proxy-ssl.conf`:
```nginx
server_name complaints-api.your-domain.com;
```
8. Start stack with SSL:
```bash
docker compose -f docker-compose.yml -f docker-compose.proxy.yml -f docker-compose.proxy-ssl.yml up -d --build
```
9. Verify:
```bash
curl -I https://complaints-api.your-domain.com/health
curl https://complaints-api.your-domain.com/complaints_m/api/health
```

Certificate renewal:
```bash
sudo certbot renew --dry-run
```

## 9) Healthcheck verification
Local host checks:
```bash
curl http://127.0.0.1:3018/health
curl http://127.0.0.1:3018/complaints_m/api/health
```

Expected: JSON with `"ok": true`.

If reverse proxy is configured:
```bash
curl https://complaints-api.doorsvip.ru/complaints_m/api/health
```

## 10) Values to replace for new VPS
Before production cutover, replace/update:
- Domain names (API/public domain).
- Server IP and DNS A/AAAA records.
- Absolute filesystem paths in deployment scripts/configs.
- SSL certificates/paths (Let's Encrypt or custom certs).
- Reverse proxy upstream target (host/port/path mapping for `/complaints_m/api/*`).
- Database credentials and host (`POSTGRES_*`).
- Redis credentials/host if used by current `.env`.
- Nextcloud endpoints/credentials if used (`NEXTCLOUD_*`).

## Operational notes
- Do not expose `.env` and decrypted DB dump in repository.
- After restore, run smoke checks manually through app login/critical flows.
- Keep `_server_audit/*` as migration trace for rollback/forensics.
