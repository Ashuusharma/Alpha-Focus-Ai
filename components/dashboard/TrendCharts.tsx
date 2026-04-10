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
    <div className="relative overflow-hidden border border-[#5e5e5e] bg-[#ffffff] p-6 shadow-[0_0_5px_rgba(0,0,0,0.3)]">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-[#000000]">{title}</p>
        <span className="text-[10px] font-black text-[#0b0f0c] bg-[#eff9db] px-2 py-0.5 border border-[#0071e3]">Target zone visible</span>
      </div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

export function SeverityTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartCard title="Severity Index">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0071e3" stopOpacity={0.22}/>
              <stop offset="95%" stopColor="#0071e3" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <ReferenceArea y1={0} y2={35} fill="#eff9db" fillOpacity={0.9} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis dataKey="label" tick={{ fill: "#5e5e5e", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#5e5e5e", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
            cursor={{ stroke: '#0071e3', strokeWidth: 1 }}
            formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Severity"]} 
          />
          <Line 
            type="monotone" 
            dataKey="severity" 
            stroke="#0071e3" 
            strokeWidth={4} 
            dot={{ r: 4, fill: '#0071e3', strokeWidth: 2, stroke: '#fff' }} 
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          >
            <LabelList dataKey="severity" position="top" formatter={(value) => `${clampPct(Number(value || 0))}%`} style={{ fill: "#5e5e5e", fontSize: 10, fontWeight: 800 }} />
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
          <defs>
            <linearGradient id="colorAdherence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#bff230" stopOpacity={1}/>
              <stop offset="95%" stopColor="#0071e3" stopOpacity={1}/>
            </linearGradient>
          </defs>
          <ReferenceArea y1={75} y2={100} fill="#eff9db" fillOpacity={0.9} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis dataKey="label" tick={{ fill: "#5e5e5e", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#5e5e5e", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
            cursor={{ fill: '#f6fbe9' }}
            formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Adherence"]} 
          />
          <Bar 
            dataKey="adherence" 
            fill="url(#colorAdherence)" 
            radius={[6, 6, 0, 0]} 
            animationDuration={1500}
            animationEasing="ease-in-out"
          >
            <LabelList dataKey="adherence" position="top" formatter={(value) => `${clampPct(Number(value || 0))}%`} style={{ fill: "#5e5e5e", fontSize: 10, fontWeight: 800 }} />
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
          <defs>
            <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0071e3" stopOpacity={0.22}/>
              <stop offset="95%" stopColor="#0071e3" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <ReferenceArea y1={70} y2={100} fill="#eff9db" fillOpacity={0.9} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis dataKey="label" tick={{ fill: "#5e5e5e", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#5e5e5e", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
            cursor={{ stroke: '#0071e3', strokeWidth: 1 }}
            formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Confidence"]} 
          />
          <Line 
            type="monotone" 
            dataKey="confidence" 
            stroke="#0071e3" 
            strokeWidth={4} 
            dot={{ r: 4, fill: '#0071e3', strokeWidth: 2, stroke: '#fff' }} 
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          >
            <LabelList dataKey="confidence" position="top" formatter={(value) => `${clampPct(Number(value || 0))}%`} style={{ fill: "#5e5e5e", fontSize: 10, fontWeight: 800 }} />
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

