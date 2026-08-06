"use client";

import { Sparkles } from "lucide-react";
import AICard from "@/components/ui/AICard";

type InsightItem = {
  id: string;
  title: string;
  message: string;
  actions?: string[];
  expectedOutcome?: string;
  impact: "high" | "medium" | "low";
};

type AIInsightEngineProps = {
  insights: InsightItem[];
  behaviorInsights?: string[];
};

export default function AIInsightEngine({ insights, behaviorInsights = [] }: AIInsightEngineProps) {
  return (
    <section className="rounded-[2rem] border border-[var(--border-hairline)] bg-white p-6 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--accent-blue)]" />
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink-soft)]">AI Coach</p>
          <h3 className="text-lg font-black text-[var(--ink)]">What we&apos;re noticing</h3>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {insights.map((insight) => (
          <AICard
            key={insight.id}
            title={insight.title}
            message={insight.message}
            actions={insight.actions}
            expectedOutcome={insight.expectedOutcome}
            impact={insight.impact}
          />
        ))}
      </div>

      {behaviorInsights.length > 0 && (
        <div className="mt-4 rounded-[1.4rem] border border-[var(--border-hairline)] bg-[var(--tint-warm)] p-4">
          <p className="text-xs font-semibold text-[var(--ink)]">Behavior patterns</p>
          <ul className="mt-2 space-y-1.5">
            {behaviorInsights.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-xs text-[var(--ink-soft)]">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--ink-soft)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
