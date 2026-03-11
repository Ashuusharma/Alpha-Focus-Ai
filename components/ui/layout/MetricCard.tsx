export function MetricCard({ title, value, change, label }: { title: string, value: string, change: string, label?: string }) {
  const isPositive = change.startsWith('+');
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
      <div className="text-zinc-400 text-sm font-medium mb-2">{title}</div>
      <div className="flex items-end gap-3 mb-1">
        <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
      </div>
      <div className="flex items-center gap-2 mt-auto">
        <span className={`text-xs font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '↑' : '↓'} {change.replace(/[+-]/, '')}
        </span>
        {label && <span className="text-xs text-zinc-500">{label}</span>}
      </div>
    </div>
  );
}
