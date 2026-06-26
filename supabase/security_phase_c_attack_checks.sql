-- Phase C: Reward abuse checks and race-condition verification queries.
-- Run in Supabase SQL editor.

-- 1) Duplicate reference replay attempts should be blocked by unique index.
select
  user_id,
  reference_id,
  count(*) as duplicate_count
from public.alpha_sikka_transactions
where reference_id is not null
group by user_id, reference_id
having count(*) > 1
order by duplicate_count desc;

-- 2) Duplicate action/date claims should be blocked.
select
  user_id,
  action_code,
  activity_date,
  count(*) as duplicate_count
from public.alpha_sikka_transactions
where action_code is not null
  and activity_date is not null
group by user_id, action_code, activity_date
having count(*) > 1
order by duplicate_count desc;

-- 3) Rapid request pattern (>= 6 tx in same minute) by user.
select
  user_id,
  date_trunc('minute', created_at) as minute_bucket,
  count(*) as tx_count
from public.alpha_sikka_transactions
group by user_id, date_trunc('minute', created_at)
having count(*) >= 6
order by tx_count desc, minute_bucket desc;

-- 4) Execution sessions with suspiciously low duration.
select
  user_id,
  reference_id,
  expected_duration_sec,
  extract(epoch from (coalesce(completed_at, now()) - started_at))::int as elapsed_sec,
  status,
  started_at,
  completed_at
from public.execution_task_sessions
where status = 'completed'
  and extract(epoch from (coalesce(completed_at, now()) - started_at)) < greatest(60, least(expected_duration_sec, 300))
order by started_at desc;

-- 5) Concurrent session starts for same user/task core/day.
select
  user_id,
  category,
  day_number,
  task_core_id,
  count(*) as sessions
from public.execution_task_sessions
group by user_id, category, day_number, task_core_id
having count(*) > 1
order by sessions desc;
