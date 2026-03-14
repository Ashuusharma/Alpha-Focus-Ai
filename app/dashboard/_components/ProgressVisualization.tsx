"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

type WeeklyPoint = {
  week: string;
  severity: number;
  adherence: number;
  confidence: number;
};

type ProgressVisualizationProps = {
  data: WeeklyPoint[];
};

function clampPct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function ProgressVisualization({ data }: ProgressVisualizationProps) {
  const safe = (data.length ? data : [
    { week: "W1", severity: 0, adherence: 0, confidence: 0 },
    { week: "W2", severity: 0, adherence: 0, confidence: 0 },
    { week: "W3", severity: 0, adherence: 0, confidence: 0 },
    { week: "W4", severity: 0, adherence: 0, confidence: 0 },
  ]).map((row) => ({
    week: row.week,
    severity: clampPct(row.severity),
    adherence: clampPct(row.adherence),
    confidence: clampPct(row.confidence),
  }));

  return (
    <section className="af-card rounded-2xl p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A]">Progress Visualization</p>
          <h3 className="text-lg font-bold text-[#1F3D2B]">Week 1 to Week 4 Improvement</h3>
        </div>
        <p className="text-xs text-[#6B665D]">Severity, adherence, confidence</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3">
          <p className="text-xs font-semibold text-[#1F3D2B]">Severity Trend (lower is better)</p>
          <div className="mt-2 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safe} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D7" />
                <XAxis dataKey="week" tick={{ fill: "#6B665D", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B665D", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Severity"]} />
                <Line type="monotone" dataKey="severity" stroke="#A04747" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3">
          <p className="text-xs font-semibold text-[#1F3D2B]">Routine Adherence + Confidence</p>
          <div className="mt-2 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safe} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D7" />
                <XAxis dataKey="week" tick={{ fill: "#6B665D", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B665D", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip formatter={(value, key) => [`${clampPct(Number(value || 0))}%`, key === "adherence" ? "Adherence" : "Confidence"]} />
                <Bar dataKey="adherence" fill="#2F6F57" radius={[6, 6, 0, 0]} />
                <Bar dataKey="confidence" fill="#8C6A5A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
