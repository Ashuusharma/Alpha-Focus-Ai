create table if not exists public.user_active_analysis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_category text not null,
  selected_at timestamptz not null default now()
);

alter table if exists public.photo_scans
add column if not exists analyzer_category text,
add column if not exists image_valid boolean default true,
add column if not exists photo_metrics jsonb default '{}'::jsonb,
add column if not exists severity_snapshot int,
add column if not exists inflammation_snapshot int;

alter table if exists public.assessment_answers
add column if not exists category text,
add column if not exists answers jsonb default '{}'::jsonb,
add column if not exists answer_scores jsonb default '[]'::jsonb;

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

create table if not exists public.user_global_domains (
  user_id uuid primary key references auth.users(id) on delete cascade,
  inflammation_load int default 0,
  hormonal_instability int default 0,
  stress_load int default 0,
  sleep_deprivation int default 0,
  barrier_integrity int default 0,
  oxidative_stress int default 0,
  metabolic_load int default 0,
  calculated_at timestamptz default now()
);

create table if not exists public.user_relapse_risk (
  user_id uuid primary key references auth.users(id) on delete cascade,
  relapse_score int default 0,
  risk_level text,
  predicted_trigger text,
  behavior_response text,
  calculated_at timestamptz default now()
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

create or replace function public.get_severity_stage(
  p_category text,
  p_severity_score int
)
returns table (
  stage_label text,
  clinical_description text
)
language plpgsql
as $$
begin
  if p_category = 'acne' then
    if p_severity_score <= 20 then
      return query select 'Clear', 'Minimal inflammatory activity and low relapse burden.';
    elsif p_severity_score <= 40 then
      return query select 'Mild', 'Localized comedonal or low-grade inflammatory pattern.';
    elsif p_severity_score <= 60 then
      return query select 'Moderate', 'Mixed lesion pattern requiring structured correction phase.';
    elsif p_severity_score <= 80 then
      return query select 'Severe', 'High inflammatory burden with elevated post-marking risk.';
    else
      return query select 'Very Severe', 'Diffuse active inflammation with high relapse probability.';
    end if;
  elsif p_category = 'hair_loss' then
    if p_severity_score <= 20 then
      return query select 'Stable', 'No major progression markers in current cycle.';
    elsif p_severity_score <= 40 then
      return query select 'Early Thinning', 'Early miniaturization trend with reversible risk window.';
    elsif p_severity_score <= 60 then
      return query select 'Progressive', 'Visible progression requiring active intervention and adherence.';
    elsif p_severity_score <= 80 then
      return query select 'Advanced', 'Advanced progression with high density preservation urgency.';
    else
      return query select 'High Risk Pattern', 'High-risk progression pattern with strong long-term impact potential.';
    end if;
  elsif p_category = 'scalp_health' then
    if p_severity_score <= 30 then
      return query select 'Balanced', 'Scalp ecosystem currently stable with low inflammatory signal.';
    elsif p_severity_score <= 50 then
      return query select 'Mild Imbalance', 'Mild imbalance in sebum-barrier control requiring stabilization.';
    elsif p_severity_score <= 70 then
      return query select 'Active Inflammation', 'Active inflammatory profile requiring correction phase and trigger control.';
    else
      return query select 'Chronic Condition', 'Persistent inflammatory pattern with high recurrence risk.';
    end if;
  else
    if p_severity_score <= 30 then
      return query select 'Low Activity', 'Current category load is in low-risk range.';
    elsif p_severity_score <= 60 then
      return query select 'Moderate Activity', 'Functional impairment present with controllable risk profile.';
    else
      return query select 'High Activity', 'High burden state requiring strict adherence and close follow-up.';
    end if;
  end if;
end;
$$;

create or replace function public.calculate_category_severity(
  p_user_id uuid,
  p_category text
)
returns table (
  user_id uuid,
  category text,
  severity_score int,
  confidence_score int,
  risk_level text,
  recovery_probability int,
  condition_label text,
  assessment_completeness int,
  sufficient_data boolean,
  domain_scores jsonb,
  root_cause_map jsonb,
  report_payload jsonb
)
language plpgsql
security definer
as $$
declare
  v_scan record;
  v_assessment record;
  v_domains text[];
  v_domain text;
  v_assessment_score numeric;
  v_photo_score numeric;
  v_final_score numeric;
  v_weight numeric;
  v_weighted_sum numeric := 0;
  v_weight_total numeric := 0;
  v_domain_scores jsonb := '{}'::jsonb;
  v_root jsonb := '[]'::jsonb;
  v_total_impact numeric := 0;
  v_condition text := 'Mild Functional Imbalance';
  v_completeness int := 0;
  v_answered int := 0;
  v_questions int := 0;
  v_photo_valid boolean := false;
  v_repeated_scans int := 0;
  v_routine_logs int := 0;
  v_confidence int := 30;
  v_severity int := 0;
  v_risk text := 'Low';
  v_recovery int := 0;
  v_primary_domain text := null;
  v_sufficient boolean := false;
  v_scan_metrics jsonb := '{}'::jsonb;
  v_report jsonb := '{}'::jsonb;
  v_missing_reason text := 'Insufficient structured data to generate clinical protocol.';
  v_global public.user_global_domains%rowtype;
  v_stage_label text;
  v_stage_description text;
  v_inflammation_snapshot int := 0;
begin
  select id, scan_date, image_valid, photo_metrics
  into v_scan
  from public.photo_scans
  where user_id = p_user_id
    and analyzer_category = p_category
    and scan_date >= now() - interval '24 hours'
  order by scan_date desc
  limit 1;

  if found then
    v_photo_valid := coalesce(v_scan.image_valid, false);
    v_scan_metrics := coalesce(v_scan.photo_metrics, '{}'::jsonb);
  end if;

  select id, answer_scores, completed_at
  into v_assessment
  from public.assessment_answers
  where user_id = p_user_id
    and category = p_category
  order by completed_at desc
  limit 1;

  if found then
    select count(*)::int
    into v_questions
    from jsonb_array_elements(coalesce(v_assessment.answer_scores, '[]'::jsonb));

    select count(*)::int
    into v_answered
    from jsonb_array_elements(coalesce(v_assessment.answer_scores, '[]'::jsonb)) elem
    where (elem->>'selected_score') is not null;

    if v_questions > 0 then
      v_completeness := round((v_answered::numeric / v_questions::numeric) * 100)::int;
    end if;
  end if;

  select count(*)::int
  into v_repeated_scans
  from public.photo_scans
  where user_id = p_user_id
    and analyzer_category = p_category
    and image_valid = true;

  select count(*)::int
  into v_routine_logs
  from public.routine_logs
  where user_id = p_user_id
    and created_at >= now() - interval '30 days';

  if p_category = 'scalp_health' then
    v_domains := array['inflammation','sebum_balance','barrier_integrity','shedding_risk','stress_impact','sleep_impact','hygiene_pattern'];
  elsif p_category = 'acne' then
    v_domains := array['inflammatory_load','pore_clogging','hormonal_factor','stress_trigger','diet_trigger','sun_damage','post_acne_marking'];
  elsif p_category = 'dark_circles' then
    v_domains := array['vascular_factor','pigmentation','sleep_deprivation','dehydration','stress_load'];
  elsif p_category = 'hair_loss' then
    v_domains := array['follicle_density','recession_pattern','shedding_rate','hormonal_risk','nutritional_risk','stress_factor'];
  elsif p_category = 'beard_growth' then
    v_domains := array['patchiness','density','ingrown_risk','irritation_level','grooming_pattern'];
  elsif p_category = 'body_acne' then
    v_domains := array['sweat_load','friction_irritation','bacterial_risk','hygiene_pattern'];
  elsif p_category = 'lip_care' then
    v_domains := array['dryness_index','pigmentation','sun_exposure','hydration_level'];
  else
    v_domains := array['wrinkle_depth','elasticity_loss','sun_exposure','collagen_decline','stress_oxidation'];
  end if;

  foreach v_domain in array v_domains loop
    select coalesce(
      round(
        100 * (
          sum(((elem->>'selected_score')::numeric) * coalesce((elem->>'weight')::numeric, 1)) /
          nullif(sum(4 * coalesce((elem->>'weight')::numeric, 1)), 0)
        )
      ),
      0
    )
    into v_assessment_score
    from jsonb_array_elements(coalesce(v_assessment.answer_scores, '[]'::jsonb)) elem
    where elem->>'domain' = v_domain
      and (elem->>'selected_score') is not null;

    v_assessment_score := coalesce(v_assessment_score, 0);

    if p_category = 'scalp_health' then
      if v_domain = 'inflammation' then v_photo_score := coalesce((v_scan_metrics->>'redness_score')::numeric, 0);
      elsif v_domain = 'sebum_balance' then v_photo_score := coalesce((v_scan_metrics->>'oil_reflectance')::numeric, 0);
      elsif v_domain = 'barrier_integrity' then v_photo_score := coalesce((v_scan_metrics->>'flake_density')::numeric, 0);
      elsif v_domain = 'shedding_risk' then v_photo_score := 100 - coalesce((v_scan_metrics->>'hair_density')::numeric, 50);
      else v_photo_score := 50;
      end if;
    elsif p_category = 'acne' then
      if v_domain = 'inflammatory_load' then v_photo_score := coalesce((v_scan_metrics->>'redness_intensity')::numeric, 0);
      elsif v_domain = 'pore_clogging' then v_photo_score := coalesce((v_scan_metrics->>'pore_visibility')::numeric, 0);
      elsif v_domain = 'sun_damage' then v_photo_score := coalesce((v_scan_metrics->>'pigmentation_index')::numeric, 0);
      elsif v_domain = 'post_acne_marking' then v_photo_score := coalesce((v_scan_metrics->>'pigmentation_index')::numeric, 0);
      else v_photo_score := 50;
      end if;
    elsif p_category = 'dark_circles' then
      if v_domain = 'pigmentation' then v_photo_score := coalesce((v_scan_metrics->>'marker_1')::numeric, 0);
      elsif v_domain = 'vascular_factor' then v_photo_score := coalesce((v_scan_metrics->>'marker_2')::numeric, 0);
      else v_photo_score := coalesce((v_scan_metrics->>'marker_3')::numeric, 50);
      end if;
    else
      v_photo_score := coalesce((v_scan_metrics->>'marker_1')::numeric, 50);
    end if;

    v_final_score := round((v_assessment_score * 0.6) + (v_photo_score * 0.4));

    v_weight := case
      when v_domain in ('inflammation','inflammatory_load','follicle_density','wrinkle_depth') then 1.35
      when v_domain in ('sebum_balance','pore_clogging','recession_pattern','elasticity_loss') then 1.2
      else 1
    end;

    v_weighted_sum := v_weighted_sum + (v_final_score * v_weight);
    v_weight_total := v_weight_total + v_weight;

    v_domain_scores := jsonb_set(
      v_domain_scores,
      array[v_domain],
      to_jsonb(round(v_final_score)::int),
      true
    );
  end loop;

  if v_weight_total > 0 then
    v_severity := least(100, greatest(0, round(v_weighted_sum / v_weight_total)::int));
  end if;

  select * into v_global from public.user_global_domains where user_id = p_user_id;
  if p_category = 'acne'
     and coalesce(v_global.hormonal_instability, 0) > 70
     and coalesce(v_global.metabolic_load, 0) > 60 then
    v_severity := least(100, round(v_severity * 1.15)::int);
  end if;

  v_confidence := 30;
  if v_photo_valid then v_confidence := v_confidence + 20; end if;
  if v_completeness > 80 then v_confidence := v_confidence + 20; end if;
  if v_routine_logs > 5 then v_confidence := v_confidence + 15; end if;
  if v_repeated_scans > 1 then v_confidence := v_confidence + 15; end if;
  v_confidence := least(100, greatest(0, v_confidence));

  if v_severity >= 75 then
    v_risk := 'High';
  elsif v_severity >= 45 then
    v_risk := 'Moderate';
  else
    v_risk := 'Low';
  end if;

  v_recovery := least(95, greatest(20, 100 - v_severity + (v_completeness / 5)));

  if p_category = 'scalp_health' then
    if coalesce((v_domain_scores->>'inflammation')::int,0) > 70 and coalesce((v_scan_metrics->>'flake_density')::int,0) > 60 then
      v_condition := 'Active Seborrheic Dermatitis Pattern';
    elsif coalesce((v_domain_scores->>'inflammation')::int,0) > 50 and coalesce((v_domain_scores->>'stress_impact')::int,0) > 60 then
      v_condition := 'Stress-Triggered Scalp Flare';
    elsif coalesce((v_domain_scores->>'sebum_balance')::int,0) > 70 and coalesce((v_domain_scores->>'inflammation')::int,0) < 30 then
      v_condition := 'Oily Imbalance Without Inflammation';
    else
      v_condition := 'Mild Barrier Dysfunction';
    end if;
  elsif p_category = 'acne' then
    if coalesce((v_domain_scores->>'inflammatory_load')::int,0) > 70 and coalesce((v_domain_scores->>'hormonal_factor')::int,0) > 60 then
      v_condition := 'Hormonal Inflammatory Acne';
    elsif coalesce((v_domain_scores->>'pore_clogging')::int,0) > 70 and coalesce((v_scan_metrics->>'oiliness_index')::int,0) > 60 then
      v_condition := 'Comedonal Acne Dominance';
    elsif coalesce((v_scan_metrics->>'pigmentation_index')::int,0) > 60 and coalesce((v_scan_metrics->>'active_lesion_count')::int,0) < 20 then
      v_condition := 'Post-Acne Hyperpigmentation Dominant';
    else
      v_condition := 'Mixed Acne Pattern';
    end if;
  end if;

  select s.stage_label, s.clinical_description
  into v_stage_label, v_stage_description
  from public.get_severity_stage(p_category, v_severity) s;

  if not v_photo_valid or v_completeness < 60 or v_scan.id is null then
    v_sufficient := false;
    v_condition := 'Insufficient structured data to generate clinical protocol.';
    v_report := jsonb_build_object(
      'insufficient_data', true,
      'message', 'Insufficient structured data to generate clinical protocol.'
    );
  else
    v_sufficient := true;

    select key
    into v_primary_domain
    from jsonb_each_text(v_domain_scores)
    order by (value::int) desc
    limit 1;

    select coalesce(sum((value::int)), 0)
    into v_total_impact
    from jsonb_each_text(v_domain_scores);

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'domain', key,
          'score', value::int,
          'impact_pct', case when v_total_impact > 0 then round((value::numeric * 100.0) / v_total_impact)::int else 0 end
        )
        order by value::int desc
      ),
      '[]'::jsonb
    )
    into v_root
    from jsonb_each_text(v_domain_scores);

    v_report := jsonb_build_object(
      'clinical_overview', jsonb_build_object(
        'primary_condition', v_condition,
        'severity_score', v_severity,
        'risk_level', v_risk,
        'recovery_probability', v_recovery,
        'confidence_pct', v_confidence,
        'stage_label', v_stage_label,
        'clinical_description', v_stage_description
      ),
      'root_cause_map', v_root,
      'what_this_means', format(
        'Current pattern indicates %s as dominant driver with weighted severity %s/100. Stage: %s. %s',
        coalesce(replace(v_primary_domain, '_', ' '), 'clinical load'),
        v_severity,
        coalesce(v_stage_label, 'Unstaged'),
        coalesce(v_stage_description, 'Clinical monitoring required.')
      ),
      'protocol_30_day', jsonb_build_object(
        'phase_1', 'Stabilize barrier and inflammation load in first 10 days.',
        'phase_2', 'Correct dominant domain dysfunction through targeted care from day 11 to day 20.',
        'phase_3', 'Reinforce maintenance with relapse prevention from day 21 to day 30.'
      ),
      'routine_schedule', jsonb_build_object(
        'morning', 'Cleanse, targeted active, protection.',
        'night', 'Repair cleanse, correction active, barrier restore.',
        'weekly_reset', 'One weekly review: scan trend, adherence, trigger control.'
      ),
      'product_logic', jsonb_build_object(
        'why_recommended', format('Recommendations prioritize %s and %s based on top weighted impact.',
          coalesce(replace(v_primary_domain, '_', ' '), 'primary domain'),
          coalesce((v_root->1->>'domain')::text, 'secondary domain')
        ),
        'target_symptom', v_condition,
        'timeline_expectation', 'Visible trend shift usually begins within 2-4 weeks with adherence >=80%.'
      ),
      'risk_if_ignored', 'Ignoring persistent triggers may increase chronicity, deeper inflammation, and slower recovery cycles.',
      'performance_metrics', jsonb_build_object(
        'adherence_pct', least(100, v_routine_logs * 10),
        'projected_recovery_days', greatest(21, 90 - v_recovery)
      )
    );
  end if;

  v_inflammation_snapshot := greatest(
    coalesce((v_domain_scores->>'inflammation')::int, 0),
    coalesce((v_domain_scores->>'inflammatory_load')::int, 0),
    coalesce((v_domain_scores->>'stress_oxidation')::int, 0)
  );

  if v_scan.id is not null then
    update public.photo_scans
    set
      severity_snapshot = v_severity,
      inflammation_snapshot = v_inflammation_snapshot
    where id = v_scan.id;
  end if;

  insert into public.user_category_clinical_scores (
    user_id,
    category,
    severity_score,
    confidence_score,
    risk_level,
    recovery_probability,
    condition_label,
    stage_label,
    stage_description,
    assessment_completeness,
    primary_domain,
    domain_scores,
    root_cause_map,
    report_payload,
    updated_at
  )
  values (
    p_user_id,
    p_category,
    v_severity,
    v_confidence,
    v_risk,
    v_recovery,
    v_condition,
    v_stage_label,
    v_stage_description,
    v_completeness,
    v_primary_domain,
    v_domain_scores,
    v_root,
    v_report,
    now()
  )
  on conflict (user_id, category)
  do update
  set
    severity_score = excluded.severity_score,
    confidence_score = excluded.confidence_score,
    risk_level = excluded.risk_level,
    recovery_probability = excluded.recovery_probability,
    condition_label = excluded.condition_label,
    stage_label = excluded.stage_label,
    stage_description = excluded.stage_description,
    assessment_completeness = excluded.assessment_completeness,
    primary_domain = excluded.primary_domain,
    domain_scores = excluded.domain_scores,
    root_cause_map = excluded.root_cause_map,
    report_payload = excluded.report_payload,
    updated_at = now();

  return query
  select
    p_user_id,
    p_category,
    v_severity,
    v_confidence,
    v_risk,
    v_recovery,
    v_condition,
    v_completeness,
    v_sufficient,
    v_domain_scores,
    v_root,
    v_report;
end;
$$;

create or replace function public.aggregate_global_domains(
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_inflammation int := 0;
  v_hormonal int := 0;
  v_stress int := 0;
  v_sleep int := 0;
  v_barrier int := 0;
  v_oxidative int := 0;
  v_metabolic int := 0;
begin
  select coalesce(round(avg(greatest(
    coalesce((domain_scores->>'inflammation')::int, 0),
    coalesce((domain_scores->>'inflammatory_load')::int, 0)
  )))::int, 0)
  into v_inflammation
  from public.user_category_clinical_scores
  where user_id = p_user_id;

  select coalesce(round(avg(greatest(
    coalesce((domain_scores->>'hormonal_factor')::int, 0),
    coalesce((domain_scores->>'hormonal_risk')::int, 0)
  )))::int, 0)
  into v_hormonal
  from public.user_category_clinical_scores
  where user_id = p_user_id;

  select coalesce(round(avg(greatest(
    coalesce((domain_scores->>'stress_impact')::int, 0),
    coalesce((domain_scores->>'stress_trigger')::int, 0),
    coalesce((domain_scores->>'stress_load')::int, 0),
    coalesce((domain_scores->>'stress_factor')::int, 0),
    coalesce((domain_scores->>'stress_oxidation')::int, 0)
  )))::int, 0)
  into v_stress
  from public.user_category_clinical_scores
  where user_id = p_user_id;

  select coalesce(round(avg(greatest(
    coalesce((domain_scores->>'sleep_impact')::int, 0),
    coalesce((domain_scores->>'sleep_deprivation')::int, 0)
  )))::int, 0)
  into v_sleep
  from public.user_category_clinical_scores
  where user_id = p_user_id;

  select coalesce(round(avg(greatest(
    coalesce((domain_scores->>'barrier_integrity')::int, 0),
    coalesce((domain_scores->>'dryness_index')::int, 0)
  )))::int, 0)
  into v_barrier
  from public.user_category_clinical_scores
  where user_id = p_user_id;

  select coalesce(round(avg(greatest(
    coalesce((domain_scores->>'sun_damage')::int, 0),
    coalesce((domain_scores->>'sun_exposure')::int, 0),
    coalesce((domain_scores->>'stress_oxidation')::int, 0)
  )))::int, 0)
  into v_oxidative
  from public.user_category_clinical_scores
  where user_id = p_user_id;

  select coalesce(round(avg(greatest(
    coalesce((domain_scores->>'diet_trigger')::int, 0),
    coalesce((domain_scores->>'metabolic_load')::int, 0),
    coalesce((domain_scores->>'nutritional_risk')::int, 0)
  )))::int, 0)
  into v_metabolic
  from public.user_category_clinical_scores
  where user_id = p_user_id;

  if v_stress > 70 and v_sleep > 60 then
    v_inflammation := least(100, round(v_inflammation * 1.10)::int);
  end if;

  insert into public.user_global_domains (
    user_id,
    inflammation_load,
    hormonal_instability,
    stress_load,
    sleep_deprivation,
    barrier_integrity,
    oxidative_stress,
    metabolic_load,
    calculated_at
  )
  values (
    p_user_id,
    v_inflammation,
    v_hormonal,
    v_stress,
    v_sleep,
    v_barrier,
    v_oxidative,
    v_metabolic,
    now()
  )
  on conflict (user_id)
  do update set
    inflammation_load = excluded.inflammation_load,
    hormonal_instability = excluded.hormonal_instability,
    stress_load = excluded.stress_load,
    sleep_deprivation = excluded.sleep_deprivation,
    barrier_integrity = excluded.barrier_integrity,
    oxidative_stress = excluded.oxidative_stress,
    metabolic_load = excluded.metabolic_load,
    calculated_at = now();
end;
$$;

create or replace function public.calculate_progress_trend(
  p_user_id uuid,
  p_category text
)
returns void
language plpgsql
security definer
as $$
declare
  v_first_severity int := 0;
  v_latest_severity int := 0;
  v_first_inflammation int := 0;
  v_latest_inflammation int := 0;
  v_count int := 0;
  v_improvement int := 0;
  v_inflammation_reduction int := 0;
  v_direction text := 'stable';
  v_message text := 'Progress is stable. Continue protocol adherence.';
  v_days int := 21;
  v_consistency int := 0;
  v_discipline int := 0;
  v_recovery_velocity int := 0;
  v_confidence int := 0;
begin
  with scans as (
    select
      severity_snapshot,
      inflammation_snapshot,
      scan_date,
      row_number() over(order by scan_date desc) as rn_desc,
      row_number() over(order by scan_date asc) as rn_asc
    from public.photo_scans
    where user_id = p_user_id
      and analyzer_category = p_category
      and severity_snapshot is not null
    order by scan_date desc
    limit 5
  )
  select
    coalesce(max(case when rn_asc = 1 then severity_snapshot end), 0),
    coalesce(max(case when rn_desc = 1 then severity_snapshot end), 0),
    coalesce(max(case when rn_asc = 1 then inflammation_snapshot end), 0),
    coalesce(max(case when rn_desc = 1 then inflammation_snapshot end), 0),
    count(*)::int,
    greatest(1, extract(day from (max(scan_date) - min(scan_date)))::int)
  into
    v_first_severity,
    v_latest_severity,
    v_first_inflammation,
    v_latest_inflammation,
    v_count,
    v_days
  from scans;

  if v_count > 1 and v_first_severity > 0 then
    v_improvement := round(((v_first_severity - v_latest_severity)::numeric / v_first_severity::numeric) * 100)::int;
  end if;

  if v_count > 1 and v_first_inflammation > 0 then
    v_inflammation_reduction := round(((v_first_inflammation - v_latest_inflammation)::numeric / v_first_inflammation::numeric) * 100)::int;
  end if;

  if v_improvement > 15 then
    v_direction := 'improving';
    v_message := format('You reduced inflammation by %s%% in %s days.', greatest(0, v_inflammation_reduction), v_days);
  elsif v_improvement < -5 then
    v_direction := 'worsening';
    v_message := 'Recent stress spike detected. Prevent flare-up by increasing recovery focus.';
  end if;

  select coalesce(round(avg((coalesce((am_done)::int, 0) + coalesce((pm_done)::int, 0)) * 50.0))::int, 0)
  into v_consistency
  from public.routine_logs
  where user_id = p_user_id
    and created_at >= now() - interval '14 days';

  v_discipline := greatest(0, least(100, v_consistency));
  v_recovery_velocity := greatest(0, round((greatest(v_improvement, 0)::numeric / greatest(v_days, 1)::numeric) * 30)::int);

  select coalesce(confidence_score, 0)
  into v_confidence
  from public.user_category_clinical_scores
  where user_id = p_user_id and category = p_category;

  insert into public.user_progress_metrics (
    user_id,
    category,
    scans_count,
    first_severity,
    latest_severity,
    improvement_pct,
    inflammation_reduction_rate,
    consistency_score,
    recovery_velocity,
    discipline_index,
    confidence_score,
    trend_direction,
    trend_message,
    updated_at
  )
  values (
    p_user_id,
    p_category,
    v_count,
    v_first_severity,
    v_latest_severity,
    v_improvement,
    v_inflammation_reduction,
    v_consistency,
    v_recovery_velocity,
    v_discipline,
    v_confidence,
    v_direction,
    v_message,
    now()
  )
  on conflict (user_id, category)
  do update set
    scans_count = excluded.scans_count,
    first_severity = excluded.first_severity,
    latest_severity = excluded.latest_severity,
    improvement_pct = excluded.improvement_pct,
    inflammation_reduction_rate = excluded.inflammation_reduction_rate,
    consistency_score = excluded.consistency_score,
    recovery_velocity = excluded.recovery_velocity,
    discipline_index = excluded.discipline_index,
    confidence_score = excluded.confidence_score,
    trend_direction = excluded.trend_direction,
    trend_message = excluded.trend_message,
    updated_at = now();
end;
$$;

create or replace function public.calculate_relapse_risk(
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_adherence int := 0;
  v_stress int := 0;
  v_sleep_dep int := 0;
  v_inflammation_trend int := 0;
  v_streak_break boolean := false;
  v_score int := 0;
  v_level text := 'Low';
  v_trigger text := 'Routine variability';
  v_response text := 'Maintain current protocol consistency.';
begin
  select coalesce(round(avg((coalesce((am_done)::int, 0) + coalesce((pm_done)::int, 0)) * 50.0))::int, 0)
  into v_adherence
  from public.routine_logs
  where user_id = p_user_id
    and created_at >= now() - interval '14 days';

  select
    coalesce(stress_load, 0),
    coalesce(sleep_deprivation, 0)
  into v_stress, v_sleep_dep
  from public.user_global_domains
  where user_id = p_user_id;

  with t as (
    select avg(case when improvement_pct < 0 then abs(improvement_pct) else 0 end) as worsening
    from public.user_progress_metrics
    where user_id = p_user_id
      and updated_at >= now() - interval '30 days'
  )
  select coalesce(round(worsening)::int, 0)
  into v_inflammation_trend
  from t;

  select exists (
    select 1
    from public.user_streaks
    where user_id = p_user_id
      and (last_activity_date is null or last_activity_date < current_date - 1)
  )
  into v_streak_break;

  v_score := round(
    (100 - v_adherence) * 0.4 +
    v_stress * 0.2 +
    v_sleep_dep * 0.2 +
    v_inflammation_trend * 0.2
  )::int;

  if v_streak_break then
    v_score := least(100, v_score + 10);
  end if;

  if v_score <= 30 then
    v_level := 'Low';
    v_trigger := 'Minor adherence drift';
    v_response := 'Current trajectory is stable. Maintain routine consistency.';
  elsif v_score <= 60 then
    v_level := 'Moderate';
    v_trigger := 'Stress and sleep inconsistency';
    v_response := 'Increase sleep regularity and daily completion discipline this week.';
  else
    v_level := 'High';
    v_trigger := 'Stress spike with falling recovery behavior';
    v_response := 'Your stress levels are rising. Increase hydration and sleep priority this week.';
  end if;

  insert into public.user_relapse_risk (
    user_id,
    relapse_score,
    risk_level,
    predicted_trigger,
    behavior_response,
    calculated_at
  )
  values (
    p_user_id,
    v_score,
    v_level,
    v_trigger,
    v_response,
    now()
  )
  on conflict (user_id)
  do update set
    relapse_score = excluded.relapse_score,
    risk_level = excluded.risk_level,
    predicted_trigger = excluded.predicted_trigger,
    behavior_response = excluded.behavior_response,
    calculated_at = now();
end;
$$;

create or replace function public.recalculate_integrated_scores(
  p_user_id uuid,
  p_category text default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_category text;
begin
  if p_category is not null then
    perform 1 from public.calculate_category_severity(p_user_id, p_category);
    perform public.aggregate_global_domains(p_user_id);
    if p_category = 'acne' then
      perform 1 from public.calculate_category_severity(p_user_id, p_category);
    end if;
    perform public.calculate_progress_trend(p_user_id, p_category);
    perform public.calculate_relapse_risk(p_user_id);
    return;
  end if;

  for v_category in
    select distinct category from (
      select analyzer_category as category
      from public.photo_scans
      where user_id = p_user_id
        and analyzer_category is not null
      union
      select category
      from public.assessment_answers
      where user_id = p_user_id
        and category is not null
    ) q
  loop
    perform 1 from public.calculate_category_severity(p_user_id, v_category);
  end loop;

  perform public.aggregate_global_domains(p_user_id);

  perform 1 from public.calculate_category_severity(p_user_id, 'acne');

  for v_category in
    select distinct category
    from public.user_category_clinical_scores
    where user_id = p_user_id
  loop
    perform public.calculate_progress_trend(p_user_id, v_category);
  end loop;

  perform public.calculate_relapse_risk(p_user_id);
end;
$$;
