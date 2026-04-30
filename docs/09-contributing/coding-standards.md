# Coding Standards

## General

- Keep behavior-preserving changes explicit and scoped.
- Prefer small bounded commits with clear intent.
- Do not mix unrelated cleanup into feature/bugfix commits.

## Frontend (`app.js` monolith)

- Keep extraction/refactor steps incremental and reversible.
- Preserve existing UI/workflow semantics unless task explicitly changes behavior.
- For new helpers, require explicit inputs and deterministic outputs where possible.

## Backend (`src/modules/*`)

- Follow route -> service -> infra pattern.
- Keep HTTP status mapping in routes; domain rules in services.
- Use typed payloads from `*.types.ts`.

## Operational safety

- Never commit secrets from `.env`.
- Document infra-sensitive changes (`API_BASE_PATH`, ports, proxy assumptions) in docs.
