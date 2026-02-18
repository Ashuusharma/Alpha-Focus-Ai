"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export interface ProgressPoint {
  date: string;
  score: number;
}

interface ProgressChartProps {
  data: ProgressPoint[];
}

export default function ProgressChart({ data }: ProgressChartProps) {
  return (
    <section className="bg-surface border border-white/10 rounded-3xl p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white">Alpha Score Progress</h3>
        <p className="text-sm text-gray-400">Date vs Alpha Score</p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 4 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="4 4" />
            <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ stroke: "#3B82F6", strokeOpacity: 0.3 }}
              contentStyle={{
                background: "#0F1A2B",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "#F8FAFC",
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ r: 3, fill: "#2563EB" }}
              activeDot={{ r: 5, fill: "#60A5FA" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
