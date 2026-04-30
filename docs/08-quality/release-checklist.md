# Release Checklist

- [ ] Branch/tag selected and clean pull completed.
- [ ] `.env` validated (`PORT=3018`, `API_BASE_PATH=/complaints_m/api`, `BACKUP_DIR` set).
- [ ] `docker compose up -d --build` completed successfully.
- [ ] Container logs show healthy startup.
- [ ] Internal health checks pass (`127.0.0.1:3018`).
- [ ] External health endpoint passes (`complaints-api.doorsvip.ru/.../health`).
- [ ] Browser auth no longer shows transport errors.
- [ ] Guest directory visibility confirmed.
- [ ] Authenticated case create/open flow confirmed.
- [ ] Admin backup and deleted-record views confirmed.
