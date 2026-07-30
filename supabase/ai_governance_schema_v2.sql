-- Phase 5.9 additions to the Phase 5.8 AI governance schema. All additive
-- (add column if not exists) — safe to run against the existing tables,
-- nothing destructive, no data loss.

-- Part 7: track every protocol attempt (not just successful ones) so
-- success/failure/truncation rates are queryable. success=true for real
-- OpenAI calls and cache hits (both already logged); success=false rows are
-- new as of Phase 5.9, logged for fallback/truncation/budget-block cases
-- that previously weren't recorded here at all.
alter table ai_usage_log add column if not exists success boolean not null default true;
alter table ai_usage_log add column if not exists failure_reason text;

-- Part 4: per-request Vision cache reporting fields.
alter table ai_usage_log add column if not exists image_hash text;
alter table ai_usage_log add column if not exists category text;
alter table ai_usage_log add column if not exists latency_saved_ms integer;
alter table ai_usage_log add column if not exists tokens_saved integer;
alter table ai_usage_log add column if not exists cost_saved_usd numeric(10, 6);

-- Part 4: store the *real* cost/latency/tokens alongside each Vision cache
-- entry when it's first written, so a later cache hit can report accurate
-- "saved" figures (measured, not estimated) by reading them back.
alter table vision_analysis_cache add column if not exists original_prompt_tokens integer;
alter table vision_analysis_cache add column if not exists original_completion_tokens integer;
alter table vision_analysis_cache add column if not exists original_cost_usd numeric(10, 6);
alter table vision_analysis_cache add column if not exists original_latency_ms integer;

create index if not exists ai_usage_log_success_idx on ai_usage_log (feature, success, created_at desc);
