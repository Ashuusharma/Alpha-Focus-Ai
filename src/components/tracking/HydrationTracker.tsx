"use client";

import { useContext, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { recalculateClinicalScores } from "@/lib/recalculateClinicalScores";

export default function HydrationTracker() {
  const { user } = useContext(AuthContext);
  const [intake, setIntake] = useState(0);
  const [target, setTarget] = useState(3000);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const percent = Math.max(0, Math.min(100, Math.round((intake / Math.max(1, target)) * 100)));
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const saveLog = async () => {
    if (!user) return;

    await supabase.from("routine_logs").upsert(
      {
        user_id: user.id,
        log_date: todayKey,
        hydration_ml: intake,
      },
      { onConflict: "user_id,log_date" }
    );

    await recalculateClinicalScores(user.id);
    await hydrateUserData(user.id);

    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <section className="af-surface-card p-5 text-[#1d1d1f]">
      <h3 className="text-lg font-semibold mb-4">Hydration Tracker</h3>
      <label className="text-sm text-[#6e6e73]">Water Intake (ml)</label>
      <input type="number" min={0} value={intake} onChange={(event) => setIntake(Number(event.target.value))} className="af-input mt-1 mb-3 w-full rounded-xl px-3 py-2" />
      <label className="text-sm text-[#6e6e73]">Daily Target (ml)</label>
      <input type="number" min={500} value={target} onChange={(event) => setTarget(Number(event.target.value))} className="af-input mt-1 mb-3 w-full rounded-xl px-3 py-2" />
      <div className="af-progress-track h-2"><div className="af-progress-fill" style={{ width: `${percent}%` }} /></div>
      <p className="text-sm text-[#0071e3] mt-2">Progress: {percent}%</p>
      <button onClick={saveLog} className="mt-4 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#005bbf] text-sm font-semibold text-white">Save Hydration Entry</button>
      {savedAt && <p className="text-xs text-[#0071e3] mt-2">Saved at {savedAt}</p>}
    </section>
  );
}

