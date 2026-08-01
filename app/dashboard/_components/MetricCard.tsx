type MetricCardProps = {
  title: string;
  value: string;
  trend?: string;
  tone?: "green" | "amber" | "neutral";
};

const toneClasses = {
  green: "text-[var(--accent-blue)]",
  amber: "text-[var(--ink-soft)]",
  neutral: "text-[var(--ink)]",
};

export default function MetricCard({ title, value, trend, tone = "neutral" }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-[var(--border-hairline)] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-[var(--ink-soft)]">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClasses[tone]}`}>{value}</p>
      {trend ? <p className="mt-1 text-xs text-[var(--ink-soft)]">{trend}</p> : null}
    </article>
  );
}

