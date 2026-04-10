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
      <h3 className="text-lg font-bold text-[#1d1d1f]">Activity Timeline</h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-[#6e6e73]">No activity yet. Complete your first protocol action.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#d9d9de] bg-[#F8F6F3] p-3">
              <p className="text-xs font-semibold text-[#6e6e73]">{humanDateLabel(item.timestamp)}</p>
              <p className="mt-1 text-sm font-medium text-[#1d1d1f]">âœ” {item.label}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
