# Migrations And SQL

## Current state

- Primary SQL file: `sql/001_init_mvp.sql`.
- File contains both base DDL and additive `alter table if not exists` style evolutions.
- Explicit migration chain files are not yet separated into numbered incremental steps.

## Practical policy for current repo

- Treat `sql/001_init_mvp.sql` as authoritative bootstrap + compatibility script.
- For future changes, strongly recommended:
  - introduce dedicated migration files (`002_...`, `003_...`)
  - keep `001` as baseline only
  - avoid mixing historical and new patches in one giant file.

## Rollback strategy (current)

- No formal down-migrations in repo.
- Operational rollback currently depends on:
  - backup/restore flow (`adminBackupsService`)
  - git rollback + DB restore.
