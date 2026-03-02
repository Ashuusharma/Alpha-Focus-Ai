# High-Impact Ideas — Execution TODOs

## 1) Progression Economy Tuning
- [ ] Add daily first-action XP bonus (+25 once/day per user)
- [ ] Add streak milestone multipliers (7d, 14d, 30d)
- [ ] Add inactivity reactivation bonus after 3+ idle days
- [ ] Add XP reason analytics bucket (`earn_source`) for tuning

## 2) Achievement System Expansion
- [ ] Convert one-shot achievements into Bronze/Silver/Gold tiers
- [ ] Add hidden “surprise” achievements with reveal conditions
- [ ] Add achievement metadata schema (`id`, `title`, `tier`, `unlockedAt`)
- [ ] Add achievement filter chips on profile page

## 3) Retention Loops (Weekly Missions)
- [x] Create `weeklyMissions` state model with claim lifecycle
- [x] Add dashboard card with progress bars and claim CTA
- [x] Add mission reset cadence (weekly boundary)
- [x] Add cooldown + anti-double-claim guard

## 4) Report Intelligence Upgrade
- [ ] Add protocol adherence score (0–100) on result page
- [ ] Add risk flags when confidence worsens over reassessments
- [ ] Add trend deltas vs previous report (`improved/stable/declined`)
- [ ] Add “next best action” derived from adherence + risk

## 5) Database-Ready Service Layer
- [ ] Create `GamificationService` interface (read/write methods)
- [ ] Implement current LocalStorage adapter behind interface
- [ ] Keep UI/store calls routed through service facade only
- [ ] Prepare migration contract for future backend sync

## 6) UX Polish for Gamification
- [x] Add achievement history timeline on profile page
- [ ] Add compact streak heatmap (last 30 days)
- [ ] Add badge visuals for level title tiers
- [x] Add accessible toast copy variants for unlock events

## 7) Concierge Mode (Premium AI)
- [ ] Add weekly AI briefing card (Top 3 actions + confidence rationale)
- [ ] Add "Expected visible change" window per action (e.g., 7–14 days)
- [ ] Add adherence-aware tone (recovery mode vs optimization mode)
- [ ] Add one-tap "Apply this week plan" CTA to prefill routines

## 8) Clinical Confidence Timeline
- [ ] Add confidence trend chart across reports (last 6 checkpoints)
- [ ] Add explainability chips: why confidence rose/dropped
- [ ] Add source weighting panel (assessment vs photo vs activity)
- [ ] Add warning state when confidence drops 2 cycles in a row

## 9) Precision Personalization Engine
- [ ] Add sensitivity mode profiles (barrier-first, acne-active, pigment-focus)
- [ ] Add climate adaptation layer (hot/humid vs dry/cold protocol variants)
- [ ] Add ingredient conflict guardrails (retinoid + strong acids frequency limits)
- [ ] Add dynamic routine intensity slider (Minimal / Standard / Aggressive)

## 10) Premium Retention & Revenue
- [ ] Add mission-linked bundles (complete mission → unlock curated bundle)
- [ ] Add smart cart nudges with protocol-fit score
- [ ] Add tier perks (priority AI refresh, exclusive protocols, bonus multipliers)
- [ ] Add win-back journey for inactive users (3/7/14 day campaigns)

## 11) Executive Reporting & Export
- [ ] Generate doctor-style PDF report (clinical sections + mission progress)
- [ ] Add before/after comparison sheets with timestamps and confidence delta
- [ ] Add share-safe mode (hide sensitive fields, keep summary only)
- [ ] Add monthly premium digest export (progress + recommendations)

## 12) Compliance & Trust Layer
- [ ] Add medical disclaimer blocks by severity and symptom class
- [ ] Add escalation rules for urgent symptom patterns
- [ ] Add data provenance labels for each recommendation
- [ ] Add user-facing privacy center (data used, retention, delete/export)
