"use client";

import { supabase } from "@/lib/supabaseClient";
import { toAlphaWalletSummary } from "@/lib/alphaWallet";
import { useUserStore } from "@/stores/useUserStore";
import {
  applyCachedUserData,
  isUserCacheFresh,
  writeUserDataCache,
  type HydratedPayload,
} from "@/lib/userDataCache";

type HydrateOptions = {
  force?: boolean;
  silent?: boolean;
  minIntervalMs?: number;
};

const inFlightByUser = new Map<string, Promise<void>>();
const lastHydrationByUser = new Map<string, number>();

export async function hydrateUserData(userId: string, options: HydrateOptions = {}) {
  const { force = false, silent = false, minIntervalMs = 12_000 } = options;
  const { setUserData } = useUserStore.getState();
  const now = Date.now();
  const lastHydrated = lastHydrationByUser.get(userId) ?? 0;

  if (!force && inFlightByUser.has(userId)) {
    return inFlightByUser.get(userId);
  }

  if (!force && now - lastHydrated < minIntervalMs) {
    return;
  }

  const state = useUserStore.getState();
  const hasInMemoryData =
    Boolean(state.profile) ||
    state.assessments.length > 0 ||
    state.reports.length > 0 ||
    state.routines.length > 0;

  if (!force && !hasInMemoryData) {
    applyCachedUserData(userId);
  }

  const cacheFresh = !force && isUserCacheFresh(userId);
  if (cacheFresh) {
    return;
  }

  if (!silent && !hasInMemoryData && !cacheFresh) {
    setUserData({ loading: true });
  }

  const request = (async () => {
    try {
      const [profile, alpha, alphaStreak, alphaTransactions, assessments, reports, routines, scans, clinicalScores, challenges, products] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("alpha_sikka_summary").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("user_streaks").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("alpha_sikka_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
        supabase.from("assessment_answers").select("*").eq("user_id", userId).order("completed_at", { ascending: false }),
        supabase.from("clinical_reports").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("routine_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false }),
        supabase.from("photo_scans").select("*").eq("user_id", userId).order("scan_date", { ascending: false }),
        supabase.from("user_clinical_scores").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("challenge_progress").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
        supabase.from("product_recommendations").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      const payload: HydratedPayload = {
        profile: profile.data ?? null,
        alphaSummary: alpha.data ? (toAlphaWalletSummary(alpha.data) as unknown as Record<string, unknown>) : null,
        alphaStreak: alphaStreak.data ?? null,
        alphaTransactions: alphaTransactions.data ?? [],
        assessments: assessments.data ?? [],
        reports: reports.data ?? [],
        routines: routines.data ?? [],
        scans: scans.data ?? [],
        clinicalScores: clinicalScores.data ?? null,
        challenges: challenges.data ?? [],
        products: products.data ?? [],
      };

      setUserData({
        ...payload,
        loading: false,
      });

      writeUserDataCache(userId, payload);
      lastHydrationByUser.set(userId, Date.now());
    } catch {
      setUserData({ loading: false });
    } finally {
      inFlightByUser.delete(userId);
    }
  })();

  inFlightByUser.set(userId, request);
  return request;
}
