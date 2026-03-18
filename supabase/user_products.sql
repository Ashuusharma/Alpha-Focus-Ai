-- User product ownership table for Daily Execution Engine.
create table if not exists public.user_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists idx_user_products_user on public.user_products(user_id);
create index if not exists idx_user_products_product on public.user_products(product_id);

alter table public.user_products enable row level security;

drop policy if exists "user_products_select_own" on public.user_products;
create policy "user_products_select_own"
on public.user_products
for select
using (auth.uid() = user_id);

drop policy if exists "user_products_insert_own" on public.user_products;
create policy "user_products_insert_own"
on public.user_products
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_products_update_own" on public.user_products;
create policy "user_products_update_own"
on public.user_products
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_products_delete_own" on public.user_products;
create policy "user_products_delete_own"
on public.user_products
for delete
using (auth.uid() = user_id);

create or replace function public.set_user_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_products_updated_at on public.user_products;
create trigger trg_user_products_updated_at
before update on public.user_products
for each row
execute function public.set_user_products_updated_at();
