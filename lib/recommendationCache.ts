import { supabase } from "@/lib/supabaseClient";

export type RecommendationCache = {
  actionPlan: {
    morning: string[];
    night: string[];
    lifestyle: string[];
  };
  motivation: string[];
};

export async function getCachedRecommendation(userId: string) {
  const { data, error } = await supabase
    .from("user_ai_recommendations")
    .select("recommendation_blob,generated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const generatedAt = new Date(data.generated_at || 0);
  const isFresh = Number.isFinite(generatedAt.getTime())
    ? Date.now() - generatedAt.getTime() < 7 * 24 * 60 * 60 * 1000
    : false;

  return {
    blob: (data.recommendation_blob || null) as RecommendationCache | null,
    generatedAt: data.generated_at as string,
    isFresh,
  };
}

export async function upsertRecommendationCache(userId: string, payload: RecommendationCache) {
  await supabase.from("user_ai_recommendations").upsert(
    {
      user_id: userId,
      recommendation_blob: payload,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}
