# Docker And Compose

## Current compose (root)

- Project name: `complaints_m`
- Service: `complaints-backend`
- Container name: `complaints-backend-m`
- Port binding: `127.0.0.1:3018:3018`
- Volume: `complaints_m_backups:/app/backups`
- Networks: `proxy`, `n8n_default` (external)

## Baseline commands

```bash
docker compose up -d --build
docker compose ps
docker logs --tail=200 complaints-backend-m
```

## Health checks

```bash
curl http://127.0.0.1:3018/health
curl http://127.0.0.1:3018/complaints_m/api/health
```
