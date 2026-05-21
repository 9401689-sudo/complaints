# Database Backup Report

Date: 2026-05-21 15:13:36 +03:00

## Database detection
- Checked: `docker-compose.yml`, `.env`
- Result: PostgreSQL configuration detected (`POSTGRES_*` keys present).
- MySQL/MariaDB keys were not used for active backup path.

## Backup method
- Dump executed on server host via SSH in project path `/var/www/complaints-backend/complaints_m`.
- Used temporary PostgreSQL client container (`postgres:16-alpine`) with `pg_dump` over Docker network `n8n_default`.
- Created SQL dump, compressed to `.sql.gz`, encrypted with symmetric GPG, then removed raw `.sql.gz`.

## Encrypted artifacts
- `complaints_m_20260521_121527.sql.gz.gpg`

## Secret handling
- No passwords or secret values are included in this report.
- Raw SQL and raw compressed dump were removed after encryption.
- Repository now keeps encrypted dump artifact(s) only.

## Verification performed
- Confirmed encrypted dump file exists in `deploy/db`.
- Confirmed no new `.sql` or `.sql.gz` files remain in `deploy/db` after cleanup.
