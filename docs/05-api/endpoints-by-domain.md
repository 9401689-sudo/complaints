# Endpoints By Domain

## Health

- `GET /health`
- `GET /<base>/health`
- `GET /<base>/health/db`

## Auth

- `POST /<base>/auth/register`
- `POST /<base>/auth/login`
- `GET /<base>/auth/me`
- `POST /<base>/auth/logout`
- `GET /<base>/auth/users`
- `PATCH /<base>/auth/users/:id/role`
- `DELETE /<base>/auth/users/:id`

## Admin

- `POST /<base>/admin/purge-deleted`
- `GET /<base>/admin/deleted`
- `POST /<base>/admin/deleted/cases/:id/restore`
- `POST /<base>/admin/deleted/institutions/:id/restore`
- `POST /<base>/admin/deleted/templates/:id/restore`
- `GET /<base>/admin/backups`
- `POST /<base>/admin/backups`
- `POST /<base>/admin/backups/restore`
- `DELETE /<base>/admin/backups`

## Cases

- `GET /<base>/cases`
- `POST /<base>/cases`
- `GET /<base>/cases/:id`
- `PATCH /<base>/cases/:id/meta`
- `PATCH /<base>/cases/:id/config`
- `POST /<base>/cases/:id/generate-text`
- `POST /<base>/cases/:id/save-as-template`
- `POST /<base>/cases/:id/build-package`
- `POST /<base>/cases/:id/submit-prepare`
- `DELETE /<base>/cases/:id`
- `GET /<base>/cases/ping`

## Files / Result files

- `POST /<base>/cases/:id/sync-files`
- `PATCH /<base>/cases/:id/files`
- `POST /<base>/cases/:id/files/upload`
- `GET /<base>/cases/:id/files/:fileId/preview`
- `GET /<base>/cases/:id/files/:fileId/download`
- `GET /<base>/cases/:id/result-files`
- `POST /<base>/cases/:id/result-files/upload`
- `GET /<base>/files/ping`

## Institutions

- `GET /<base>/institutions`
- `GET /<base>/institutions/:id`
- `POST /<base>/institutions`
- `PATCH /<base>/institutions/:id`
- `DELETE /<base>/institutions/:id`
- `POST /<base>/institutions/:id/favorite`
- `DELETE /<base>/institutions/:id/favorite`

## Templates

- `GET /<base>/templates`
- `GET /<base>/templates/:id`
- `POST /<base>/templates`
- `PATCH /<base>/templates/:id`
- `DELETE /<base>/templates/:id`
- `POST /<base>/templates/:id/favorite`
- `DELETE /<base>/templates/:id/favorite`

## Variables / Text / Package

- `GET /<base>/cases/:id/variables`
- `PUT /<base>/cases/:id/variables`
- `GET /<base>/cases/:id/text`
- `PUT /<base>/cases/:id/text`
- `GET /<base>/cases/:id/package`
