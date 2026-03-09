-- Intelligence layer compatibility updates (safe/idempotent)

create table if not exists public.user_active_analysis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_category text not null,
  parent_category text,
  selected_at timestamptz not null default now()
);

alter table if exists public.user_active_analysis
  add column if not exists parent_category text;

create index if not exists idx_user_active_analysis_parent
  on public.user_active_analysis(parent_category, selected_at desc);

create table if not exists public.user_category_clinical_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  severity_score int not null default 0,
  confidence_score int not null default 0,
  risk_level text not null default 'low',
  recovery_probability int not null default 0,
  condition_label text not null default 'Insufficient structured data',
  stage_label text,
  stage_description text,
  assessment_completeness int not null default 0,
  primary_domain text,
  domain_scores jsonb not null default '{}'::jsonb,
  root_cause_map jsonb not null default '[]'::jsonb,
  report_payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

create table if not exists public.user_progress_metrics (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  scans_count int default 0,
  first_severity int default 0,
  latest_severity int default 0,
  improvement_pct int default 0,
  inflammation_reduction_rate int default 0,
  consistency_score int default 0,
  recovery_velocity int default 0,
  discipline_index int default 0,
  confidence_score int default 0,
  trend_direction text default 'stable',
  trend_message text,
  updated_at timestamptz default now(),
  primary key (user_id, category)
);

create index if not exists idx_progress_user_updated
  on public.user_progress_metrics(user_id, updated_at desc);

alter table if exists public.photo_scans
  add column if not exists scan_date timestamptz default now(),
  add column if not exists analyzer_category text,
  add column if not exists parent_category text,
  add column if not exists captured_image_urls jsonb default '[]'::jsonb,
  add column if not exists image_valid boolean default true,
  add column if not exists photo_metrics jsonb default '{}'::jsonb,
  add column if not exists density_score int,
  add column if not exists inflammation_score int,
  add column if not exists oil_balance_score int,
  add column if not exists severity_snapshot int,
  add column if not exists inflammation_snapshot int;

create index if not exists idx_photo_scans_user_category_date
  on public.photo_scans(user_id, analyzer_category, scan_date desc);

create index if not exists idx_photo_scans_user_parent_category_date
  on public.photo_scans(user_id, parent_category, scan_date desc);

alter table if exists public.assessment_answers
  add column if not exists completed_at timestamptz default now(),
  add column if not exists category text,
  add column if not exists parent_category text,
  add column if not exists completeness_pct int default 0,
  add column if not exists answers jsonb default '{}'::jsonb,
  add column if not exists answer_scores jsonb default '[]'::jsonb;

create index if not exists idx_assessment_answers_user_category_date
  on public.assessment_answers(user_id, category, completed_at desc);

create index if not exists idx_assessment_answers_user_parent_category_date
  on public.assessment_answers(user_id, parent_category, completed_at desc);

update public.photo_scans
set parent_category = case
  when analyzer_category in ('acne', 'dark_circles', 'lip_care', 'anti_aging') then 'skin'
  when analyzer_category in ('hair_loss', 'scalp_health') then 'hair'
  when analyzer_category = 'beard_growth' then 'beard'
  when analyzer_category = 'body_acne' then 'body'
  else parent_category
end
where parent_category is null
  and analyzer_category is not null;

update public.assessment_answers
set parent_category = case
  when category in ('acne', 'dark_circles', 'lip_care', 'anti_aging') then 'skin'
  when category in ('hair_loss', 'scalp_health') then 'hair'
  when category = 'beard_growth' then 'beard'
  when category = 'body_acne' then 'body'
  else parent_category
end
where parent_category is null
  and category is not null;

update public.user_active_analysis
set parent_category = case
  when selected_category in ('acne', 'dark_circles', 'lip_care', 'anti_aging') then 'skin'
  when selected_category in ('hair_loss', 'scalp_health') then 'hair'
  when selected_category = 'beard_growth' then 'beard'
  when selected_category = 'body_acne' then 'body'
  else parent_category
end
where parent_category is null
  and selected_category is not null;

alter table if exists public.routine_logs
  add column if not exists log_date date,
  add column if not exists created_at timestamptz default now();

create unique index if not exists uq_routine_logs_user_date
  on public.routine_logs(user_id, log_date);

alter table if exists public.product_recommendations
  add column if not exists category text,
  add column if not exists reason text,
  add column if not exists recommendation_payload jsonb,
  add column if not exists created_at timestamptz default now();

create index if not exists idx_product_reco_user_category
  on public.product_recommendations(user_id, category, created_at desc);

alter table if exists public.user_subscriptions
  add column if not exists plan text default 'basic',
  add column if not exists active boolean default true,
  add column if not exists started_at timestamptz default now();
