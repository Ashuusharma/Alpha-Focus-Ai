# Alpha Focus AI — Start Here

Use this file as the quickest orientation point for developers.

## 1) Run the project
- Install: `npm install`
- Asset preflight: `npm run check:assets`
- Dev server: `npm run dev`
- Lint: `npm run lint`

## 2) Core application flow
1. `app/page.tsx` — Landing and entry actions
2. `app/image-analyzer/page.tsx` — Photo capture + analysis kickoff
3. `app/image-analyzer/analyzer-questions/page.tsx` — Follow-up questionnaire
4. `app/result/page.tsx` — AI output, routine, products, and progression UX
5. `app/tracking/page.tsx` + `app/reports/weekly/page.tsx` — Lifestyle logs and report layer

## 3) Folder workflow map
- Full architecture map: [docs/WORKFLOW_MAP.md](docs/WORKFLOW_MAP.md)
- Documentation index: [docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)

## 4) Runtime folders
- `app/` — Routes, pages, API endpoints
- `components/` — Shared dashboard components used by app routes
- `src/components/` — New modular phase components (tracking, reports, climate, notifications)
- `lib/` — Domain logic, engines, stores, user-scoped persistence
- `public/` — Static assets, PWA manifest/icons, service worker

## 5) API surface (App Router)
- `app/api/logs/*` — Sleep/Hydration/Mood logs
- `app/api/reports/weekly` — Weekly report persistence
- `app/api/scans/history` — Scan history persistence
- `app/api/user/sync` — User state synchronization

## 6) Collaboration flow
- Branch strategy and contribution standards: [CONTRIBUTING.md](CONTRIBUTING.md)
- PR checklist/template: [.github/pull_request_template.md](.github/pull_request_template.md)
