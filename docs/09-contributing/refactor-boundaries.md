# Refactor Boundaries

## Primary boundaries

- Do not alter auth transport/proxy assumptions during unrelated refactors.
- Do not mix UI redesign with domain logic refactor.
- Do not mix infra changes with frontend behavior changes in one stage.

## Safe seams (historically proven)

- Pure helper extraction (deterministic transformation logic).
- Filter/query derivation blocks.
- Policy/decision helper blocks with explicit inputs.

## High-risk seams

- Event wiring and render orchestration in `app.js`.
- Submit workflow sequencing and file movement steps.
- Cross-module auth/role gating behavior.

## Rule

- If a seam starts dragging orchestration tail, stop and split stage.
