-- Hotfix: replace recalculate_integrated_scores with deterministic, ambiguity-safe logic
-- Run in Supabase SQL editor

create or replace function public.recalculate_integrated_scores(
  p_user_id uuid,
  p_category text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category text;
  v_answer_count int;
  v_assessment_completeness int;
  v_has_valid_scan boolean;
  v_severity_score int;
  v_confidence_score int;
  v_recovery_probability int;
  v_risk_level text;
  v_condition_label text;
  v_report_payload jsonb;
begin
  for v_category in
    select distinct c.category
    from (
      select ps.analyzer_category as category
      from public.photo_scans ps
      where ps.user_id = p_user_id
        and ps.analyzer_category is not null
      union
      select aa.category
      from public.assessment_answers aa
      where aa.user_id = p_user_id
        and aa.category is not null
    ) c
    where p_category is null or c.category = p_category
  loop
    select coalesce((
      select count(*)::int
      from jsonb_object_keys(coalesce(aa.answers, '{}'::jsonb)) as k(key)
    ), 0)
      into v_answer_count
    from public.assessment_answers aa
    where aa.user_id = p_user_id
      and aa.category = v_category
    order by aa.completed_at desc nulls last
    limit 1;

    v_answer_count := coalesce(v_answer_count, 0);
    v_assessment_completeness := least(100, greatest(0, v_answer_count * 15));

    select exists(
      select 1
      from public.photo_scans ps
      where ps.user_id = p_user_id
        and ps.analyzer_category = v_category
        and coalesce(ps.image_valid, true) = true
      limit 1
    ) into v_has_valid_scan;

    v_severity_score := greatest(35, least(88, 42 + (v_answer_count * 6) + (case when v_has_valid_scan then 6 else 0 end)));
    v_confidence_score := greatest(45, least(95, 58 + (v_answer_count * 4) + (case when v_has_valid_scan then 8 else 0 end)));
    v_recovery_probability := greatest(35, least(92, 95 - v_severity_score + round(v_assessment_completeness * 0.25)));

    v_risk_level := case
      when v_severity_score >= 75 then 'high'
      when v_severity_score >= 55 then 'moderate'
      else 'low'
    end;

    v_condition_label := case v_category
      when 'acne' then 'Inflammatory Acne Activity'
      when 'dark_circles' then 'Under-eye Stress Pattern'
      when 'hair_loss' then 'Hair Density Stress'
      when 'scalp_health' then 'Scalp Barrier Imbalance'
      when 'beard_growth' then 'Beard Growth Variability'
      when 'body_acne' then 'Body Acne Activity'
      when 'lip_care' then 'Lip Barrier Stress'
      when 'anti_aging' then 'Early Aging Markers'
      else 'Clinical Concern'
    end;

    v_report_payload := jsonb_build_object(
      'insufficient_data', v_assessment_completeness < 60,
      'clinical_overview', jsonb_build_object(
        'primary_condition', v_condition_label,
        'severity_score', v_severity_score,
        'risk_level', v_risk_level,
        'recovery_probability', v_recovery_probability,
        'confidence_pct', v_confidence_score,
        'stage_label', case when v_severity_score >= 75 then 'Stabilization' else 'Optimization' end,
        'clinical_description', 'Deterministic integrated score generated from latest scan and assessment records.'
      ),
      'what_this_means', 'Continue adherence to improve clinical trend quality and recovery velocity.',
      'protocol_30_day', jsonb_build_object(
        'phase_1', 'Stabilize inflammation and triggers',
        'phase_2', 'Rebuild consistency and barrier resilience',
        'phase_3', 'Optimize long-term maintenance'
      ),
      'routine_schedule', jsonb_build_object(
        'morning', 'Cleanse, target active, SPF',
        'night', 'Cleanse, repair active, barrier layer',
        'weekly_reset', 'Review photos and adjust triggers'
      ),
      'product_logic', jsonb_build_object(
        'why_recommended', 'Matched to severity and adherence profile',
        'target_symptom', v_condition_label,
        'timeline_expectation', 'Noticeable change expected in 3-6 weeks with consistency'
      ),
      'risk_if_ignored', 'Low adherence can reduce recovery velocity and increase relapse probability.',
      'performance_metrics', jsonb_build_object(
        'adherence_pct', v_assessment_completeness,
        'projected_recovery_days', greatest(21, least(120, 40 + v_severity_score - round(v_assessment_completeness * 0.2)))
      )
    );

    insert into public.user_category_clinical_scores (
      user_id,
      category,
      severity_score,
      confidence_score,
      risk_level,
      recovery_probability,
      condition_label,
      assessment_completeness,
      domain_scores,
      root_cause_map,
      report_payload,
      updated_at
    )
    values (
      p_user_id,
      v_category,
      v_severity_score,
      v_confidence_score,
      v_risk_level,
      v_recovery_probability,
      v_condition_label,
      v_assessment_completeness,
      '{}'::jsonb,
      '[]'::jsonb,
      v_report_payload,
      now()
    )
    on conflict (user_id, category)
    do update set
      severity_score = excluded.severity_score,
      confidence_score = excluded.confidence_score,
      risk_level = excluded.risk_level,
      recovery_probability = excluded.recovery_probability,
      condition_label = excluded.condition_label,
      assessment_completeness = excluded.assessment_completeness,
      domain_scores = excluded.domain_scores,
      root_cause_map = excluded.root_cause_map,
      report_payload = excluded.report_payload,
      updated_at = now();
  end loop;
end;
$$;

-- Verify compile and execution
select public.recalculate_integrated_scores(auth.uid(), null);
