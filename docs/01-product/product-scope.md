# Product Scope

## In Scope (current implementation)

- Guest access to public directories (institutions/templates) in read-only mode.
- User authentication by nickname/password.
- Role-based admin capabilities (`admin_view`, `admin_full`).
- Case workspace:
  - metadata
  - variables
  - text drafting
  - file selection/upload
  - submit preparation
  - result file upload/comment
- Directory management:
  - public/private visibility
  - personal and shared entities
  - favorites for templates and institutions
- Soft-delete workflow:
  - mark as deleted
  - admin restore
  - admin purge of deleted records
- Backup operations from admin UI:
  - list/create/restore/delete DB backups

## Out Of Scope (as of current codebase)

- External identity providers / OAuth.
- Multi-tenant isolation by separate DB/schema per customer.
- Background job queue/worker architecture.
- Full automated test suite with integration/e2e coverage.
- Strongly modularized frontend (currently monolithic `app.js`).

## Business/technical constraints

- Correct reverse-proxy path mapping is mandatory (`/<prefix>/api`).
- Nextcloud integration is hard dependency for file-centric workflows.
- FSM state is cache-backed in Redis and can diverge if operational procedures are broken.
