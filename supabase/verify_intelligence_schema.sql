-- Intelligence schema verification checklist
-- This file now includes safe preflight repair before verification.

-- 0) Preflight repair (safe/idempotent)
alter table if exists public.photo_scans
  add column if not exists scan_date timestamptz default now(),
  add column if not exists analyzer_category text,
  add column if not exists parent_category text,
  add column if not exists captured_image_urls jsonb default '[]'::jsonb;

alter table if exists public.assessment_answers
  add column if not exists completed_at timestamptz default now(),
  add column if not exists category text,
  add column if not exists parent_category text;

alter table if exists public.user_active_analysis
  add column if not exists parent_category text;

alter table if exists public.routine_logs
  add column if not exists log_date date default current_date,
  add column if not exists created_at timestamptz default now();

alter table if exists public.product_recommendations
  add column if not exists created_at timestamptz default now(),
  add column if not exists category text;

alter table if exists public.user_progress_metrics
  add column if not exists updated_at timestamptz default now(),
  add column if not exists category text;

-- Remove legacy duplicate rows so unique index can be created
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

create index if not exists idx_photo_scans_user_parent_category_date
  on public.photo_scans(user_id, parent_category, scan_date desc);

create index if not exists idx_assessment_answers_user_category_date
  on public.assessment_answers(user_id, category, completed_at desc);

create index if not exists idx_assessment_answers_user_parent_category_date
  on public.assessment_answers(user_id, parent_category, completed_at desc);

create index if not exists idx_user_active_analysis_parent
  on public.user_active_analysis(parent_category, selected_at desc);

create unique index if not exists uq_routine_logs_user_date
  on public.routine_logs(user_id, log_date);

create index if not exists idx_product_reco_user_category
  on public.product_recommendations(user_id, category, created_at desc);

-- 1) Required tables
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'user_active_analysis',
    'user_category_clinical_scores',
    'user_progress_metrics',
    'photo_scans',
    'assessment_answers',
    'routine_logs',
    'product_recommendations',
    'user_subscriptions'
  )
order by table_name;

-- 2) Critical columns: photo_scans
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'photo_scans'
  and column_name in (
    'analyzer_category',
    'parent_category',
    'captured_image_urls',
    'image_valid',
    'photo_metrics',
    'severity_snapshot',
    'inflammation_snapshot',
    'scan_date'
  )
order by column_name;

-- 3) Critical columns: assessment_answers
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'assessment_answers'
  and column_name in ('category', 'parent_category', 'answers', 'answer_scores', 'completed_at')
order by column_name;

-- 3b) Critical columns: user_active_analysis
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'user_active_analysis'
  and column_name in ('selected_category', 'parent_category', 'selected_at')
order by column_name;

-- 4) Critical columns: product_recommendations
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'product_recommendations'
  and column_name in ('category', 'reason', 'recommendation_payload', 'created_at')
order by column_name;

-- 5) Critical columns: user_subscriptions
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'user_subscriptions'
  and column_name in ('plan', 'active', 'started_at', 'expires_at')
order by column_name;

-- 6) Required indexes
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'idx_progress_user_updated',
    'idx_photo_scans_user_category_date',
    'idx_photo_scans_user_parent_category_date',
    'idx_assessment_answers_user_category_date',
    'idx_assessment_answers_user_parent_category_date',
    'idx_user_active_analysis_parent',
    'uq_routine_logs_user_date',
    'idx_product_reco_user_category'
  )
order by indexname;

-- 7) Required RPC function
select routine_name
from information_schema.routines
where specific_schema = 'public'
  and routine_name in ('recalculate_integrated_scores');

-- 8) Quick pass/fail summary
with req_tables as (
  select unnest(array[
    'user_active_analysis',
    'user_category_clinical_scores',
    'user_progress_metrics',
    'photo_scans',
    'assessment_answers',
    'routine_logs',
    'product_recommendations',
    'user_subscriptions'
  ]) as name
), got_tables as (
  select table_name as name
  from information_schema.tables
  where table_schema = 'public'
), req_indexes as (
  select unnest(array[
    'idx_progress_user_updated',
    'idx_photo_scans_user_category_date',
    'idx_photo_scans_user_parent_category_date',
    'idx_assessment_answers_user_category_date',
    'idx_assessment_answers_user_parent_category_date',
    'idx_user_active_analysis_parent',
    'uq_routine_logs_user_date',
    'idx_product_reco_user_category'
  ]) as name
), got_indexes as (
  select indexname as name
  from pg_indexes
  where schemaname = 'public'
)
select 'tables_missing' as check_name, coalesce(string_agg(r.name, ', '), 'none') as result
from req_tables r
left join got_tables g on g.name = r.name
where g.name is null
union all
select 'indexes_missing' as check_name, coalesce(string_agg(r.name, ', '), 'none') as result
from req_indexes r
left join got_indexes g on g.name = r.name
where g.name is null;
