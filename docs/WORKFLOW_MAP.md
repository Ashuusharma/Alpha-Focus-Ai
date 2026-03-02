# Code Workflow Map

This file explains how request/data flow moves through the codebase.

## Top-Level Responsibilities
- `app/` — Next.js App Router pages + API routes.
- `components/` — Shared UI building blocks used by route pages.
- `src/components/` — Modular feature components (tracking/reports/climate/ui).
- `lib/` — Domain logic, stores, AI utilities, persistence helpers.
- `public/` — Icons, images, PWA files, service worker.
- `docs/` — Architecture, implementation notes, planning and testing references.

## Request Flow (UI)
1. Route entry in `app/**/page.tsx`
2. Feature components from `components/` or `src/components/`
3. Domain/business logic from `lib/*` and `src/utils/*`
4. Persist to local/session storage via `lib/userScopedStorage.ts` and route-specific keys
5. Optional backend persistence through `app/api/*` endpoints

## Request Flow (API)
1. API handlers in `app/api/**/route.ts`
2. Data access through `lib/server/jsonDb.ts`
3. Shared record models in `lib/server/types.ts`
4. JSON collections written under `.data/*` at runtime

## Primary Feature Areas
- `app/image-analyzer/*` + `lib/analyzeImage.ts` — Photo analysis flow
- `app/result/*` — Recommendations, routines, summaries
- `app/tracking/*` + `src/components/tracking/*` — Lifestyle trackers
- `app/reports/weekly/*` + `src/utils/weeklyReportEngine.ts` — Weekly summaries
- `app/challenges/*` + `lib/challengeEngine.ts` — Habit challenge system
- `app/upgrade/*` — Premium upsell flow

## Data and Persistence
- Client-side: localStorage/sessionStorage (scoped helpers in `lib/userScopedStorage.ts`)
- Server-side: `app/api/logs/*`, `app/api/reports/weekly`, `app/api/scans/history`
- PWA: `public/manifest.webmanifest`, `public/service-worker.js`, icon files in `public/icons/`

## Safe Extension Rules
- Add new screens under `app/<feature>/page.tsx`
- Keep reusable UI in `components/` or `src/components/`
- Keep logic in `lib/` or `src/utils/` (avoid page-level heavy logic)
- Add API handlers in `app/api/<domain>/<action>/route.ts`
- Update docs in `docs/DOCUMENTATION_INDEX.md` when adding major modules
