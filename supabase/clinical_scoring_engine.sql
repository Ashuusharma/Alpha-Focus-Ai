create table if not exists public.user_clinical_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  severity_score int not null default 0,
  inflammation_index int not null default 0,
  barrier_damage int not null default 0,
  hormonal_risk int not null default 0,
  recovery_probability int not null default 0,
  adherence_score int not null default 0,
  confidence_score int not null default 0,
  calculated_at timestamptz not null default now()
);

alter table public.user_clinical_scores
add column if not exists lifestyle_risk int default 0,
add column if not exists hormonal_index int default 0,
add column if not exists scan_inflammation int default 0,
add column if not exists stress_index int default 0,
add column if not exists sleep_quality_index int default 0,
add column if not exists confidence_level int default 60;

alter table public.user_clinical_scores enable row level security;

drop policy if exists "clinical_select_own" on public.user_clinical_scores;
create policy "clinical_select_own"
on public.user_clinical_scores
for select
using (auth.uid() = user_id);

drop policy if exists "clinical_upsert_own" on public.user_clinical_scores;
create policy "clinical_upsert_own"
on public.user_clinical_scores
for insert
with check (auth.uid() = user_id);

drop policy if exists "clinical_update_own" on public.user_clinical_scores;
create policy "clinical_update_own"
on public.user_clinical_scores
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.calculate_clinical_scores(p_user uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_severity int := 0;
  v_lifestyle int := 0;
  v_hormonal int := 0;
  v_stress int := 0;
  v_sleep int := 0;
  v_scan int := 0;
  v_adherence int := 0;
  v_final int := 0;
begin
  select coalesce(sum(answer_value * 5),0)
  into v_severity
  from assessment_answers
  where user_id = p_user
  and category = 'severity';

  select coalesce(sum(answer_value * 4),0)
  into v_hormonal
  from assessment_answers
  where user_id = p_user
  and category = 'hormonal';

  select coalesce(avg(answer_value) * 6,0)::int
  into v_stress
  from assessment_answers
  where user_id = p_user
  and category = 'stress';

  select coalesce(avg(answer_value) * 5,0)::int
  into v_sleep
  from assessment_answers
  where user_id = p_user
  and category = 'sleep';

  select coalesce(avg(inflammation_score),0)::int
  into v_scan
  from photo_scans
  where user_id = p_user;

  select count(*) * 2
  into v_adherence
  from routine_logs
  where user_id = p_user
  and created_at > now() - interval '7 days';

  v_lifestyle := v_stress + v_sleep;

  v_final := least(greatest(
      v_severity + v_hormonal + v_lifestyle + v_scan - v_adherence
  ,0),100);

  insert into user_clinical_scores (
    user_id,
    severity_score,
    lifestyle_risk,
    hormonal_index,
    scan_inflammation,
    stress_index,
    sleep_quality_index,
    recovery_probability,
    adherence_score,
    confidence_level
  )
  values (
    p_user,
    v_final,
    v_lifestyle,
    v_hormonal,
    v_scan,
    v_stress,
    v_sleep,
    greatest(100 - v_final + v_adherence,0),
    v_adherence,
    75
  )
  on conflict (user_id)
  do update set
    severity_score = excluded.severity_score,
    lifestyle_risk = excluded.lifestyle_risk,
    hormonal_index = excluded.hormonal_index,
    scan_inflammation = excluded.scan_inflammation,
    stress_index = excluded.stress_index,
    sleep_quality_index = excluded.sleep_quality_index,
    recovery_probability = excluded.recovery_probability,
    adherence_score = excluded.adherence_score,
    confidence_level = excluded.confidence_level,
    calculated_at = now();
end;
$$;
