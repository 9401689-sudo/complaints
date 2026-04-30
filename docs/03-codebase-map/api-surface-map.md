# API Surface Map

| Domain | Method | Path | Auth | Handler module |
|---|---|---|---|---|
| health | GET | `/health` | public | `src/index.ts` |
| health | GET | `/<base>/health` | public | `src/index.ts` |
| health | GET | `/<base>/health/db` | public | `src/index.ts` + `db/postgres.health.ts` |
| auth | POST | `/<base>/auth/register` | public | `auth/auth.routes.ts` |
| auth | POST | `/<base>/auth/login` | public | `auth/auth.routes.ts` |
| auth | GET | `/<base>/auth/me` | token | `auth/auth.routes.ts` |
| auth | POST | `/<base>/auth/logout` | token | `auth/auth.routes.ts` |
| auth admin | GET | `/<base>/auth/users` | `admin_view+` | `auth/auth.routes.ts` |
| auth admin | PATCH | `/<base>/auth/users/:id/role` | `admin_full` | `auth/auth.routes.ts` |
| auth admin | DELETE | `/<base>/auth/users/:id` | `admin_full` | `auth/auth.routes.ts` |
| admin deleted | POST | `/<base>/admin/purge-deleted` | `admin_full` | `auth/auth.routes.ts` |
| admin deleted | GET | `/<base>/admin/deleted` | `admin_view+` | `auth/auth.routes.ts` |
| admin restore | POST | `/<base>/admin/deleted/*/:id/restore` | `admin_full` | `auth/auth.routes.ts` |
| admin backups | GET/POST/DELETE | `/<base>/admin/backups*` | see role matrix | `auth/auth.routes.ts` + `admin/admin-backups.service.ts` |
| cases | GET/POST | `/<base>/cases` | token | `cases/cases.routes.ts` |
| cases | GET/PATCH/DELETE | `/<base>/cases/:id` (+ meta/config subroutes) | token | `cases/cases.routes.ts`, `case-config/case-config.routes.ts` |
| cases workspace | POST | `/<base>/cases/:id/generate-text|save-as-template|build-package|submit-prepare` | token | `cases/cases.routes.ts` |
| files | POST/PATCH | `/<base>/cases/:id/sync-files|files` | token | `files/files.routes.ts` |
| files upload | POST | `/<base>/cases/:id/files/upload` | token | `files/files.routes.ts` |
| files result | GET/POST | `/<base>/cases/:id/result-files*` | token | `files/files.routes.ts` |
| files content | GET | `/<base>/cases/:id/files/:fileId/preview|download` | token or query token | `files/files.routes.ts` |
| institutions | GET | `/<base>/institutions*` | public for GET | `institutions/institutions.routes.ts` |
| institutions | POST/PATCH/DELETE | `/<base>/institutions*` | token | `institutions/institutions.routes.ts` |
| institutions favorites | POST/DELETE | `/<base>/institutions/:id/favorite` | token | `institutions/institutions.routes.ts` |
| templates | GET | `/<base>/templates*` | public for GET | `templates/templates.routes.ts` |
| templates | POST/PATCH/DELETE | `/<base>/templates*` | token | `templates/templates.routes.ts` |
| templates favorites | POST/DELETE | `/<base>/templates/:id/favorite` | token | `templates/templates.routes.ts` |
| variables | GET/PUT | `/<base>/cases/:id/variables` | token | `variables/variables.routes.ts` |
| text | GET/PUT | `/<base>/cases/:id/text` | token | `text/text.routes.ts` |
| package | GET | `/<base>/cases/:id/package` | token | `package/package.routes.ts` |
