"use client";

import { supabase } from "@/lib/supabaseClient";

type UserStateRow = {
  user_id: string;
  state_key: string;
  state_blob: string;
};

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function readUserState<T>(userId: string, stateKey: string): Promise<T | null> {
  const { data, error } = await supabase
    .from("user_app_state")
    .select("user_id,state_key,state_blob")
    .eq("user_id", userId)
    .eq("state_key", stateKey)
    .maybeSingle<UserStateRow>();

  if (error || !data?.state_blob) return null;

  try {
    return JSON.parse(data.state_blob) as T;
  } catch {
    return null;
  }
}

export async function writeUserState<T>(userId: string, stateKey: string, value: T): Promise<void> {
  await supabase.from("user_app_state").upsert(
    {
      user_id: userId,
      state_key: stateKey,
      state_blob: JSON.stringify(value),
    },
    { onConflict: "user_id,state_key" }
  );
}
