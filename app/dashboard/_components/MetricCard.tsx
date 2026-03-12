type MetricCardProps = {
  title: string;
  value: string;
  trend?: string;
  tone?: "green" | "amber" | "neutral";
};

const toneClasses = {
  green: "text-[#2F6F57]",
  amber: "text-[#8C6A5A]",
  neutral: "text-[#1F3D2B]",
};

export default function MetricCard({ title, value, trend, tone = "neutral" }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-[#E2DDD3] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-[#6B665D]">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClasses[tone]}`}>{value}</p>
      {trend ? <p className="mt-1 text-xs text-[#6B665D]">{trend}</p> : null}
    </article>
  );
}
