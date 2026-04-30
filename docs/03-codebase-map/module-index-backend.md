# Module Index Backend

| Модуль | Файлы | Назначение | Основные зависимости |
|---|---|---|---|
| app bootstrap | `src/index.ts` | запуск Fastify, auth gate, регистрация роутов | all route modules, `env`, redis |
| auth | `src/modules/auth/*` | регистрация, логин, сессии, роли, admin auth checks | postgres |
| admin backups | `src/modules/admin/admin-backups.service.ts` | list/create/restore/delete DB backups | `pg_dump`, `psql`, redis, fs |
| cases | `src/modules/cases/*` | жизненный цикл обращения, ownership, status, delete/restore/purge | postgres, fsm, nextcloud |
| files | `src/modules/files/*` | sync/upload/preview/download файлов | postgres, cases, fsm, nextcloud |
| institutions | `src/modules/institutions/*` | CRUD организаций, visibility/owner/favorites | postgres |
| templates | `src/modules/templates/*` | CRUD шаблонов, visibility/owner/favorites | postgres |
| variables | `src/modules/variables/*` | чтение/запись переменных обращения | postgres, cases, fsm |
| text | `src/modules/text/*` | чтение/сохранение complaint text | cases, fsm, nextcloud, postgres |
| case-config | `src/modules/case-config/*` | смена institution/template у кейса | postgres, cases, fsm, nextcloud |
| package | `src/modules/package/*` | чтение сформированного submission package | cases, nextcloud |
| fsm | `src/modules/fsm/*` | Redis snapshot machine | redis |
| nextcloud | `src/modules/nextcloud/*` | DAV operations abstraction | env + fetch |
| db | `src/modules/db/*` | postgres pool + health check | pg |
| redis | `src/modules/redis/*` | redis client init | ioredis |
