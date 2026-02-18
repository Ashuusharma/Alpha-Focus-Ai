# Alpha Focus — 10 Phase Implementation TODO

## Scope Rules
- Keep all new work under `src/` feature architecture for clean separation.
- Keep existing app flow stable and add bridge routes/buttons instead of destructive moves.
- Prefer replacing legacy usage gradually with `src/` modules (no mixed duplicate logic in same flow).

## Phase 1 — Foundation Refactor (Mandatory First)
- [x] Create `src/` feature architecture
  - [x] `src/components/dashboard`
  - [x] `src/components/tracking`
  - [x] `src/components/climate`
  - [x] `src/components/reports`
  - [x] `src/components/notifications`
  - [x] `src/components/ui`
  - [x] `src/pages`
  - [x] `src/hooks`
  - [x] `src/services`
  - [x] `src/utils`
  - [x] `src/context`
  - [x] `src/types`
- [x] Create global user context
  - [x] `src/context/UserContext.tsx`
  - [x] Profile state
  - [x] Permissions state
  - [x] Lifestyle state
  - [x] Backend sync helper

## Phase 2 — Climate Intelligence Engine
- [x] `src/hooks/useLocation.ts`
  - [x] Permission request
  - [x] Lat/lon fetch
  - [x] Graceful denied handling
- [x] `src/services/weatherService.ts`
  - [x] Humidity
  - [x] UV index
  - [x] Temperature
  - [x] AQI
  - [x] Cache for 6 hours
- [x] `src/utils/climateEngine.ts`
  - [x] Humidity > 75 rule
  - [x] AQI > 150 rule
  - [x] UV > 7 rule
  - [x] Structured recommendation object
- [x] `src/components/climate/EnvironmentCard.tsx`
  - [x] Humidity
  - [x] UV
  - [x] Pollution
  - [x] Auto-adjusted routine

## Phase 3 — Sleep, Hydration & Mood Tracking
- [x] `src/components/tracking/SleepTracker.tsx`
  - [x] Hours input
  - [x] Quality slider (1–5)
  - [x] Daily log persistence
- [x] `src/components/tracking/HydrationTracker.tsx`
  - [x] Water intake input
  - [x] Daily target (3000ml)
  - [x] Progress bar
  - [x] Daily log persistence
- [x] `src/components/tracking/MoodTracker.tsx`
  - [x] Calm / Neutral / Stressed
  - [x] Daily mood log

## Phase 4 — Correlation Engine
- [x] `src/utils/correlationEngine.ts`
  - [x] Sleep + stress inflammation rule
  - [x] Hydration dryness rule
  - [x] Risk adjustment output
- [x] Integrate into alpha score
  - [x] Updated `lib/calculateAlphaScore.ts` to support lifestyle/sleep/stress weighting

## Phase 5 — Scan Progress & Comparison Engine
- [ ] Backend `ScanHistory` schema and collection
- [x] `src/components/reports/ComparisonSlider.tsx`
  - [x] Before/after slider
  - [x] Score difference
  - [x] Improvement %
- [x] `src/utils/improvementEngine.ts`

## Phase 6 — Weekly AI Report Generator
- [x] `src/utils/weeklyReportEngine.ts`
  - [x] Avg sleep
  - [x] Avg hydration
  - [x] Mood pattern
  - [x] Compliance
  - [x] Score trend
  - [x] Strengths / risks / suggested focus
- [x] `src/components/reports/WeeklyReport.tsx`
  - [x] Summary UI
  - [x] Risk alerts
  - [x] Suggested focus
- [ ] Download PDF action

## Phase 7 — Smart Notification System
- [x] `public/service-worker.js`
  - [x] Push listener
  - [x] Background sync hook
- [x] `src/utils/notificationEngine.ts`
  - [x] High UV reminder
  - [x] Low sleep reminder
  - [x] Missed routine reminder

## Phase 8 — Permission & Privacy Dashboard
- [x] `app/data-settings/page.tsx` (App Router equivalent)
  - [x] Location toggle
  - [x] Sleep toggle
  - [x] Hydration toggle
  - [x] Mood toggle
  - [x] Delete-all-data action
- [x] Onboarding consent checkbox
  - [x] Updated login flow in `app/_components/LoginScreen.tsx`
  - [x] Consent flag persistence

## Phase 9 — Backend Schema Updates
- [ ] Update user schema
  - [ ] location block
  - [ ] sleep/hydration/mood/scan refs
  - [ ] xp/level
  - [ ] permissions
- [ ] Create collections
  - [ ] SleepLogs
  - [ ] HydrationLogs
  - [ ] MoodLogs
  - [ ] WeeklyReports
  - [ ] ScanHistory

## Phase 10 — Security & Trust Hardening
- [x] `app/privacy-policy/page.tsx`
  - [x] Data collected
  - [x] Why collected
  - [x] Storage/deletion policy
- [ ] Production security checks
  - [ ] HTTPS enforcement
  - [ ] JWT auth
  - [ ] bcrypt password hashing
  - [ ] env-based API keys

## Feature Priority Order
- [x] Location + Climate
- [x] Sleep + Hydration
- [x] Correlation Engine
- [x] Weekly Report
- [x] Notifications
- [x] Scan Comparison
- [ ] PDF Reports
- [ ] Wearable Integration

## Existing vs New Mapping
- Existing equivalent found: `lib/envService.ts` (climate fetch), `lib/calculateAlphaScore.ts` (alpha score)
- New clean modules now live under `src/` and can be adopted route-by-route
- Existing app router is used (`app/...`) instead of legacy pages router (`pages/...`) to avoid framework conflict
