"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendPoint = {
  label: string;
  severity: number;
  adherence: number;
  confidence: number;
};

type ChartCardProps = {
  title: string;
  children: React.ReactNode;
};

type TrendChartsProps = {
  data: TrendPoint[];
};

function clampPct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3">
      <p className="text-xs font-semibold text-[#1F3D2B]">{title}</p>
      <div className="mt-2 h-52 w-full">{children}</div>
    </div>
  );
}

export function SeverityTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartCard title="Severity Trend (lower is better)">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D7" />
          <XAxis dataKey="label" tick={{ fill: "#6B665D", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6B665D", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Severity"]} />
          <Line type="monotone" dataKey="severity" stroke="#A04747" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RoutineAdherenceChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartCard title="Routine Adherence">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D7" />
          <XAxis dataKey="label" tick={{ fill: "#6B665D", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6B665D", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Adherence"]} />
          <Bar dataKey="adherence" fill="#2F6F57" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ConfidenceTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartCard title="Confidence Score Trend">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D7" />
          <XAxis dataKey="label" tick={{ fill: "#6B665D", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6B665D", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Confidence"]} />
          <Line type="monotone" dataKey="confidence" stroke="#8C6A5A" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default function TrendCharts({ data }: TrendChartsProps) {
  const safeData = (data.length
    ? data
    : [
        { label: "W1", severity: 0, adherence: 0, confidence: 0 },
        { label: "W2", severity: 0, adherence: 0, confidence: 0 },
        { label: "W3", severity: 0, adherence: 0, confidence: 0 },
        { label: "W4", severity: 0, adherence: 0, confidence: 0 },
      ]
  ).map((row) => ({
    label: row.label,
    severity: clampPct(row.severity),
    adherence: clampPct(row.adherence),
    confidence: clampPct(row.confidence),
  }));

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      <SeverityTrendChart data={safeData} />
      <RoutineAdherenceChart data={safeData} />
      <ConfidenceTrendChart data={safeData} />
    </div>
  );
}
