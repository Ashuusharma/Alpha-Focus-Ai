import { CalendarDays, ShieldCheck, Sparkles, Target } from "lucide-react";
import Hero from "@/components/ui/Hero";
import Button from "@/components/ui/Button";

function getCategoryLabel(category: string | null) {
  if (!category) return null;
  return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// A transparent, deterministic label for the current week — the same kind
// of real-data bucketing already used elsewhere (Dashboard's Reset/Repair/
// Stabilize phases from day number), not a fabricated metric. No numeric
// "confidence score" is shown anywhere in this hero: the report schema has
// no such field (only textual confidenceNotes, already shown in real form
// inside Primary Findings) — inventing one here would violate the
// standing "never fabricate confidence" rule.
const WEEK_PHASE_LABEL: Record<number, string> = {
  1: "Foundation",
  2: "Building",
  3: "Refining",
  4: "Stabilizing",
};

export default function ProtocolHeader({
  category,
  level,
  currentDay,
  currentWeek,
  todaysFocus,
}: {
  category: string | null;
  level: string | null;
  currentDay: number | null;
  currentWeek: number | null;
  /** Real title of the first scheduled morning routine step for today —
   *  omitted entirely (not stubbed) when the plan has no morning steps. */
  todaysFocus: string | null;
}) {
  const categoryLabel = getCategoryLabel(category);
  const progress = currentDay && currentWeek ? { day: currentDay, week: currentWeek } : null;

  return (
    <div id="overview" className="scroll-mt-24">
      <Hero
        layout="center"
        kicker={
          <>
            <ShieldCheck className="h-3.5 w-3.5" /> Single Source Clinical Result
          </>
        }
        title={
          <>
            Your Recovery Protocol
            {categoryLabel && <><br /><span className="text-[var(--accent-green)]">{categoryLabel}</span></>}
          </>
        }
        subtitle={`A structured, personalized plan built from your analyzer scan and clinical assessment.${level ? ` Paced for the ${level} recovery track.` : ""}`}
        stats={[
          ...(progress
            ? [
                { icon: <CalendarDays className="h-4 w-4" />, label: "Progress", value: `Day ${progress.day} of 30` },
                { icon: <Target className="h-4 w-4" />, label: "Phase", value: WEEK_PHASE_LABEL[progress.week] || `Week ${progress.week}` },
              ]
            : []),
          ...(todaysFocus
            ? [{ icon: <Sparkles className="h-4 w-4" />, label: "Today's Focus", value: todaysFocus, wide: true }]
            : []),
        ]}
        cta={
          <>
            <Button
              variant="primary"
              onClick={() => document.getElementById("routine")?.scrollIntoView({ behavior: "smooth" })}
            >
              View Today&apos;s Routine
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
            >
              Shop Recommended Products
            </Button>
          </>
        }
      />
    </div>
  );
}
