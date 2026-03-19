create table if not exists public.alpha_tiers (
  id serial primary key,
  tier_name text not null,
  min_points int not null,
  discount_cap_percent int not null,
  streak_multiplier numeric default 1
);

insert into public.alpha_tiers (tier_name, min_points, discount_cap_percent, streak_multiplier)
select * from (
  values
    ('Starter', 0, 15, 1::numeric),
    ('Performer', 200, 20, 1.2::numeric),
    ('Champion', 600, 25, 1.5::numeric)
) as seed(tier_name, min_points, discount_cap_percent, streak_multiplier)
where not exists (
  select 1 from public.alpha_tiers t where t.tier_name = seed.tier_name
);

create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id),
  current_streak int default 0,
  longest_streak int default 0,
  last_activity_date date
);

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id),
  plan text not null default 'basic',
  active boolean default true,
  started_at timestamptz default now(),
  expires_at timestamptz
);

create table if not exists public.user_ai_recommendations (
  user_id uuid primary key references auth.users(id),
  recommendation_blob jsonb,
  generated_at timestamptz default now()
);

create or replace function public.get_user_tier(p_user uuid)
returns table (
  tier_name text,
  min_points int,
  discount_cap_percent int,
  streak_multiplier numeric,
  lifetime_earned int
)
language plpgsql
security definer
as $$
declare
  v_lifetime int := 0;
begin
  select coalesce(sum(case when amount > 0 then amount else 0 end), 0)::int
  into v_lifetime
  from public.alpha_sikka_transactions
  where user_id = p_user;

  return query
  select
    t.tier_name,
    t.min_points,
    t.discount_cap_percent,
    t.streak_multiplier,
    v_lifetime
  from public.alpha_tiers t
  where t.min_points <= v_lifetime
  order by t.min_points desc
  limit 1;
end;
$$;

create or replace function public.update_user_streak(
  p_user uuid,
  p_activity_date date default current_date
)
returns table (
  current_streak int,
  longest_streak int,
  bonus_awarded int
)
language plpgsql
security definer
as $$
declare
  v_current int := 0;
  v_longest int := 0;
  v_last date;
  v_bonus int := 0;
begin
  select us.current_streak, us.longest_streak, us.last_activity_date
  into v_current, v_longest, v_last
  from public.user_streaks us
  where us.user_id = p_user;

  if not found then
    v_current := 1;
    v_longest := 1;
    insert into public.user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    values (p_user, v_current, v_longest, p_activity_date)
    on conflict (user_id)
    do update set
      current_streak = excluded.current_streak,
      longest_streak = greatest(public.user_streaks.longest_streak, excluded.longest_streak),
      last_activity_date = excluded.last_activity_date;
  else
    if v_last = p_activity_date then
      null;
    elsif v_last = p_activity_date - 1 then
      v_current := v_current + 1;
    else
      v_current := 1;
    end if;

    v_longest := greatest(v_longest, v_current);

    update public.user_streaks
    set
      current_streak = v_current,
      longest_streak = v_longest,
      last_activity_date = greatest(coalesce(v_last, p_activity_date), p_activity_date)
    where user_id = p_user;
  end if;

  if v_current = 7 then
    v_bonus := 10;
  elsif v_current = 30 then
    v_bonus := 50;
  end if;

  return query
  select v_current, v_longest, v_bonus;
end;
$$;
