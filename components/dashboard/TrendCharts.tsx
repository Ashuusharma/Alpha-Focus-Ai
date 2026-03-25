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
    <div className="rounded-[1.8rem] border border-[#E2DDD3] bg-[#FFFDFC] p-6 shadow-[0_10px_24px_rgba(17,17,17,0.04)] hover:shadow-[0_16px_30px_rgba(17,17,17,0.08)] transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-[#1F3D2B]">{title}</p>
        <span className="text-[10px] font-black text-[#2F6F57] bg-[#E8F4EE] px-2 py-0.5 rounded-full border border-[#C8DACF]">You improved +8% this week</span>
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
              <stop offset="5%" stopColor="#A04747" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#A04747" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1ECE3" />
          <XAxis dataKey="label" tick={{ fill: "#8C6A5A", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8C6A5A", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
            cursor={{ stroke: '#E2DDD3', strokeWidth: 1 }}
            formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Severity"]} 
          />
          <Line 
            type="monotone" 
            dataKey="severity" 
            stroke="#A04747" 
            strokeWidth={4} 
            dot={{ r: 4, fill: '#A04747', strokeWidth: 2, stroke: '#fff' }} 
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
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
              <stop offset="5%" stopColor="#2F6F57" stopOpacity={1}/>
              <stop offset="95%" stopColor="#1F3D2B" stopOpacity={1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1ECE3" />
          <XAxis dataKey="label" tick={{ fill: "#8C6A5A", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8C6A5A", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
            cursor={{ fill: '#F8F7F4' }}
            formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Adherence"]} 
          />
          <Bar 
            dataKey="adherence" 
            fill="url(#colorAdherence)" 
            radius={[6, 6, 0, 0]} 
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
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
              <stop offset="5%" stopColor="#2F6F57" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2F6F57" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1ECE3" />
          <XAxis dataKey="label" tick={{ fill: "#8C6A5A", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8C6A5A", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
            cursor={{ stroke: '#E2DDD3', strokeWidth: 1 }}
            formatter={(value) => [`${clampPct(Number(value || 0))}%`, "Confidence"]} 
          />
          <Line 
            type="monotone" 
            dataKey="confidence" 
            stroke="#2F6F57" 
            strokeWidth={4} 
            dot={{ r: 4, fill: '#2F6F57', strokeWidth: 2, stroke: '#fff' }} 
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
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
