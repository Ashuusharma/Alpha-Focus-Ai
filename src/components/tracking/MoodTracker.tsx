"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { recalculateClinicalScores } from "@/lib/recalculateClinicalScores";

type Mood = "calm" | "neutral" | "stressed";

export default function MoodTracker() {
  const { user } = useContext(AuthContext);
  const [mood, setMood] = useState<Mood>("neutral");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const loadToday = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("routine_logs")
        .select("stress_level")
        .eq("user_id", user.id)
        .eq("log_date", todayKey)
        .maybeSingle();

      if (typeof data?.stress_level !== "number") return;
      if (data.stress_level <= 3) setMood("calm");
      else if (data.stress_level >= 7) setMood("stressed");
      else setMood("neutral");
    };

    void loadToday();
  }, [todayKey, user?.id]);

  const saveLog = async () => {
    if (!user) return;

    const stressLevel = mood === "calm" ? 2 : mood === "neutral" ? 5 : 8;

    await supabase.from("routine_logs").upsert(
      {
        user_id: user.id,
        log_date: todayKey,
        stress_level: stressLevel,
      },
      { onConflict: "user_id,log_date" }
    );

    await recalculateClinicalScores(user.id);
    await hydrateUserData(user.id);

    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <section className="af-surface-card p-5 text-[#1d1d1f]">
      <h3 className="text-lg font-semibold mb-4">Mood / Stress Tracker</h3>
      <div className="flex gap-2 flex-wrap">
        {(["calm", "neutral", "stressed"] as Mood[]).map((option) => (
          <button key={option} onClick={() => setMood(option)} className={`px-4 py-2 rounded-xl border text-sm font-semibold ${mood === option ? "bg-[#0071e3] border-[#0071e3] text-white" : "bg-[#f6f0e5] border-[#e2d8ca] text-[#6e6e73] hover:bg-white"}`}>
            {option[0].toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
      <button onClick={saveLog} className="mt-4 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#005bbf] text-sm font-semibold text-white">Save Mood Entry</button>
      {savedAt && <p className="text-xs text-[#0071e3] mt-2">Saved at {savedAt}</p>}
    </section>
  );
}

