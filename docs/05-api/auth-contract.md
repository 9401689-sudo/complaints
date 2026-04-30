# Auth Contract

## Endpoints

- `POST /auth/register`
  - body: `{ nickname, password }`
  - success: `{ ok: true, user, token }`
- `POST /auth/login`
  - body: `{ nickname, password }`
  - success: `{ ok: true, user, token }`
- `GET /auth/me`
  - requires token
  - success: `{ ok: true, user }`
- `POST /auth/logout`
  - token optional (revokes when provided)

## Admin user management

- `GET /auth/users` (`admin_view` / `admin_full`)
- `PATCH /auth/users/:id/role` (`admin_full`)
- `DELETE /auth/users/:id` (`admin_full`)

## Roles

- `user` — regular authenticated user.
- `admin_view` — admin read access.
- `admin_full` — full admin actions (role changes, purge, backup mutate, restore/delete operations).

## Session model

- Sessions stored in `user_sessions`.
- Token hashed with SHA-256 (`token_hash`), raw token returned only once to client.
- Session TTL: 30 days.
