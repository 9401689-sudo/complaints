# Status Model And Filters

## Primary case status model

- Stored in `cases.case_status`.
- Active status values:
  - `created`
  - `sent`
  - `has_reply`

## Filter grouping in UI

- Case status filter options:
  - `created_group` (maps to items considered "created" stage)
  - `sent`
  - `has_reply`
- UI labels differ from storage values:
  - labels are user-facing text
  - mapping handled in frontend constants.

## Reminder badges vs status

- Missing institution/template markers are reminder badges, not primary status:
  - `НЕТ ОРГАНИЗАЦИИ`
  - `НЕТ ШАБЛОНА`
- Linked-case presence also appears as additional badge.
- Rule: reminder badges must not overwrite `case_status`.
