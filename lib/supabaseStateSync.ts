"use client";

import { supabase } from "@/lib/supabaseClient";

type CloudStateRow = {
  user_id: string;
  state_key: string;
  state_blob: string;
  updated_at?: string;
};

export const SYNCABLE_LOCAL_KEYS = [
  "oneman_cart_store_v2",
  "oneman-wishlist",
  "oneman-ingredient-blacklist",
  "oneman-photo-gallery",
  "oneman_preferences",
  "oneman-theme",
  "oneman-language",
  "oneman_scan_history",
] as const;

export async function syncLocalKeyWithSupabase(userId: string, localKey: string) {
  if (typeof window === "undefined") return;

  const localBlob = localStorage.getItem(localKey);

  const { data: cloudRow, error: cloudReadError } = await supabase
    .from("user_app_state")
    .select("user_id,state_key,state_blob,updated_at")
    .eq("user_id", userId)
    .eq("state_key", localKey)
    .maybeSingle<CloudStateRow>();

  if (cloudReadError) {
    return;
  }

  if (!cloudRow && localBlob !== null) {
    await supabase.from("user_app_state").upsert(
      {
        user_id: userId,
        state_key: localKey,
        state_blob: localBlob,
      },
      { onConflict: "user_id,state_key" }
    );
    return;
  }

  if (cloudRow && typeof cloudRow.state_blob === "string") {
    if (localBlob !== cloudRow.state_blob) {
      localStorage.setItem(localKey, cloudRow.state_blob);
    }
  }
}

export async function syncAllLocalStateWithSupabase(userId: string) {
  for (const key of SYNCABLE_LOCAL_KEYS) {
    await syncLocalKeyWithSupabase(userId, key);
  }
}

export async function pushLocalKeyToSupabase(userId: string, localKey: string) {
  if (typeof window === "undefined") return;
  const localBlob = localStorage.getItem(localKey);
  if (localBlob === null) return;

  await supabase.from("user_app_state").upsert(
    {
      user_id: userId,
      state_key: localKey,
      state_blob: localBlob,
    },
    { onConflict: "user_id,state_key" }
  );
}