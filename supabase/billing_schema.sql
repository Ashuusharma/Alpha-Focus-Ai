-- Phase 6: subscription billing. Additive (create table if not exists /
-- add column if not exists), safe to run against the existing schema.
--
-- NOTE: the plan-vocabulary migration below (the `update` statements) DOES
-- rewrite existing rows in user_subscriptions — read it before applying.

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

-- Plan vocabulary migration: old basic/plus/pro -> free/premium_monthly/premium_yearly.
-- plus and pro both collapse to premium_monthly (the old system had no
-- monthly/yearly billing-cycle distinction; affected users keep their
-- active/paid status and can switch to yearly from the redesigned /upgrade
-- page whenever they choose).
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
