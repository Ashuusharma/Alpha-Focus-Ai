import { CalendarDays, ShieldCheck, Sparkles } from "lucide-react";
import StatChip from "@/components/ui/StatChip";

function getCategoryLabel(category: string | null) {
  if (!category) return null;
  return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProtocolHeader({
  category,
  level,
  currentDay,
  currentWeek,
}: {
  category: string | null;
  level: string | null;
  currentDay: number | null;
  currentWeek: number | null;
}) {
  const categoryLabel = getCategoryLabel(category);
  const progress = currentDay && currentWeek ? { day: currentDay, week: currentWeek } : null;

  return (
    <section id="overview" className="af-hero-dark scroll-mt-24 p-6 md:p-10">
      <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--accent-blue)]">
        <ShieldCheck className="h-3.5 w-3.5" />
        Single Source Clinical Result
      </p>
      <h1 className="mt-3 text-3xl font-extrabold text-white md:text-4xl">
        Your Recovery Protocol{categoryLabel ? ` — ${categoryLabel}` : ""}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[#b7c4d7]">
        A structured, personalized plan built from your analyzer scan and clinical assessment.
        {level ? ` Paced for the ${level} recovery track.` : ""}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {progress && (
          <StatChip
            icon={<CalendarDays className="h-4 w-4" />}
            value={`Day ${progress.day} of 30`}
            label={`Week ${progress.week} of 4`}
          />
        )}
        <StatChip icon={<Sparkles className="h-4 w-4" />} value="AI + Clinical" label="Structured server report" />
      </div>
    </section>
  );
}
