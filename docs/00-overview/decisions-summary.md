# Decisions Summary

## Active decisions (as implemented)

- Multi-user contour is isolated in `Complaints_m` with dedicated container and port `3018`.
- Frontend remains framework-free monolith (`app.js`) for now; refactor is staged separately.
- Auth model is token-based with server-side hashed sessions.
- Public read access is allowed for institutions/templates; mutating operations require auth.
- Soft-delete + restore + purge model is used instead of immediate hard delete.
- Backup lifecycle is exposed through admin API and capped to 3 retained backups.
- Nextcloud WebDAV is primary file/artifact store for case workflows.
