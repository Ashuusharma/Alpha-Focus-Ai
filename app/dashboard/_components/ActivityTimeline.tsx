type TimelineItem = {
  id: string;
  label: string;
  timestamp: string;
};

type ActivityTimelineProps = {
  items: TimelineItem[];
};

function humanDateLabel(iso: string) {
  const day = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(day);
  that.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - that.getTime()) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

export default function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <section className="af-card rounded-2xl p-6">
      <h3 className="text-lg font-bold text-[#1F3D2B]">Activity Timeline</h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-[#6B665D]">No activity yet. Complete your first protocol action.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3">
              <p className="text-xs font-semibold text-[#8C6A5A]">{humanDateLabel(item.timestamp)}</p>
              <p className="mt-1 text-sm font-medium text-[#1F3D2B]">✔ {item.label}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}