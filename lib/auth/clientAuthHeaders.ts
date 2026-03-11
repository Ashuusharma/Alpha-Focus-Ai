"use client";

import { supabase } from "@/lib/supabaseClient";

export async function getSupabaseAuthHeaders(base: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...base };
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
