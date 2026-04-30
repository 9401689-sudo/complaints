# System Context

## Назначение системы

Сервис поддерживает подготовку и сопровождение обращений:

- создание и ведение кейсов
- выбор организаций и шаблонов
- подготовка текста и пакета отправки
- загрузка ответов
- админ-операции по пользователям/удалению/backup

## Actors

- Guest (неавторизованный)
- User (авторизованный)
- Admin View
- Admin Full

## External systems

- Reverse proxy (маршрутизация публичного API пути)
- PostgreSQL (основные данные)
- Redis (FSM snapshots)
- Nextcloud WebDAV (файлы и артефакты кейсов)

## Internal contours

- Frontend: `index.html`, `app.js`, `api.js`, `styles.css`
- Backend: `src/**` + `sql/001_init_mvp.sql`
- Ops: `docker-compose.yml`, `scripts/deploy-complaints-m.*`
