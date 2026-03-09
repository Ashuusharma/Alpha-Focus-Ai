-- RLS policies for user_active_analysis (safe/idempotent)

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

-- verify
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'user_active_analysis'
order by policyname;
