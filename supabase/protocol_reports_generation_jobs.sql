-- Protocol report + generation job tables (idempotent)
-- Run in Supabase SQL editor.

create table if not exists public.protocol_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_category text,
  source_locale text not null default 'en-IN',
  source_version text not null default 'v1',
  model_name text,
  status text not null default 'generating' check (status in ('generating', 'ready', 'archived', 'failed')),
  clinical_profile jsonb not null default '{}'::jsonb,
  protocol_input jsonb not null default '{}'::jsonb,
  report_payload jsonb not null default '{}'::jsonb,
  fallback_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  generated_at timestamptz,
  archived_at timestamptz
);

create index if not exists idx_protocol_reports_user_created
  on public.protocol_reports(user_id, created_at desc);

create index if not exists idx_protocol_reports_user_status
  on public.protocol_reports(user_id, status, updated_at desc);

create table if not exists public.protocol_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid references public.protocol_reports(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed', 'retry_scheduled', 'cancelled')),
  priority smallint not null default 5 check (priority between 1 and 10),
  attempts int not null default 0 check (attempts >= 0),
  max_attempts int not null default 3 check (max_attempts between 1 and 20),
  scheduled_for timestamptz not null default now(),
  locked_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  error_message text,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_protocol_jobs_sched
  on public.protocol_generation_jobs(status, scheduled_for asc, priority asc);

create index if not exists idx_protocol_jobs_user_created
  on public.protocol_generation_jobs(user_id, created_at desc);

alter table if exists public.protocol_reports enable row level security;
alter table if exists public.protocol_generation_jobs enable row level security;

drop policy if exists "protocol_reports_select_own" on public.protocol_reports;
create policy "protocol_reports_select_own"
on public.protocol_reports
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "protocol_reports_insert_own" on public.protocol_reports;
create policy "protocol_reports_insert_own"
on public.protocol_reports
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "protocol_reports_update_own" on public.protocol_reports;
create policy "protocol_reports_update_own"
on public.protocol_reports
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "protocol_reports_delete_own" on public.protocol_reports;
create policy "protocol_reports_delete_own"
on public.protocol_reports
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "protocol_jobs_select_own" on public.protocol_generation_jobs;
create policy "protocol_jobs_select_own"
on public.protocol_generation_jobs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "protocol_jobs_insert_own" on public.protocol_generation_jobs;
create policy "protocol_jobs_insert_own"
on public.protocol_generation_jobs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "protocol_jobs_update_own" on public.protocol_generation_jobs;
create policy "protocol_jobs_update_own"
on public.protocol_generation_jobs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "protocol_jobs_delete_own" on public.protocol_generation_jobs;
create policy "protocol_jobs_delete_own"
on public.protocol_generation_jobs
for delete
to authenticated
using (auth.uid() = user_id);
