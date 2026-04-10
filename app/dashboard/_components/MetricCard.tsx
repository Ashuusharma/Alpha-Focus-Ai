type MetricCardProps = {
  title: string;
  value: string;
  trend?: string;
  tone?: "green" | "amber" | "neutral";
};

const toneClasses = {
  green: "text-[#0071e3]",
  amber: "text-[#6e6e73]",
  neutral: "text-[#1d1d1f]",
};

export default function MetricCard({ title, value, trend, tone = "neutral" }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-[#d9d9de] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-[#6e6e73]">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClasses[tone]}`}>{value}</p>
      {trend ? <p className="mt-1 text-xs text-[#6e6e73]">{trend}</p> : null}
    </article>
  );
}

