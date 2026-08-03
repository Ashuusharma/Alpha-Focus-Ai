-- Phase 8: Production schema repair.
-- Safe/idempotent; run in Supabase SQL editor against the production project.
--
-- Root cause: auth_persistence_baseline.sql defines public.routine_logs via
-- `create table if not exists`, but routine_logs already existed in production
-- under an older shape (id, user_id, routine_type, completed, log_date,
-- created_at) from before that migration was written. `if not exists` made
-- the whole block a no-op for this table, so the new columns the app has
-- queried against ever since (am_done, pm_done, hydration_ml, sleep_hours,
-- stress_level, adherence_score, updated_at) were never actually created in
-- production. Confirmed via live schema introspection: 0 rows in the table,
-- so this is a zero-data-risk additive fix, not a migration of real user data.
--
-- public.challenge_progress has no create-table statement anywhere in this
-- supabase/ directory at all — it was created ad hoc, outside migrations,
-- under yet another shape (id, user_id, challenge_name, progress, completed,
-- created_at). Nothing in the app ever writes to it; two read call sites
-- disagree with each other and with the live shape. Also confirmed 0 rows.

-- ---------------------------------------------------------------------------
-- routine_logs: add the columns every current call site actually queries.
-- ---------------------------------------------------------------------------
alter table public.routine_logs add column if not exists am_done boolean not null default false;
alter table public.routine_logs add column if not exists pm_done boolean not null default false;
alter table public.routine_logs add column if not exists hydration_ml int not null default 0;
alter table public.routine_logs add column if not exists sleep_hours numeric(4,1) not null default 0;
alter table public.routine_logs add column if not exists stress_level int not null default 0;
alter table public.routine_logs add column if not exists adherence_score int not null default 0;
alter table public.routine_logs add column if not exists updated_at timestamptz not null default now();

-- Every tracker (Sleep/Hydration/Mood) upserts with onConflict: "user_id,log_date".
-- Postgres requires a matching unique/exclusion constraint for ON CONFLICT to
-- work at all -- without this, those upserts fail outright in production.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.routine_logs'::regclass
      and contype = 'u'
      and conname = 'routine_logs_user_id_log_date_key'
  ) then
    alter table public.routine_logs
      add constraint routine_logs_user_id_log_date_key unique (user_id, log_date);
  end if;
end $$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_routine_logs_updated_at on public.routine_logs;
create trigger trg_routine_logs_updated_at
before update on public.routine_logs
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- challenge_progress: add updated_at so the existing `.order("updated_at")`
-- read in lib/hydrateUserData.ts stops failing. Nothing currently writes to
-- this table (verified: zero INSERT/UPDATE call sites in the app), so no
-- further shape changes are made here -- see the paired code fix in
-- lib/notifications/notificationScheduler.ts, which is adjusted to select
-- only columns that actually exist rather than inventing new ones.
-- ---------------------------------------------------------------------------
alter table public.challenge_progress add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_challenge_progress_updated_at on public.challenge_progress;
create trigger trg_challenge_progress_updated_at
before update on public.challenge_progress
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- profiles: live table is missing avatar_url/city/updated_at. Confirmed real
-- impact: app/api/user/sync/route.ts upserts city + updated_at on every call
-- and fails in production today. auth_persistence_baseline.sql's
-- trg_profiles_updated_at trigger already exists live (CREATE TRIGGER doesn't
-- validate the referenced column at creation time) and has been silently
-- erroring on every UPDATE to this table since it was created -- this also
-- self-resolves once updated_at exists. 85 real rows in production; this is
-- additive-only (add column with a default), no existing data is touched.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- clinical_reports: live shape (scan_id, report_data, severity_score,
-- confidence_score) predates auth_persistence_baseline.sql's intended shape
-- and doesn't match either read call site (lib/hydrateUserData.ts does
-- `select("*")` so it doesn't error, but gets the wrong shape back;
-- app/api/reports/weekly/route.ts selects/inserts report_payload/category,
-- which don't exist live and would fail if that route is ever called).
-- That route is currently dead code (its only caller, src/services/
-- lifestyleApi.ts, has zero importers) so this isn't an active production
-- failure today, but it's a real latent one and the table has 0 rows, so
-- fixing it now is zero-risk.
-- ---------------------------------------------------------------------------
alter table public.clinical_reports add column if not exists category text;
alter table public.clinical_reports add column if not exists alpha_score int not null default 0;
alter table public.clinical_reports add column if not exists severity_index int not null default 0;
alter table public.clinical_reports add column if not exists recovery_probability int not null default 0;
alter table public.clinical_reports add column if not exists primary_issue text;
alter table public.clinical_reports add column if not exists severity_label text;
alter table public.clinical_reports add column if not exists root_drivers jsonb not null default '[]'::jsonb;
alter table public.clinical_reports add column if not exists risk_if_ignored text;
alter table public.clinical_reports add column if not exists report_payload jsonb not null default '{}'::jsonb;
alter table public.clinical_reports add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_clinical_reports_updated_at on public.clinical_reports;
create trigger trg_clinical_reports_updated_at
before update on public.clinical_reports
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Billing (Cashfree): subscription_orders does not exist in production at
-- all -- the entire Phase 6 billing schema (supabase/billing_schema.sql) was
-- written in an earlier phase but never applied. Folded in verbatim here so
-- this one file is the complete Phase 8 repair. user_subscriptions currently
-- has 0 live rows, so the plan-vocabulary `update` statements below are
-- no-ops today, but are kept for correctness if rows exist by the time this
-- runs.
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  plan text not null check (plan in ('premium_monthly', 'premium_yearly')),
  provider text not null default 'cashfree',
  provider_order_id text not null,
  amount_inr numeric(10, 2) not null,
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscription_orders_provider_order_idx
  on public.subscription_orders (provider, provider_order_id);
create index if not exists subscription_orders_user_idx
  on public.subscription_orders (user_id, created_at desc);

alter table public.user_subscriptions add column if not exists provider text default 'cashfree';

update public.user_subscriptions set plan = 'free' where plan = 'basic';
update public.user_subscriptions set plan = 'premium_monthly' where plan in ('plus', 'pro');

alter table public.user_subscriptions alter column plan set default 'free';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_subscriptions_plan_check'
  ) then
    alter table public.user_subscriptions
      add constraint user_subscriptions_plan_check
      check (plan in ('free', 'premium_monthly', 'premium_yearly'));
  end if;
end $$;
