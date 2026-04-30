# State And FSM

## Frontend state (single global object)

Primary groups in `app.js`:

- Auth/session:
  - `authUser`, token-dependent UI state
- Navigation:
  - `currentScreen`, `currentWorkspaceTab`, admin section
- Collections:
  - `cases`, `institutions`, `templates`, admin datasets
- Filters:
  - cases search/institution/status
  - category and user filters in admin sections
- Workspace:
  - `currentCaseId`, `currentCase`, files, variables, text, submit data, result files

## Backend FSM runtime

- Implemented by `src/modules/fsm/fsm.service.ts`.
- Stored in Redis per case key.
- Snapshot includes:
  - state string
  - context (file counts, selected IDs, institution/template, text/package readiness, errors)

## FSM usage pattern

- Case/files/text/config/package services update FSM via:
  - `saveSnapshot`
  - `syncWorkingState`
  - `transition`
- UI reads FSM through case payloads and derives available actions/status displays.

## Practical note

- There are multiple FSM-related files (`fsm.types.ts`, `fsm.config.ts`) that represent a broader model.
- Active runtime behavior currently follows `fsm.service.ts` state vocabulary in live service calls.
