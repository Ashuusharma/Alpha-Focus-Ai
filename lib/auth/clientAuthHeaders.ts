"use client";

import { supabase } from "@/lib/supabaseClient";

export async function getSupabaseAuthHeaders(base: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...base };
  let { data } = await supabase.auth.getSession();
  const expiresAtMs = (data.session?.expires_at || 0) * 1000;

  if (expiresAtMs && expiresAtMs - Date.now() < 2 * 60 * 1000) {
    const refreshed = await supabase.auth.refreshSession();
    if (!refreshed.error) {
      data = refreshed.data;
    }
  }

  const token = data.session?.access_token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
