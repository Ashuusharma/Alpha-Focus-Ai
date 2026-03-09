"use client";

import { supabase } from "@/lib/supabaseClient";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getConditionLabel(category: string) {
  const map: Record<string, string> = {
    acne: "Inflammatory Acne Activity",
    dark_circles: "Under-eye Stress Pattern",
    hair_loss: "Hair Density Stress",
    scalp_health: "Scalp Barrier Imbalance",
    beard_growth: "Beard Growth Variability",
    body_acne: "Body Acne Activity",
    lip_care: "Lip Barrier Stress",
    anti_aging: "Early Aging Markers",
  };
  return map[category] || "Clinical Concern";
}

async function upsertFallbackClinicalScore(userId: string, category: string) {
  const [{ data: assessment }, { data: latestScan }] = await Promise.all([
    supabase
      .from("assessment_answers")
      .select("answers,completed_at")
      .eq("user_id", userId)
      .eq("category", category)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("photo_scans")
      .select("scan_date,image_valid")
      .eq("user_id", userId)
      .eq("analyzer_category", category)
      .order("scan_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const answers = (assessment?.answers || {}) as Record<string, string>;
  const answerCount = Object.keys(answers).length;
  const assessmentCompleteness = clamp(answerCount * 15, 0, 100);
  const hasValidScan = latestScan?.image_valid !== false && Boolean(latestScan?.scan_date);

  const severityScore = clamp(42 + answerCount * 6 + (hasValidScan ? 6 : 0), 35, 88);
  const confidenceScore = clamp(58 + answerCount * 4 + (hasValidScan ? 8 : 0), 45, 95);
  const recoveryProbability = clamp(95 - severityScore + Math.round(assessmentCompleteness * 0.25), 35, 92);

  const riskLevel = severityScore >= 75
    ? "high"
    : severityScore >= 55
      ? "moderate"
      : "low";

  const reportPayload = {
    insufficient_data: assessmentCompleteness < 60,
    clinical_overview: {
      primary_condition: getConditionLabel(category),
      severity_score: severityScore,
      risk_level: riskLevel,
      recovery_probability: recoveryProbability,
      confidence_pct: confidenceScore,
      stage_label: severityScore >= 75 ? "Stabilization" : "Optimization",
      clinical_description: "Fallback deterministic score generated from latest scan + assessment inputs.",
    },
    what_this_means: "Continue your category protocol consistently to improve week-over-week clinical metrics.",
    protocol_30_day: {
      phase_1: "Stabilize inflammation and triggers",
      phase_2: "Rebuild barrier and consistency",
      phase_3: "Optimize long-term maintenance",
    },
    routine_schedule: {
      morning: "Cleanse, target active, SPF",
      night: "Cleanse, repair active, barrier layer",
      weekly_reset: "Review progress photo and trigger adherence",
    },
    product_logic: {
      why_recommended: "Matched to your severity and behavior profile",
      target_symptom: getConditionLabel(category),
      timeline_expectation: "Meaningful changes expected within 3-6 weeks with adherence",
    },
    risk_if_ignored: "Inconsistent routine can slow recovery velocity and increase relapse risk.",
    performance_metrics: {
      adherence_pct: assessmentCompleteness,
      projected_recovery_days: clamp(40 + severityScore - Math.round(assessmentCompleteness * 0.2), 21, 120),
    },
  };

  const { error: fallbackUpsertError } = await supabase.from("user_category_clinical_scores").upsert({
    user_id: userId,
    category,
    severity_score: severityScore,
    confidence_score: confidenceScore,
    risk_level: riskLevel,
    recovery_probability: recoveryProbability,
    condition_label: getConditionLabel(category),
    assessment_completeness: assessmentCompleteness,
    domain_scores: {},
    root_cause_map: [],
    report_payload: reportPayload,
    updated_at: new Date().toISOString(),
  });

  if (fallbackUpsertError) {
    console.warn("Fallback clinical score upsert failed:", fallbackUpsertError.message);
  }
}

export async function recalculateClinicalScores(userId: string, category?: string) {
  const { error } = await supabase.rpc("recalculate_integrated_scores", {
    p_user_id: userId,
    p_category: category || null,
  });

  if (error && category) {
    console.warn("recalculate_integrated_scores failed, using fallback scorer:", error.message);
    await upsertFallbackClinicalScore(userId, category);
  }
}
