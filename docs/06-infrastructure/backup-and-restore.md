# Backup And Restore

## Storage

- In container: `/app/backups` (`BACKUP_DIR`).
- Backed by Docker volume: `complaints_m_backups`.

## Implementation

- Service: `src/modules/admin/admin-backups.service.ts`.
- Create:
  - runs `pg_dump` with schema and clean flags.
- Restore:
  - runs `psql --file <backup>`.
  - clears Redis FSM keys after restore.
- Delete:
  - removes selected backup file.

## Retention

- `MAX_BACKUPS = 3`.
- After new backup creation, older backups are pruned.

## API controls

- `GET /admin/backups`
- `POST /admin/backups`
- `POST /admin/backups/restore`
- `DELETE /admin/backups`

## Notes

- Restore is destructive for current DB state and should be operator-confirmed.
- Ensure `pg_dump` and `psql` are available in runtime environment.
