# AI cost governance: metrics, budgets, caching, and reliability

Covers the cost/reliability layer added in Phase 5.8-5.9: `lib/ai/aiGovernanceConfig.ts`,
`lib/ai/aiUsageLog.ts`, `lib/ai/visionCache.ts`, `lib/ai/protocolGovernance.ts`'s cache
functions, and `GET /api/admin/ai-usage`. For OpenAI connection/model-access problems
(bad keys, missing model access, `sharp` issues), see `openai-troubleshooting.md` instead
— this doc is about spend, caching, and protocol reliability once the connection itself works.

## Reading `GET /api/admin/ai-usage`

Internal-only, gated behind `AI_ADMIN_SECRET` (send as `x-admin-secret` header or
`Authorization: Bearer <secret>`). Returns `{ok:false, error:"unauthorized"}` with a 401
if the secret is unset or wrong — **the dashboard is fully disabled until
`AI_ADMIN_SECRET` is set** in the environment. Not linked from any UI.

```bash
curl -s https://your-domain/api/admin/ai-usage -H "x-admin-secret: $AI_ADMIN_SECRET"
# optional: ?days=N (1-90, default 30) widens/narrows the query window
```

Key fields and what they mean:

| Field | Meaning |
|---|---|
| `todaysSpendUsd` / `monthlySpendUsd` | Real spend, summed from `ai_usage_log.estimated_cost_usd` for the current UTC day/month. Includes both Vision and Protocol, cached rows count as $0. |
| `averageVisionCostUsd` / `averageProtocolCostUsd` | Average cost of a **real, non-cached, successful** call for that feature. Cache hits and failures are excluded on purpose — this is "what does it cost when we actually call OpenAI." |
| `averageUserJourneyCostUsd` | `(total vision cost + total protocol cost) / successful protocol count` over the window. Blends in cache hits, so it's typically *lower* than `averageVisionCostUsd + averageProtocolCostUsd` — see the forecasting section below for why you usually want the uncached sum instead, not this field, when sizing a budget. |
| `cacheHitRatePct` / `cacheMissRatePct` | Across both Vision and Protocol combined, by request count, this window. |
| `cacheSavings` | Real (not estimated) `latencyMsSaved` / `tokensSaved` / `costUsdSaved`, summed from the `original_*` metrics stored alongside each cache entry at write time (see "How caching works" below). Zero for any cache entry written before `supabase/ai_governance_schema_v2.sql` was applied — those entries don't have `original_*` recorded, not an error. |
| `estimatedMonthlyProjectionUsd` | `(sum of estimated_cost_usd over the query window / days) * 30` — a smoothed 30-day projection from the window average, not just today's number scaled up. |
| `mostExpensiveRequests` / `mostExpensiveUsers` | Top 10 by cost, this window. Use to spot a single runaway user or an unusually large protocol generation before it becomes a trend. |
| `protocolSuccessRatePct` / `protocolFailureRatePct` | `success !== false` counts as success (rows written before schema_v2 have no `success` column and are treated as successes, since failures weren't logged at all before Phase 5.9). |
| `protocolTruncationCount` | Subset of failures whose `failure_reason` matches a known truncation marker (`"Unterminated string"`, `"Unexpected end of JSON"` — see `parseAssistantJson` in `ProtocolOrchestrator.ts`). Distinct from budget blocks, rate limits, or upstream API errors, which also count toward `protocolFailureRatePct` but not this field. |

## Understanding cache behavior

Two independent caches exist, both Postgres-backed with a graceful in-memory fallback if
Supabase env vars are missing:

- **Vision cache** (`lib/ai/visionCache.ts`, table `vision_analysis_cache`) — keyed on
  `(image set hash, category, vision model, prompt version)`. The image hash is
  order-independent (each image hashed individually, then the sorted set hashed together),
  so resubmitting the same photos in a different order still hits. Any different photo,
  category, model, or prompt version is a guaranteed miss.
- **Protocol cache** (`lib/ai/protocolGovernance.ts`, table `protocol_generation_cache`) —
  keyed on `(prompt version, protocol version, model, hash of the compact clinical input)`.
  Two users with genuinely different profiles will essentially always miss each other;
  this cache mainly protects against literal duplicate requests (page reload, double-submit,
  retry after a client-side timeout), not cross-user reuse.

On a **miss**, the real call's cost/tokens/latency are stored alongside the result as
`original_*` fields. On a **hit**, those stored numbers — not an estimate — are what
`cacheSavings` and the per-request `latencySavedMs`/`tokensSaved`/`costSavedUsd` report.
This is why cache savings show as zero for entries cached before schema_v2 was applied:
the `original_*` columns didn't exist yet to write into.

**Practical implication for cost forecasting**: because both caches are keyed on
essentially-unique inputs per user (a specific photo set, a specific clinical profile),
don't assume cache hit rate scales with traffic. It scales with *retry/reload behavior*,
which is roughly constant per user regardless of how many total users you have. Treat cache
savings as a discount on top of a volume-driven baseline, not a lever that improves with scale.

## Troubleshooting budget limits

Two independently-configured thresholds per window (daily, monthly), read from
`getAIGovernanceConfig()`:

| Env var | Default | Effect when crossed |
|---|---|---|
| `AI_GOVERNANCE_SOFT_DAILY_BUDGET_USD` | 4 | Request proceeds normally. `console.warn("...budget_soft_exceeded")` logged. Visible via `todaysSpendUsd` vs this threshold — no dedicated flag in the API response, compare the two. |
| `AI_GOVERNANCE_HARD_DAILY_BUDGET_USD` | 5 | The real OpenAI call is **skipped**. Vision falls through to its existing Galaxy/baseline fallback; Protocol falls through to its existing template fallback. The user-facing response is unchanged — same shape, same "fallback" labeling that already existed for any other failure. `recordAIFailure` logs `success:false, failure_reason:"hard_budget_exceeded"` (Protocol) or the request throws `"vision_budget_exceeded"` which the outer catch logs (Vision) — attributed in `ai_usage_log`, not silent. |
| `AI_GOVERNANCE_SOFT_MONTHLY_BUDGET_USD` | 80 | Same as soft daily, monthly window. |
| `AI_GOVERNANCE_HARD_MONTHLY_BUDGET_USD` | 100 | Same as hard daily, monthly window. |

**To diagnose "why are users suddenly getting fallback/template results instead of real AI
analysis"**: check `todaysSpendUsd`/`monthlySpendUsd` against the hard budget env vars first.
If spend is at or above the hard threshold, this is expected behavior, not a bug — the
system is refusing to exceed the configured ceiling rather than calling OpenAI anyway.
Fix by raising the relevant `AI_GOVERNANCE_HARD_*_BUDGET_USD` value (requires a server
restart — these are read once at process start) or by waiting for the window to roll over
(daily resets at UTC midnight; monthly at the 1st).

**Verified behavior** (live-tested 2026-07-30): with the hard daily budget deliberately set
below actual spend, a Protocol generation request completed in the normal request lifecycle
(cache checked and missed first, exactly as any other request) but recorded
`tokenUsage: {promptTokens:0, completionTokens:0, totalTokens:0}` and `source:"fallback"` —
confirming OpenAI was never called. The block was logged: `ai_usage_log` row with
`success:false, failure_reason:"hard_budget_exceeded"`. A cached response requested in the
same window is unaffected, since the cache lookup happens before the budget check in both
`ProtocolOrchestrator.ts` and `app/api/galaxy/analyze/route.ts` — a hit returns before the
budget is ever evaluated.

**Note**: budgets are evaluated by summing `ai_usage_log` rows client-side on every check
(`getEstimatedSpendUsd`), not via a running counter. This is simple and correct but doesn't
scale indefinitely — see the note in `lib/ai/aiUsageLog.ts` if `ai_usage_log` grows very
large and this query starts getting slow; the fix at that point is a materialized daily/
monthly rollup, not a change to the budget logic itself.

## Diagnosing protocol failures

`protocolFailureRatePct` and `protocolTruncationCount` from the admin dashboard are the
starting point. To find the actual cause of a specific failure:

```sql
select created_at, failure_reason from ai_usage_log
where feature = 'protocol' and success = false
order by created_at desc limit 20;
```

Common `failure_reason` values and what they mean:
- `"Unterminated string in JSON..."` / `"Unexpected end of JSON input"` — the completion
  was cut off before the model finished writing valid JSON. This was the dominant failure
  mode before Phase 5.9 (see "Protocol truncation, fixed" below); if you see this recurring
  post-fix, re-run the measurement approach described there before just raising the cap again.
- `"hard_budget_exceeded"` — not a model/prompt problem, see the budget section above.
- Anything else — an upstream OpenAI error (rate limit, model access, 5xx) surfaced verbatim
  from the retry loop's last attempt; cross-reference with `openai-troubleshooting.md`.

### Protocol truncation, fixed (Phase 5.9 background)

Before Phase 5.9, `PROTOCOL_AI_MAX_TOKENS` defaulted to 2200, and real generations measured
across multiple categories consistently produced 2134-2966 completion tokens — meaning the
cap itself was truncating most attempts, not a rare edge case. Section-by-section
measurement of successful generations found `monthlyRecoveryPlan` responsible for 45-55% of
completion tokens and `thingsToAvoid` for another 15-20%; four fix approaches were evaluated
(raise the cap alone / simplify the schema / add prompt-level verbosity limits / multi-stage
generation) before combining the two lowest-risk options: `PROTOCOL_AI_MAX_TOKENS` raised to
3800 (data-justified ~28% headroom over the measured range, not an arbitrary round number)
plus explicit per-field length limits added to the prompt (`buildProtocolPrompt` in
`lib/ai/protocolGovernance.ts`) targeting exactly the two dominant sections. Post-fix,
measured completion tokens dropped to ~1999 average (down from ~2525) with 100% success
across repeated test runs — the prompt limits reduced verbosity enough that the larger cap
is rarely even the binding constraint anymore. **Do not lower `PROTOCOL_AI_MAX_TOKENS` below
~3000 without re-measuring** — re-establish the completion-token distribution first with the
same section-by-section approach, don't guess.

## Estimating future AI costs

Use `averageVisionCostUsd + averageProtocolCostUsd` (the **uncached** per-call averages) as
the cost of one new user journey, not `averageUserJourneyCostUsd` — the latter blends in
cache hits from this specific measurement window's retry/reload pattern, which won't
generalize to a different traffic volume (see "Understanding cache behavior" above for why
cache hit rate doesn't scale with volume).

Measured 2026-07-30 (30-day window, real production-shaped test traffic, not synthetic
estimates):

| Metric | Value |
|---|---|
| Avg. Vision cost (uncached) | $0.000907 |
| Avg. Protocol cost (uncached) | $0.030427 |
| **Cost per new journey** | **$0.031334** |
| Protocol success rate (excluding deliberate budget-block test) | 100% (11/11 natural attempts) |
| Vision cache hit round-trip | 11565ms → 1676ms (85.5% faster), $0.00045 saved, output byte-identical |

### Forecast by daily volume (no cache credit — conservative, use this for budget sizing)

| Analyses/day | Daily cost | Monthly cost (×30) | Current hard budget covers it? |
|---|---|---|---|
| 100 | $3.13 | $93.90 | Yes — within $5/day, $100/mo defaults, but monthly is at 94% utilization |
| 500 | $15.67 | $470.01 | **No** — exceeds the $5/day default more than 3x over |
| 1,000 | $31.33 | $940.02 | **No** — needs daily raised to ~$35+ |
| 5,000 | $156.67 | $4,700.10 | **No** — needs daily raised to ~$175+ |
| 10,000 | $313.34 | $9,400.20 | **No** — needs daily raised to ~$350+ |

Assumptions stated explicitly:
- "1 analysis" = 1 complete user journey = exactly 1 Vision call + 1 Protocol call, both
  uncached (the realistic default for a new/unique user, which is what volume growth mostly
  consists of).
- No retries assumed — natural protocol success rate measured at 100% in this window, so
  retry cost is not material at current prompt/schema settings. Re-check this assumption if
  `protocolTruncationCount` becomes nonzero in production.
- Cache savings are treated as a bonus, not a planning input — see above for why. If you want
  an optimistic figure, this window's measured 15% combined hit rate would multiply the table
  above by roughly 0.85-0.95 (savings differ by feature; Vision hits save more of that
  feature's cost fraction than Protocol hits, since Vision is the cheaper leg), but that 15%
  came from a small manual test batch re-submitting the same inputs, not organic production
  traffic — don't size a budget around it.

**Action needed before scaling past ~150 analyses/day**: `AI_GOVERNANCE_HARD_DAILY_BUDGET_USD`
and `AI_GOVERNANCE_HARD_MONTHLY_BUDGET_USD` (defaults 5 / 100) will start rejecting real AI
calls and silently serving fallback/template results well before volume gets there. Raise
both in the deployment environment (not just `.env.example`) to match your actual expected
volume from the table above, with headroom — the hard budget is a ceiling you should choose
deliberately, not discover in production logs.
