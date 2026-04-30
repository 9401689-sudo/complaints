# Test Strategy

## Current reality

- No formal committed test framework suite is used as primary gate in this repo snapshot.
- Quality relies on:
  - service-level reasoning
  - endpoint smoke checks
  - manual critical path verification.

## Recommended verification layers

1. Transport smoke:
   - health + auth endpoints.
2. Domain smoke:
   - cases/files/directories flows.
3. Admin smoke:
   - users, deleted records, backups.
4. Regression checklist:
   - guest/auth/admin UI behavior.

## Future hardening direction

- Add minimal API integration tests around auth + cases + admin backups.
- Add targeted frontend interaction tests for critical workflows.
