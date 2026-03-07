"use client";

import { supabase } from "@/lib/supabaseClient";

export async function recalculateClinicalScores(userId: string, category?: string) {
  await supabase.rpc("recalculate_integrated_scores", {
    p_user_id: userId,
    p_category: category || null,
  });
}
