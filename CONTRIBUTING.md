# Contributing Guide

## Branch strategy
- `main`: production-ready code only.
- `dev`: integration branch for ongoing work.
- `feature/<short-name>`: feature branches opened from `dev`.
- `fix/<short-name>`: bugfix branches opened from `dev`.

## Workflow
1. Create branch from `dev`.
2. Keep changes focused and small.
3. Run checks locally:
   - `npm run lint`
   - `npm run check:assets`
4. Open PR to `dev` using the PR template.
5. Merge `dev` into `main` only after verification.

## Safety rules
- Do not force-push to `main`.
- Do not merge PRs with unresolved errors.
- Prefer incremental PRs over large batches.
