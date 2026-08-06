import { AlertTriangle, Info, CheckCircle2, type LucideIcon } from "lucide-react";

export type AICardImpact = "high" | "medium" | "low";

type AICardProps = {
  title: string;
  message: string;
  actions?: string[];
  expectedOutcome?: string;
  impact: AICardImpact;
};

const IMPACT_META: Record<AICardImpact, { icon: LucideIcon; accent: string; badgeBg: string; badgeText: string; label: string }> = {
  high: { icon: AlertTriangle, accent: "var(--danger)", badgeBg: "bg-[var(--danger)]/10", badgeText: "text-[var(--danger)]", label: "Needs attention" },
  medium: { icon: Info, accent: "var(--accent-amber)", badgeBg: "bg-[var(--accent-amber)]/10", badgeText: "text-[var(--accent-amber)]", label: "Worth noting" },
  low: { icon: CheckCircle2, accent: "var(--accent-green)", badgeBg: "bg-[var(--accent-green)]/10", badgeText: "text-[var(--accent-green)]", label: "On track" },
};

/**
 * One AI Coach insight — formalizes AIInsightEngine's old flat cards
 * (raw Tailwind red-50/amber-50/green-50, no icon, no real token usage)
 * into a real accent-bordered card using the app's actual danger/amber/
 * green tokens, with an icon carrying the tone instead of a text label.
 */
export default function AICard({ title, message, actions, expectedOutcome, impact }: AICardProps) {
  const meta = IMPACT_META[impact];
  const Icon = meta.icon;

  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-white p-4" style={{ borderLeftWidth: 3, borderLeftColor: meta.accent }}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.badgeBg}`}>
          <Icon className={`h-4 w-4 ${meta.badgeText}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wide ${meta.badgeText}`}>{meta.label}</p>
          <p className="mt-0.5 text-sm font-bold text-[var(--ink)]">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-soft)]">{message}</p>

          {actions && actions.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {actions.map((action) => (
                <li key={action} className="flex items-start gap-1.5 text-xs text-[var(--ink-soft)]">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--ink-soft)]" />
                  {action}
                </li>
              ))}
            </ul>
          )}

          {expectedOutcome && (
            <p className="mt-2.5 rounded-lg bg-[var(--tint-cool)] px-2.5 py-1.5 text-[11px] leading-relaxed text-[var(--ink)]">
              <span className="font-bold">Expect: </span>
              {expectedOutcome}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
