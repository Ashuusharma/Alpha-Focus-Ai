-- Time-gated execution sessions for server-side reward verification.
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.execution_task_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference_id text not null,
  category text not null,
  day_number int not null check (day_number between 1 and 30),
  task_core_id text not null,
  expected_duration_sec int not null check (expected_duration_sec > 0),
  window_start text not null,
  window_end text not null,
  product_required boolean not null default false,
  product_verified boolean not null default false,
  status text not null default 'running' check (status in ('running', 'completed', 'expired')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  verification_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, reference_id)
);

create index if not exists idx_execution_sessions_user_status
  on public.execution_task_sessions(user_id, status, updated_at desc);

create index if not exists idx_execution_sessions_user_ref
  on public.execution_task_sessions(user_id, reference_id);

create or replace function public.touch_execution_task_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_execution_task_sessions_updated_at on public.execution_task_sessions;
create trigger trg_execution_task_sessions_updated_at
before update on public.execution_task_sessions
for each row execute function public.touch_execution_task_sessions_updated_at();

alter table public.execution_task_sessions enable row level security;

drop policy if exists "execution_task_sessions_select_own" on public.execution_task_sessions;
create policy "execution_task_sessions_select_own"
on public.execution_task_sessions
for select
using (auth.uid() = user_id);

drop policy if exists "execution_task_sessions_insert_own" on public.execution_task_sessions;
create policy "execution_task_sessions_insert_own"
on public.execution_task_sessions
for insert
with check (auth.uid() = user_id);

drop policy if exists "execution_task_sessions_update_own" on public.execution_task_sessions;
create policy "execution_task_sessions_update_own"
on public.execution_task_sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "execution_task_sessions_delete_own" on public.execution_task_sessions;
create policy "execution_task_sessions_delete_own"
on public.execution_task_sessions
for delete
using (auth.uid() = user_id);
