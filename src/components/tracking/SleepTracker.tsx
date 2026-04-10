"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { recalculateClinicalScores } from "@/lib/recalculateClinicalScores";

export default function SleepTracker() {
  const { user } = useContext(AuthContext);
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState(3);
  const [bedtime, setBedtime] = useState("23:00");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const loadToday = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("routine_logs")
        .select("sleep_hours,stress_level")
        .eq("user_id", user.id)
        .eq("log_date", todayKey)
        .maybeSingle();

      if (typeof data?.sleep_hours === "number") {
        setHours(data.sleep_hours);
      }

      if (typeof data?.stress_level === "number") {
        const inferredQuality = Math.max(1, Math.min(5, 6 - data.stress_level));
        setQuality(inferredQuality);
      }
    };

    void loadToday();
  }, [todayKey, user?.id]);

  const saveLog = async () => {
    if (!user) return;

    await supabase.from("routine_logs").upsert(
      {
        user_id: user.id,
        log_date: todayKey,
        sleep_hours: hours,
        stress_level: Math.max(1, 6 - quality),
      },
      { onConflict: "user_id,log_date" }
    );

    await recalculateClinicalScores(user.id);
    await hydrateUserData(user.id);

    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <section className="af-surface-card p-5 text-[#1d1d1f]">
      <h3 className="text-lg font-semibold mb-4">Sleep Tracker</h3>
      <label className="text-sm text-[#6e6e73]">Hours Slept</label>
      <input type="number" min={0} max={14} value={hours} onChange={(event) => setHours(Number(event.target.value))} className="af-input mt-1 mb-3 w-full rounded-xl px-3 py-2" />
      <label className="text-sm text-[#6e6e73]">Bedtime</label>
      <input type="time" value={bedtime} onChange={(event) => setBedtime(event.target.value)} className="af-input mt-1 mb-3 w-full rounded-xl px-3 py-2" />
      <label className="text-sm text-[#6e6e73]">Sleep Quality (1-5)</label>
      <input type="range" min={1} max={5} value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="w-full mt-2" />
      <p className="text-sm text-[#0071e3] mt-1">Selected quality: {quality}/5</p>
      <button onClick={saveLog} className="mt-4 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#005bbf] text-sm font-semibold text-white">Save Sleep Entry</button>
      {savedAt && <p className="text-xs text-[#0071e3] mt-2">Saved at {savedAt}</p>}
    </section>
  );
}


