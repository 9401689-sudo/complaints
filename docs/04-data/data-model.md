# Data Model

## Core entities

- User
- Session
- Case
- Institution
- Template
- CaseVariable
- CaseFile
- CaseArtifact
- CaseLog
- InstitutionFavorite
- TemplateFavorite

## Ownership and visibility

- `cases.owner_user_id` — владелец обращения.
- `institutions.owner_user_id`, `templates.owner_user_id` — владелец справочника (для private сущностей).
- `visibility` (`public` / `private`) на `institutions` и `templates`.

## Soft-delete model

- Soft-delete поля:
  - `cases.deleted_at`, `cases.deleted_by_user_id`
  - `institutions.deleted_at`, `institutions.deleted_by_user_id`
  - `templates.deleted_at`, `templates.deleted_by_user_id`
- Админский restore и финальный purge реализованы отдельными endpoint-ами.

## Case lifecycle data

- `case_status` используется как основной статус обращения (`created`, `sent`, `has_reply`).
- `submission_number`, `submitted_at`, `registration_date`, `response_comment` хранят этапы обработки.
- Nextcloud paths сохраняются в case:
  - `nextcloud_case_folder`
  - `nextcloud_incoming_folder`
  - `nextcloud_artifacts_folder`
  - `nextcloud_result_folder`
