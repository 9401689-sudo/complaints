# Module Index Frontend

| Файл | Ответственность | Точки входа | Риски |
|---|---|---|---|
| `index.html` | Структура экранов/панелей/модалок, id для JS-binding | загрузка страницы | Несоответствие id ломает обработчики |
| `styles.css` | Визуальная система, responsive режим, классы состояний | загрузка страницы | Сильная связанность с DOM-структурой |
| `api.js` | HTTP transport, токен, endpoint wrappers, blob downloads/uploads | импорт из `app.js` | Ошибки в API base/headers дают transport fail |
| `app.js` | Глобальный state, render, workflow, event wiring, auth/admin UI | `bootstrap()` | Монолитный файл, высокая плотность связей |
| `dialog.png`/`favicon.svg` | Бренд-ассеты | HTML head/topbar | Низкий риск, но влияет на визуальную идентичность |

## `app.js` internal clusters (for maintenance)

- Auth/session cluster
- Context navigation cluster
- Cases list + filtering cluster
- Directory lists (institutions/templates) cluster
- Workspace cluster (variables/text/files/submit/result)
- Admin cluster (users/private dirs/deleted/backups)
- Utility/pure helper cluster
