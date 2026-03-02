"use client";

import { supabase } from "@/lib/supabaseClient";
import { useUserStore } from "@/stores/useUserStore";

export async function hydrateUserData(userId: string) {
  const { setUserData } = useUserStore.getState();

  setUserData({ loading: true });

  const [profile, alpha, assessments, reports, routines, scans, challenges, products] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("alpha_sikka_summary").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("assessment_answers").select("*").eq("user_id", userId).order("completed_at", { ascending: false }),
    supabase.from("clinical_reports").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("routine_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false }),
    supabase.from("photo_scans").select("*").eq("user_id", userId).order("scan_date", { ascending: false }),
    supabase.from("challenge_progress").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("product_recommendations").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  setUserData({
    profile: profile.data ?? null,
    alphaSummary: alpha.data ?? null,
    assessments: assessments.data ?? [],
    reports: reports.data ?? [],
    routines: routines.data ?? [],
    scans: scans.data ?? [],
    challenges: challenges.data ?? [],
    products: products.data ?? [],
    loading: false,
  });
}
