# Schema Reference

Источник истины: `sql/001_init_mvp.sql` (project root, `Complaints_m`).

| Таблица | Назначение | Ключи | Важные поля |
|---|---|---|---|
| `users` | Учетные записи | `id` PK, `nickname` unique | `role`, `password_hash`, `created_at`, `updated_at` |
| `user_sessions` | Сессии токенов | `id` PK, `token_hash` unique | `user_id` FK, `expires_at`, `revoked_at`, `last_used_at` |
| `institutions` | Справочник организаций | `id` PK | `category`, `visibility`, `owner_user_id`, `submit_url`, limits, `deleted_at` |
| `templates` | Справочник шаблонов | `id` PK | `category`, `visibility`, `owner_user_id`, `institution_id`, `body_template`, `variables_schema`, `default_values`, `deleted_at` |
| `cases` | Обращения | `id` PK, `case_number` unique | `owner_user_id`, `parent_case_id`, `institution_id`, `template_id`, folders, `case_status`, meta fields, `deleted_at` |
| `case_variables` | Переменные обращения | unique `(case_id, var_key)` | `var_value` |
| `case_files` | Файлы обращения | `id` PK | path/name/mime/size, `selected_for_submission`, `sort_order` |
| `case_artifacts` | Артефакты | `id` PK | `artifact_type`, `file_path` |
| `case_logs` | Аудит действий | `id` PK | `action`, `payload_json` |
| `institution_favorites` | Избранные организации | PK `(user_id, institution_id)` | `created_at` |
| `template_favorites` | Избранные шаблоны | PK `(user_id, template_id)` | `created_at` |
