# Alpha Focus — Main Page Redesign Blueprint

## 1) Primary Goal at Login
Create a premium, data-rich home experience where the user instantly sees:
- their current grooming status,
- what to do next,
- why it matters,
- and how Alpha Focus helps improve outcomes.

---

## 2) Critical User Data to Show Above the Fold
These should be visible in the first screen without scrolling.

### Identity & Session
- User name + greeting (time-aware)
- Last login date/time
- Profile completion percentage
- Preferred language + location status

### Progress & Performance
- Consistency score (habit score)
- Current streak days
- Weekly completion rate
- Last scan confidence / latest report status
- Improvement window estimate (e.g., 4–8 weeks)

### Rewards & Credits
- Current credit balance (wallet)
- Lifetime earned credits
- Active discount code (if available)
- Discount expiry timer
- “Redeem now” CTA

### Next Best Action (single primary CTA)
- Dynamic CTA based on missing or stale data:
  - “Run Photo Analyzer” (if no recent scan)
  - “Update Assessment” (if answers outdated)
  - “Continue Today’s Routine” (if routine incomplete)

---

## 3) Informational Banner System (Professional + Actionable)
Use 2–3 smart banners, each with one CTA.

### Banner A — Analyzer Promotion
- Title: “Your face scan is overdue”
- Data shown: days since last scan, expected benefit of fresh scan
- CTA: “Run Photo Analyzer”

### Banner B — Category Questions Promotion
- Title: “Complete your profile for sharper recommendations”
- Data shown: answered categories vs total categories
- CTA: “Answer Category Questions”

### Banner C — Lifestyle Improvement Motivation
- Title: “Small daily changes create visible grooming gains”
- Data shown: sleep/hydration/stress trend summary
- CTA: “View Lifestyle Plan”

---

## 4) Premium Dashboard Sections (Recommended Layout)

### Section 1: Executive Snapshot (top)
Cards:
- Grooming Readiness Score
- Consistency/Streak
- Credits & Active Discount
- Environment Risk (UV / AQI quick indicator)

### Section 2: AI Action Center
- Primary recommendation from latest report
- 3 prioritized tasks for today
- Estimated time to complete (e.g., 8 min)

### Section 3: Analyzer + Assessment Accelerator
- Prominent analyzer card with confidence examples
- Category question progress grid
- “Complete missing categories” quick links

### Section 4: Progress & Comparison
- Before/after timeline (last 3 scans)
- Week-over-week score trend
- Issue severity trend (acne/wrinkles/etc.)

### Section 5: Rewards Economy
- Credit earning opportunities today
- Redeemable tiers (bronze/silver/gold)
- Progress-to-next-reward bar

### Section 6: Premium Learning & Lifestyle
- Curated micro-guides based on user issues
- “Why this matters” educational cards
- Habit change tips tied to user’s weak areas

---

## 5) Key Data Sources Already in Your App
(Reuse these to avoid duplicate systems)
- `oneman_user_name`, `oneman_last_login`
- `assessment_answers_v1`
- `analyzerAnswers`, `analyzerSeverities`
- `photoAnalysis`, `galaxyAnalysis`
- rewards wallet from `rewardsStore`
- activity/streak from `oneman_activity`, `oneman_streak`
- settings from `oneman_preferences`, language/location keys

---

## 6) Premium UX Standards for This Page
- One primary CTA per section (avoid action overload)
- Immediate value in first 3 seconds (no empty placeholders)
- Strong visual hierarchy: status → insight → action
- Every metric must answer “what should user do next?”
- Keep all cards personalized with real user data

---

## 7) Recommended KPI Metrics to Track After Redesign
- Home-to-analyzer click-through rate
- Home-to-assessment completion rate
- Daily active users with completed action center tasks
- Credits redeemed per active user
- 7-day retention change after redesign
- Average days between scans

---

## 8) Proposed Main Page Information Priority Order
1. Greeting + identity + quick status
2. Consistency score + streak + credits
3. Next best action banner
4. Analyzer promotion + category progress
5. Personalized routine and issue insights
6. Rewards and educational lifestyle modules

---

## 9) Suggested Premium Copy Snippets
- “Alpha Focus Premium Intelligence”
- “Your grooming system, powered by AI precision.”
- “Track. Improve. Upgrade your presence.”
- “Every day completed moves your score and confidence up.”

---

## 10) Implementation Suggestion (Phased)
- Phase 1: Above-the-fold snapshot + credits + next action banner
- Phase 2: Analyzer/category progress modules + trend cards
- Phase 3: Premium learning + lifestyle coaching + KPI instrumentation
