"use client";

import { supabase } from "@/lib/supabaseClient";
import { useUserStore } from "@/stores/useUserStore";

const coreHydrationCache = new Map<string, { ts: number; profile: any; alphaSummary: any }>();
const CACHE_TTL_MS = 60_000;

export async function hydrateCoreUserData(userId: string) {
  const { setProfile, setAlphaSummary, markHydrated } = useUserStore.getState();

  const cached = coreHydrationCache.get(userId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    setProfile(cached.profile);
    setAlphaSummary(cached.alphaSummary);
    markHydrated(userId);
    return;
  }

  const [profileRes, alphaRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("alpha_sikka_summary").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const profile = profileRes.data || null;
  const alphaSummary = alphaRes.data || null;

  setProfile(profile);
  setAlphaSummary(alphaSummary);
  markHydrated(userId);

  coreHydrationCache.set(userId, {
    ts: Date.now(),
    profile,
    alphaSummary,
  });
}
