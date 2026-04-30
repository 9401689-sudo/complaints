# Branch And Commit Policy

## Branching

- Primary active branch: `multi-user`.
- Use short-lived task branches for bounded work blocks.

## Commit style

- One intent per commit.
- Message format:
  - `<area>: <change summary>`
  - examples:
    - `docs: fill api and infra handover sections`
    - `backend: fix auth role check for admin restore`

## Merge discipline

- Merge only after checklist from `08-quality/verification-checklists.md`.
- If change affects proxy/env/deploy assumptions, update docs in same PR.
