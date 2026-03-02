-- Unified Alpha Sikka transaction ledger
-- Run this once in Supabase SQL editor for your project

create extension if not exists pgcrypto;

create table if not exists public.alpha_sikka_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  category text not null check (category in ('discipline','improvement','challenge','milestone','engagement','redemption')),
  description text not null,
  reference_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_alpha_sikka_user_created
  on public.alpha_sikka_transactions (user_id, created_at desc);

create unique index if not exists idx_alpha_sikka_reference_unique
  on public.alpha_sikka_transactions (user_id, reference_id)
  where reference_id is not null;

alter table public.alpha_sikka_transactions enable row level security;

drop policy if exists "alpha_sikka_select_own" on public.alpha_sikka_transactions;
create policy "alpha_sikka_select_own"
on public.alpha_sikka_transactions
for select
using (auth.uid() = user_id);

drop policy if exists "alpha_sikka_insert_own" on public.alpha_sikka_transactions;
create policy "alpha_sikka_insert_own"
on public.alpha_sikka_transactions
for insert
with check (auth.uid() = user_id);

-- Balance/lifetime computed dynamically; never persist static balance.
create or replace view public.alpha_sikka_summary as
select
  user_id,
  coalesce(sum(amount), 0) as current_balance,
  coalesce(sum(case when amount > 0 then amount else 0 end), 0) as lifetime_earned,
  coalesce(sum(case when amount < 0 then abs(amount) else 0 end), 0) as lifetime_spent,
  max(created_at) as last_transaction_at
from public.alpha_sikka_transactions
group by user_id;
