alter table public.alpha_sikka_transactions
  add column if not exists action_code text,
  add column if not exists activity_date date;

create unique index if not exists idx_alpha_sikka_user_action_date_unique
  on public.alpha_sikka_transactions (user_id, action_code, activity_date)
  where action_code is not null and activity_date is not null;

create or replace function public.process_alpha_sikka_transaction(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_category text default null,
  p_description text default null,
  p_reference_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_action_code text default null,
  p_activity_date date default current_date
)
returns table (
  current_balance integer,
  lifetime_earned integer,
  lifetime_spent integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer := 0;
  v_amount integer;
  v_category text;
  v_description text;
  v_lock_key bigint;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'p_amount must be > 0';
  end if;

  v_lock_key := ('x' || substr(md5(p_user_id::text), 1, 16))::bit(64)::bigint;
  perform pg_advisory_xact_lock(v_lock_key);

  select coalesce(sum(amount), 0)::integer
  into v_balance
  from public.alpha_sikka_transactions
  where user_id = p_user_id;

  if p_type = 'spend' then
    if v_balance < p_amount then
      raise exception 'Insufficient balance';
    end if;
    v_amount := -abs(p_amount);
    v_category := coalesce(p_category, 'redemption');
    v_description := coalesce(p_description, 'Alpha Sikka spend');
  elsif p_type = 'earn' then
    v_amount := abs(p_amount);
    v_category := coalesce(p_category, 'engagement');
    v_description := coalesce(p_description, 'Alpha Sikka earn');
  else
    raise exception 'Invalid p_type. Use earn or spend';
  end if;

  insert into public.alpha_sikka_transactions (
    user_id,
    amount,
    category,
    action_code,
    activity_date,
    description,
    reference_id,
    metadata
  )
  values (
    p_user_id,
    v_amount,
    v_category,
    p_action_code,
    p_activity_date,
    v_description,
    p_reference_id,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return query
  select
    coalesce(sum(amount), 0)::integer as current_balance,
    coalesce(sum(case when amount > 0 then amount else 0 end), 0)::integer as lifetime_earned,
    coalesce(sum(case when amount < 0 then abs(amount) else 0 end), 0)::integer as lifetime_spent
  from public.alpha_sikka_transactions
  where user_id = p_user_id;
end;
$$;