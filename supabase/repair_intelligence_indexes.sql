-- Repair script for missing intelligence indexes
-- Safe to run multiple times

-- Ensure required timestamp/date columns exist before index creation
alter table if exists public.photo_scans
  add column if not exists scan_date timestamptz default now(),
  add column if not exists analyzer_category text;

alter table if exists public.assessment_answers
  add column if not exists completed_at timestamptz default now(),
  add column if not exists category text;

alter table if exists public.routine_logs
  add column if not exists log_date date default current_date,
  add column if not exists created_at timestamptz default now();

alter table if exists public.product_recommendations
  add column if not exists created_at timestamptz default now(),
  add column if not exists category text;

alter table if exists public.user_progress_metrics
  add column if not exists updated_at timestamptz default now(),
  add column if not exists category text;

-- Deduplicate routine rows so unique index creation cannot fail on legacy duplicates
delete from public.routine_logs rl
using (
  select ctid,
         row_number() over (
           partition by user_id, log_date
           order by created_at desc nulls last, ctid desc
         ) as rn
  from public.routine_logs
  where user_id is not null
    and log_date is not null
) d
where rl.ctid = d.ctid
  and d.rn > 1;

create index if not exists idx_progress_user_updated
  on public.user_progress_metrics(user_id, updated_at desc);

create index if not exists idx_photo_scans_user_category_date
  on public.photo_scans(user_id, analyzer_category, scan_date desc);

create index if not exists idx_assessment_answers_user_category_date
  on public.assessment_answers(user_id, category, completed_at desc);

create unique index if not exists uq_routine_logs_user_date
  on public.routine_logs(user_id, log_date);

create index if not exists idx_product_reco_user_category
  on public.product_recommendations(user_id, category, created_at desc);

-- Quick check after repair
select indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'idx_progress_user_updated',
    'idx_photo_scans_user_category_date',
    'idx_assessment_answers_user_category_date',
    'uq_routine_logs_user_date',
    'idx_product_reco_user_category'
  )
order by indexname;
