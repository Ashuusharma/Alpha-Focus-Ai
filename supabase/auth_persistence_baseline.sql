-- Baseline auth-owned persistence tables and RLS for app flows.
-- Safe/idempotent; run in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photo_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_date timestamptz not null default now(),
  image_url text,
  analyzer_category text,
  parent_category text,
  captured_image_urls jsonb not null default '[]'::jsonb,
  image_valid boolean not null default true,
  photo_metrics jsonb not null default '{}'::jsonb,
  density_score int,
  inflammation_score int,
  oil_balance_score int,
  severity_snapshot int,
  inflammation_snapshot int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text,
  parent_category text,
  answers jsonb not null default '{}'::jsonb,
  answer_scores jsonb not null default '[]'::jsonb,
  completeness_pct int not null default 0,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  am_done boolean not null default false,
  pm_done boolean not null default false,
  hydration_ml int not null default 0,
  sleep_hours numeric(4,1) not null default 0,
  stress_level int not null default 0,
  adherence_score int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table if not exists public.product_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text,
  product_id text,
  product_name text,
  match_pct int,
  purpose text,
  usage_status text not null default 'pending',
  reason text,
  recommendation_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text,
  alpha_score int not null default 0,
  severity_index int not null default 0,
  confidence_score int not null default 0,
  recovery_probability int not null default 0,
  primary_issue text,
  severity_label text,
  root_drivers jsonb not null default '[]'::jsonb,
  risk_if_ignored text,
  report_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_photo_scans_updated_at on public.photo_scans;
create trigger trg_photo_scans_updated_at
before update on public.photo_scans
for each row execute function public.touch_updated_at();

drop trigger if exists trg_assessment_answers_updated_at on public.assessment_answers;
create trigger trg_assessment_answers_updated_at
before update on public.assessment_answers
for each row execute function public.touch_updated_at();

drop trigger if exists trg_routine_logs_updated_at on public.routine_logs;
create trigger trg_routine_logs_updated_at
before update on public.routine_logs
for each row execute function public.touch_updated_at();

drop trigger if exists trg_product_recommendations_updated_at on public.product_recommendations;
create trigger trg_product_recommendations_updated_at
before update on public.product_recommendations
for each row execute function public.touch_updated_at();

drop trigger if exists trg_clinical_reports_updated_at on public.clinical_reports;
create trigger trg_clinical_reports_updated_at
before update on public.clinical_reports
for each row execute function public.touch_updated_at();

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user_profile();

create index if not exists idx_photo_scans_user_date on public.photo_scans(user_id, scan_date desc);
create index if not exists idx_assessment_answers_user_date on public.assessment_answers(user_id, completed_at desc);
create index if not exists idx_routine_logs_user_date on public.routine_logs(user_id, log_date desc);
create index if not exists idx_product_recommendations_user_date on public.product_recommendations(user_id, created_at desc);
create index if not exists idx_clinical_reports_user_date on public.clinical_reports(user_id, created_at desc);

alter table if exists public.profiles enable row level security;
alter table if exists public.photo_scans enable row level security;
alter table if exists public.assessment_answers enable row level security;
alter table if exists public.routine_logs enable row level security;
alter table if exists public.product_recommendations enable row level security;
alter table if exists public.clinical_reports enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles for delete to authenticated
using (auth.uid() = id);

drop policy if exists "photo_scans_select_own" on public.photo_scans;
create policy "photo_scans_select_own"
on public.photo_scans for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "photo_scans_insert_own" on public.photo_scans;
create policy "photo_scans_insert_own"
on public.photo_scans for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "photo_scans_update_own" on public.photo_scans;
create policy "photo_scans_update_own"
on public.photo_scans for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "photo_scans_delete_own" on public.photo_scans;
create policy "photo_scans_delete_own"
on public.photo_scans for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "assessment_answers_select_own" on public.assessment_answers;
create policy "assessment_answers_select_own"
on public.assessment_answers for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "assessment_answers_insert_own" on public.assessment_answers;
create policy "assessment_answers_insert_own"
on public.assessment_answers for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "assessment_answers_update_own" on public.assessment_answers;
create policy "assessment_answers_update_own"
on public.assessment_answers for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "assessment_answers_delete_own" on public.assessment_answers;
create policy "assessment_answers_delete_own"
on public.assessment_answers for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "routine_logs_select_own" on public.routine_logs;
create policy "routine_logs_select_own"
on public.routine_logs for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "routine_logs_insert_own" on public.routine_logs;
create policy "routine_logs_insert_own"
on public.routine_logs for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "routine_logs_update_own" on public.routine_logs;
create policy "routine_logs_update_own"
on public.routine_logs for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "routine_logs_delete_own" on public.routine_logs;
create policy "routine_logs_delete_own"
on public.routine_logs for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "product_recommendations_select_own" on public.product_recommendations;
create policy "product_recommendations_select_own"
on public.product_recommendations for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "product_recommendations_insert_own" on public.product_recommendations;
create policy "product_recommendations_insert_own"
on public.product_recommendations for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "product_recommendations_update_own" on public.product_recommendations;
create policy "product_recommendations_update_own"
on public.product_recommendations for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "product_recommendations_delete_own" on public.product_recommendations;
create policy "product_recommendations_delete_own"
on public.product_recommendations for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "clinical_reports_select_own" on public.clinical_reports;
create policy "clinical_reports_select_own"
on public.clinical_reports for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "clinical_reports_insert_own" on public.clinical_reports;
create policy "clinical_reports_insert_own"
on public.clinical_reports for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "clinical_reports_update_own" on public.clinical_reports;
create policy "clinical_reports_update_own"
on public.clinical_reports for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "clinical_reports_delete_own" on public.clinical_reports;
create policy "clinical_reports_delete_own"
on public.clinical_reports for delete to authenticated
using (auth.uid() = user_id);
