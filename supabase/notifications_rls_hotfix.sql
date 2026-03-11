alter table public.notifications enable row level security;

drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own"
on public.notifications
for insert
with check (auth.uid() = user_id);
