# Verification Checklists

## Before merge

- [ ] `npm run build` succeeds.
- [ ] Backend container starts with current `.env`.
- [ ] `GET /health` and `GET /<base>/health` return `ok: true`.
- [ ] Auth flow checked (login + `/auth/me`).
- [ ] Cases list and case open/create path verified.
- [ ] Public institutions/templates still visible for guest.
- [ ] Admin panels open for admin roles only.

## Before production deploy

- [ ] Reverse proxy target matches `complaints-backend-m:3018`.
- [ ] `docker compose ps` healthy.
- [ ] External API health endpoint responds.
- [ ] Backup list/create operation verified for admin.
