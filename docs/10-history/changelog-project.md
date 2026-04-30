# Project Changelog

## 2026-04-30

- Executed bounded frontend refactor run for roadmap stages 0–2 (behavior-preserving):
  - Stage 0: added baseline verification entrypoint `npm run verify:baseline` (`scripts/verify-baseline.ps1`).
  - Stage 1: stabilized `api.js` transport helpers (URL/header/error composition deduplicated, contract preserved).
  - Stage 2: extracted safe utility seams from `app.js` into `frontend-utils/`:
    - `date-helpers.js`
    - `role-scope-helpers.js`
    - `constants.js`
    - `template-variable-helpers.js`
    - `preview-helpers.js`
    - `status-helpers.js`
    - `safe-modules-boundary.js` (single safe re-export boundary).
- Verified on current tree with `npm run verify:baseline` and syntax checks for extracted modules.
- No UI redesign, workflow rewrite, or backend behavior changes introduced in this run.

- Completed first full handover-oriented documentation pass for `Complaints_m`.
- Documented current source-of-truth boundaries to avoid confusion with duplicate trees.
- Captured active auth/admin/soft-delete/backup architecture from implemented code.
- Captured transport/proxy assumptions behind known `failed to fetch` incident class.

## Future entries format

- Date
- Change scope
- Behavior impact
- Required operational updates
