"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceArea,
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
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-white p-6 shadow-[var(--shadow-soft)]">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--ink)]">{title}</p>
        <span className="rounded-full border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/10 px-2 py-0.5 text-[10px] font-black text-[var(--accent-green)]">Target zone visible</span>
      </div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

// Chart colors reference the same tokens as the rest of the app
// (--accent-blue for the plotted metric, --accent-green for the "target
// zone" reference band, --ink-soft for axis/label text, --border-hairline
// for gridlines) rather than the raw hex values these three charts used to
// hardcode independently (#0071e3, #5e5e5e, #eff9db, #bff230 — none of
// which trace to any Alpha Focus token; #bff230 in particular was an
// unexplained lime-green half of a gradient with no comprehension purpose).
const AXIS_TICK_STYLE = { fill: "var(--ink-soft)", fontSize: 10, fontWeight: 700 };
const LABEL_STYLE = { fill: "var(--ink-soft)", fontSize: 10, fontWeight: 800 };
const TOOLTIP_STYLE = { borderRadius: "12px", border: "none", boxShadow: "var(--shadow-raised)", fontSize: "12px", fontWeight: "bold" };

export function SeverityTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartCard title="Severity Index">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <ReferenceArea y1={0} y2={35} fill="var(--accent-green)" fillOpacity={0.12} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-hairline)" />
          <XAxis dataKey="label" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ stroke: "var(--accent-blue)", strokeWidth: 1 }}
            formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Severity"]}
          />
          <Line
            type="monotone"
            dataKey="severity"
            stroke="var(--accent-blue)"
            strokeWidth={4}
            dot={{ r: 4, fill: "var(--accent-blue)", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          >
            <LabelList dataKey="severity" position="top" formatter={(value) => `${clampPct(Number(value || 0))}%`} style={LABEL_STYLE} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RoutineAdherenceChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartCard title="Adherence Rate">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <ReferenceArea y1={75} y2={100} fill="var(--accent-green)" fillOpacity={0.12} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-hairline)" />
          <XAxis dataKey="label" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "var(--tint-cool)" }}
            formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Adherence"]}
          />
          <Bar
            dataKey="adherence"
            fill="var(--accent-blue)"
            radius={[6, 6, 0, 0]}
            animationDuration={1500}
            animationEasing="ease-in-out"
          >
            <LabelList dataKey="adherence" position="top" formatter={(value) => `${clampPct(Number(value || 0))}%`} style={LABEL_STYLE} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ConfidenceTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartCard title="Confidence Level">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <ReferenceArea y1={70} y2={100} fill="var(--accent-green)" fillOpacity={0.12} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-hairline)" />
          <XAxis dataKey="label" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ stroke: "var(--accent-blue)", strokeWidth: 1 }}
            formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Confidence"]}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            stroke="var(--accent-blue)"
            strokeWidth={4}
            dot={{ r: 4, fill: "var(--accent-blue)", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          >
            <LabelList dataKey="confidence" position="top" formatter={(value) => `${clampPct(Number(value || 0))}%`} style={LABEL_STYLE} />
          </Line>
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

