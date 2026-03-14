create extension if not exists pgcrypto;

create table if not exists public.user_recovery_program_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  selected_day integer not null default 1 check (selected_day >= 1 and selected_day <= 120),
  timezone text not null default 'Asia/Kolkata',
  completed_task_keys jsonb not null default '{}'::jsonb,
  day_completions jsonb not null default '{}'::jsonb,
  current_day integer not null default 1 check (current_day >= 1 and current_day <= 120),
  streak integer not null default 0 check (streak >= 0),
  last_completed_date date,
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

create index if not exists idx_recovery_program_state_user_updated
  on public.user_recovery_program_state (user_id, updated_at desc);

alter table public.user_recovery_program_state enable row level security;

drop policy if exists "recovery_program_state_select_own" on public.user_recovery_program_state;
create policy "recovery_program_state_select_own"
on public.user_recovery_program_state
for select
using (auth.uid() = user_id);

drop policy if exists "recovery_program_state_insert_own" on public.user_recovery_program_state;
create policy "recovery_program_state_insert_own"
on public.user_recovery_program_state
for insert
with check (auth.uid() = user_id);

drop policy if exists "recovery_program_state_update_own" on public.user_recovery_program_state;
create policy "recovery_program_state_update_own"
on public.user_recovery_program_state
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
