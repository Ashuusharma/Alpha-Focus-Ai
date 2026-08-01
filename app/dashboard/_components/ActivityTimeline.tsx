import { Check } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

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
    <section className="af-card p-6">
      <h3 className="text-lg font-bold text-[var(--ink)]">Recent Activity</h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <EmptyState
            icon={<Check className="h-5 w-5" />}
            title="No activity yet"
            description="Complete your first protocol action to see it here."
          />
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-wash-start)] p-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-green)]/20 text-[var(--ink)]">
                <Check className="h-3 w-3" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--ink-soft)]">{humanDateLabel(item.timestamp)}</p>
                <p className="mt-0.5 text-sm font-medium text-[var(--ink)]">{item.label}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
