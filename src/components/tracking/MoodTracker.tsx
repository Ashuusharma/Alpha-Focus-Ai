"use client";

import { useContext, useMemo, useState } from "react";
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
    <section className="af-surface-card p-5 text-[#1F3D2B]">
      <h3 className="text-lg font-semibold mb-4">Mood / Stress Tracker</h3>
      <div className="flex gap-2 flex-wrap">
        {(["calm", "neutral", "stressed"] as Mood[]).map((option) => (
          <button key={option} onClick={() => setMood(option)} className={`px-4 py-2 rounded-xl border text-sm font-semibold ${mood === option ? "bg-[#2F6F57] border-[#2F6F57] text-white" : "bg-[#f6f0e5] border-[#e2d8ca] text-[#6B665D] hover:bg-white"}`}>
            {option[0].toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
      <button onClick={saveLog} className="mt-4 px-4 py-2 rounded-xl bg-[#2F6F57] hover:bg-[#275c48] text-sm font-semibold text-white">Save Mood Entry</button>
      {savedAt && <p className="text-xs text-[#2F6F57] mt-2">Saved at {savedAt}</p>}
    </section>
  );
}
