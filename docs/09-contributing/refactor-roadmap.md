# Refactor Roadmap (Post-Documentation)

## Goal

Снизить риск изменений в монолитном `app.js` и повысить предсказуемость доработок без регрессий в auth/workspace/admin потоках.

## Stage 0 — Baseline lock (required)

- Freeze behavior with explicit verification baseline:
  - auth (guest/login/logout/me)
  - cases list/open/create
  - workspace tabs (variables/text/files/submit/result)
  - admin panels (users/deleted/backups)
- Pin minimal smoke checklist from `08-quality/*`.

Exit criteria:

- Team agrees on non-regression checklist and runs it before each bounded refactor stage.

## Stage 1 — API/UI contract stabilization

Scope:

- Normalize frontend-side API wrapper usage patterns in `api.js` (no behavior change).
- Document and enforce stable error handling conventions in `app.js` handlers.

Why now:

- Reduces transport/debug ambiguity before splitting large UI modules.

Risks:

- Accidental change to auth header/path behavior.

Verification:

- health/auth/cases smoke + browser login flow.

## Stage 2 — `app.js` structural decomposition (safe utility seams first)

Scope:

- Move pure helpers into dedicated frontend modules:
  - date normalization/masking
  - role/scope labels
  - status badges/labels
  - preview mime decisions

Keep in `app.js`:

- event wiring
- render orchestration
- async workflows

Risks:

- Import path errors, subtle formatting regressions.

Verification:

- syntax checks + key UI smoke.

## Stage 3 — Render model extraction (bounded, no workflow rewrite)

Scope:

- Extract list render model derivation:
  - cases filter/query/status/scope derivation
  - institutions/templates visibility/favorites derivation
- Keep DOM patching in `app.js` for this stage.

Risks:

- Semantic drift in filter logic (`created_group`, favorites, admin user filters).

Verification:

- fixture-like checks for derivation helpers
- manual comparison of list outputs in user/admin modes.

## Stage 4 — Admin seam split

Scope:

- Isolate admin panel state/actions into dedicated module(s):
  - users role changes/delete
  - deleted restore/purge
  - backups list/create/restore/delete

Keep centralized:

- top-level screen navigation orchestration.

Risks:

- Role gate mistakes (`admin_view` vs `admin_full`).

Verification:

- admin role matrix smoke for both admin roles.

## Stage 5 — Workspace orchestration hardening

Scope:

- Split workspace by tab responsibilities:
  - variables/text/files/submit/result action groups
- Preserve existing sequence and side effects.

Risks:

- Breaking submit preparation chain and file movement semantics.

Verification:

- end-to-end case lifecycle smoke with uploads and submit preparation.

## Stage 6 — Backend consistency cleanup

Scope:

- Align FSM model artifacts (service vs extra type/config layers) into one clear runtime contract.
- Separate SQL baseline vs incremental migrations.

Risks:

- Stateful transition regressions.

Verification:

- route-level smoke for files/text/package/submit and restore paths
- backup restore + Redis cleanup checks.

## Prioritization summary

1. Stage 0
2. Stage 1
3. Stage 2
4. Stage 3
5. Stage 4
6. Stage 5
7. Stage 6

## Non-goals during refactor program

- UI redesign.
- Infra migrations unrelated to immediate bug/risk.
- Feature expansion mixed into structural stages.
