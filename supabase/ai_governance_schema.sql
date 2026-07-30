-- AI cost accounting, Vision cache, and Protocol cache.
-- Written server-side only via the service role key (same pattern as the
-- rest of this project's ad hoc schema files — no ORM/migration tool).

-- Part 1: token accounting. One row per OpenAI request, vision or protocol.
create table if not exists ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text not null,
  feature text not null check (feature in ('vision', 'protocol')),
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost_usd numeric(10, 6) not null default 0,
  latency_ms integer not null default 0,
  cached boolean not null default false,
  user_id uuid references auth.users(id) on delete set null,
  report_id text,
  prompt_version text,
  temperature numeric(3, 2),
  response_schema_version text,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_log_created_at_idx on ai_usage_log (created_at desc);
create index if not exists ai_usage_log_feature_idx on ai_usage_log (feature, created_at desc);
create index if not exists ai_usage_log_user_id_idx on ai_usage_log (user_id, created_at desc);

alter table ai_usage_log enable row level security;
-- Written only by the server (service role bypasses RLS). No end-user policy
-- is defined on purpose — this table is not meant to be client-readable.

-- Part 2: Vision cache, keyed by the exact set of images + category + model
-- + prompt version. Never reused across different categories or prompt
-- versions (enforced by the unique constraint, not just application logic).
create table if not exists vision_analysis_cache (
  id uuid primary key default gen_random_uuid(),
  image_hash text not null,
  category text not null,
  vision_model text not null,
  prompt_version text not null,
  analysis_result jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (image_hash, category, vision_model, prompt_version)
);

create index if not exists vision_analysis_cache_lookup_idx
  on vision_analysis_cache (image_hash, category, vision_model, prompt_version);
create index if not exists vision_analysis_cache_expires_at_idx on vision_analysis_cache (expires_at);

alter table vision_analysis_cache enable row level security;

-- Part 3: Protocol cache, keyed by a hash of the normalized assessment plus
-- prompt/protocol/model versions (see lib/ai/protocolGovernance.ts —
-- buildProtocolCacheKey folds all three into the key itself, so a change in
-- any of them naturally misses rather than needing an explicit invalidation
-- pass). The columns are stored separately too, for dashboard queries and
-- manual debugging.
create table if not exists protocol_generation_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  prompt_version text not null,
  protocol_version text not null,
  model text not null,
  report_payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists protocol_generation_cache_key_idx on protocol_generation_cache (cache_key);
create index if not exists protocol_generation_cache_expires_at_idx on protocol_generation_cache (expires_at);

alter table protocol_generation_cache enable row level security;
