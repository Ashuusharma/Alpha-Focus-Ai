-- Clinical flow RLS policies for analyzer -> assessment -> result persistence
-- Run this in Supabase SQL Editor (safe/idempotent)

-- photo_scans
alter table if exists public.photo_scans enable row level security;

drop policy if exists "photo_scans_select_own" on public.photo_scans;
create policy "photo_scans_select_own"
on public.photo_scans
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "photo_scans_insert_own" on public.photo_scans;
create policy "photo_scans_insert_own"
on public.photo_scans
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "photo_scans_update_own" on public.photo_scans;
create policy "photo_scans_update_own"
on public.photo_scans
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "photo_scans_delete_own" on public.photo_scans;
create policy "photo_scans_delete_own"
on public.photo_scans
for delete
to authenticated
using (auth.uid() = user_id);

-- assessment_answers
alter table if exists public.assessment_answers enable row level security;

drop policy if exists "assessment_answers_select_own" on public.assessment_answers;
create policy "assessment_answers_select_own"
on public.assessment_answers
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "assessment_answers_insert_own" on public.assessment_answers;
create policy "assessment_answers_insert_own"
on public.assessment_answers
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "assessment_answers_update_own" on public.assessment_answers;
create policy "assessment_answers_update_own"
on public.assessment_answers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "assessment_answers_delete_own" on public.assessment_answers;
create policy "assessment_answers_delete_own"
on public.assessment_answers
for delete
to authenticated
using (auth.uid() = user_id);

-- user_active_analysis
alter table if exists public.user_active_analysis enable row level security;

drop policy if exists "uaa_select_own" on public.user_active_analysis;
create policy "uaa_select_own"
on public.user_active_analysis
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "uaa_insert_own" on public.user_active_analysis;
create policy "uaa_insert_own"
on public.user_active_analysis
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "uaa_update_own" on public.user_active_analysis;
create policy "uaa_update_own"
on public.user_active_analysis
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "uaa_delete_own" on public.user_active_analysis;
create policy "uaa_delete_own"
on public.user_active_analysis
for delete
to authenticated
using (auth.uid() = user_id);

-- Verify
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('photo_scans', 'assessment_answers', 'user_active_analysis')
order by tablename, policyname;
