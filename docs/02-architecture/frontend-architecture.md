# Frontend Architecture

## Entry points

- `index.html` — layout skeleton (topbar, screens, workspace tabs, modals).
- `app.js` — main runtime orchestration.
- `api.js` — transport/auth wrapper for backend calls.
- `styles.css` — responsive styling and UI states.

## Runtime layers in `app.js`

- App state:
  - global `state` contains auth/session, list filters, workspace context, admin sections.
- Decision helpers (pure/semi-pure):
  - role/scope checks, visibility labels, date normalization, status badge derivation.
- Render layer:
  - `renderCases`, `renderInstitutions`, `renderTemplates`, workspace render blocks, admin render blocks.
- Action layer:
  - `load*`, `create*`, `save*`, `delete*`, `toggle*`, `open*` async handlers.
- Event wiring:
  - centralized in `bindEvents()`.
- Bootstrap:
  - `bootstrap()` restores auth session, binds events, loads baseline data.

## Auth and guest mode behavior

- Token storage key: `complaints_auth_token` in `localStorage`.
- Guest mode:
  - public directories are visible (read-only).
  - create/edit actions guarded by `requireAuthAction`.
- Auth mode:
  - UI sections and controls are opened based on `state.authUser.role`.

## Admin UI architecture

- Separate screen/state section:
  - `state.adminSection` (`users`, `private_institutions`, `private_templates`, `deleted`, `backups`).
- Admin panels rendered from same data stores as user sections plus dedicated admin datasets.

## Coupling/risk hotspots

- `app.js` is large monolith and carries mixed concerns (state + render + workflows + policy decisions).
- Any refactor should preserve:
  - auth guards
  - filtering semantics
  - submit workspace sequencing
  - admin operations mapping
