# Commands used for server copy and comparison

## 1) Create temp copy directory (outside git)

```bash
wsl bash -lc 'rm -rf /tmp/server-copy-Complaints_m; mkdir -p /tmp/server-copy-Complaints_m'
```

## 2) Copy project from server via rsync (successful command)

```bash
wsl bash -lc 'rsync -avz --delete \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude "vendor" \
  --exclude "dist" \
  --exclude "build" \
  --exclude ".next" \
  --exclude "cache" \
  --exclude "tmp" \
  -e "ssh -i ~/.ssh/id_ed25519_complaints -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
  root@109.196.165.84:/var/www/complaints-backend/complaints_m/ \
  /tmp/server-copy-Complaints_m/'
```

Notes:
- `.env*`, `docker-compose*.yml`, runtime dirs (e.g. `backups`) were **not excluded**.
- `.git`, `node_modules`, `vendor`, `dist`, `build`, `.next`, `cache`, `tmp` were excluded as requested.

## 3) Repository and diff checks

```bash
git status --short
```

```bash
wsl bash -lc 'diff -ruN \
  --exclude .git \
  --exclude node_modules \
  --exclude vendor \
  --exclude dist \
  --exclude build \
  --exclude .next \
  --exclude cache \
  --exclude tmp \
  --exclude .vscode \
  "/mnt/c/1_Work/Работа/Сайты/Complaints_m" \
  "/tmp/server-copy-Complaints_m" \
  > "/mnt/c/1_Work/Работа/Сайты/Complaints_m/_server_audit/server_vs_local.diff" || true'
```

```bash
wsl bash -lc 'diff -rq \
  --exclude .git \
  --exclude node_modules \
  --exclude vendor \
  --exclude dist \
  --exclude build \
  --exclude .next \
  --exclude cache \
  --exclude tmp \
  --exclude .vscode \
  "/mnt/c/1_Work/Работа/Сайты/Complaints_m" \
  "/tmp/server-copy-Complaints_m" \
  > "/mnt/c/1_Work/Работа/Сайты/Complaints_m/_server_audit/server_vs_local_brief.txt" || true'
```
