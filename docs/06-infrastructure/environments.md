# Environments

## Runtime env keys (from current `.env`)

- App:
  - `PORT`
  - `BASE_PUBLIC_URL`
  - `API_BASE_PATH`
  - `BACKUP_DIR`
- PostgreSQL:
  - `POSTGRES_HOST`
  - `POSTGRES_PORT`
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_SSL`
- Redis:
  - `REDIS_HOST`
  - `REDIS_PORT`
  - `REDIS_DB`
  - `REDIS_PASSWORD`
- Nextcloud:
  - `NEXTCLOUD_BASE_URL`
  - `NEXTCLOUD_USERNAME`
  - `NEXTCLOUD_PASSWORD`
  - `NEXTCLOUD_ROOT_PATH`

## Notes

- Secret values must not be committed to git.
- Frontend API prefix must match `API_BASE_PATH` and reverse proxy location.
