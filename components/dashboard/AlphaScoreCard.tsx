"use client";

import { calculateAlphaScore, AlphaScoreInput } from "@/lib/calculateAlphaScore";

interface AlphaScoreCardProps {
  data: AlphaScoreInput;
  monthlyDelta: number;
}

function CircularProgress({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
      <div className="relative w-16 h-16 shrink-0">
        <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
          <circle cx="32" cy="32" r={radius} stroke="rgba(148,163,184,0.25)" strokeWidth="6" fill="none" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="url(#alphaProgressGradient)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id="alphaProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{safeValue}%</div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-sm text-gray-200">Performance</p>
      </div>
    </div>
  );
}

export default function AlphaScoreCard({ data, monthlyDelta }: AlphaScoreCardProps) {
  const alphaScore = calculateAlphaScore(data);

  return (
    <section className="bg-surface border border-white/10 rounded-3xl p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm text-gray-400 uppercase tracking-wider">Alpha Score</p>
          <h3 className="text-3xl font-bold text-white mt-1">{alphaScore} / 100</h3>
        </div>
        <span className="px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-semibold">
          {monthlyDelta >= 0 ? `+${monthlyDelta}` : monthlyDelta} this month
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <CircularProgress label="Skin" value={data.skinScore || 0} />
        <CircularProgress label="Hair" value={data.hairScore || 0} />
        <CircularProgress label="Lifestyle" value={data.lifestyleScore || 0} />
        <CircularProgress label="Consistency" value={data.streakScore || 0} />
      </div>
    </section>
  );
}
