-- Hotfix: RLS + missing columns for clinical reporting flow
-- Run in Supabase SQL editor

alter table if exists public.assessment_answers
  add column if not exists completeness_pct int default 0,
  add column if not exists parent_category text;

-- user_category_clinical_scores must be writable/readable by the authenticated owner
alter table if exists public.user_category_clinical_scores enable row level security;

drop policy if exists "clinical_scores_select_own" on public.user_category_clinical_scores;
create policy "clinical_scores_select_own"
on public.user_category_clinical_scores
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "clinical_scores_insert_own" on public.user_category_clinical_scores;
create policy "clinical_scores_insert_own"
on public.user_category_clinical_scores
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "clinical_scores_update_own" on public.user_category_clinical_scores;
create policy "clinical_scores_update_own"
on public.user_category_clinical_scores
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "clinical_scores_delete_own" on public.user_category_clinical_scores;
create policy "clinical_scores_delete_own"
on public.user_category_clinical_scores
for delete
to authenticated
using (auth.uid() = user_id);

-- Support reads for report side-panels
alter table if exists public.user_progress_metrics enable row level security;
drop policy if exists "progress_select_own" on public.user_progress_metrics;
create policy "progress_select_own"
on public.user_progress_metrics
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "progress_write_own" on public.user_progress_metrics;
create policy "progress_write_own"
on public.user_progress_metrics
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table if exists public.user_global_domains enable row level security;
drop policy if exists "global_domains_select_own" on public.user_global_domains;
create policy "global_domains_select_own"
on public.user_global_domains
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "global_domains_write_own" on public.user_global_domains;
create policy "global_domains_write_own"
on public.user_global_domains
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table if exists public.user_relapse_risk enable row level security;
drop policy if exists "relapse_risk_select_own" on public.user_relapse_risk;
create policy "relapse_risk_select_own"
on public.user_relapse_risk
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "relapse_risk_write_own" on public.user_relapse_risk;
create policy "relapse_risk_write_own"
on public.user_relapse_risk
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Verify current policies
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'assessment_answers',
    'user_category_clinical_scores',
    'user_progress_metrics',
    'user_global_domains',
    'user_relapse_risk'
  )
order by tablename, policyname;
