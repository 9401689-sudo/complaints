# Runbook Server

## Working directory

- `/var/www/complaints-backend/complaints_m`

## Deploy/update

```bash
git fetch origin
git checkout multi-user
git pull --ff-only origin multi-user
docker compose up -d --build
```

## Mandatory checks

- `docker compose ps`
- `docker logs --tail=200 complaints-backend-m`
- `curl http://127.0.0.1:3018/health`
- `curl http://127.0.0.1:3018/complaints_m/api/health`

## If auth transport fails in browser

1. Check public health:
   - `curl https://complaints-api.doorsvip.ru/complaints_m/api/health`
2. Check proxy upstream mapping to `complaints-backend-m:3018`.
3. Check container network reachability from proxy container.
