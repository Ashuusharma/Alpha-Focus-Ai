import { CheckCircle2, Circle } from "lucide-react";
import MedicalCard from "@/components/ui/MedicalCard";

type RoutineItem = {
  id: string;
  label: string;
  completed: boolean;
};

type RoutineTrackerProps = {
  items?: RoutineItem[];
};

const defaultItems: RoutineItem[] = [
  { id: "am", label: "AM Routine", completed: true },
  { id: "pm", label: "PM Routine", completed: true },
  { id: "hydration", label: "Hydration", completed: true },
  { id: "sleep", label: "Sleep: 7h", completed: true },
  { id: "workout", label: "Workout", completed: false },
];

export default function RoutineTracker({ items = defaultItems }: RoutineTrackerProps) {
  const completedCount = items.filter((item) => item.completed).length;
  const completionPercent = Math.round((completedCount / items.length) * 100);

  return (
    <MedicalCard className="p-6">
      <div className="mb-4 flex items-end justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Routine Tracker</h3>
        <p className="metric-number text-xl text-accent-emerald">{completionPercent}%</p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8E3DA]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${completionPercent >= 70 ? "bg-medical-gradient" : "bg-gradient-to-r from-[#C9A227] to-[#E6C65C]"}`}
          style={{ width: `${completionPercent}%` }}
          aria-hidden="true"
        />
      </div>

      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-xl border border-[#DDD7CC] bg-[#F7F4EE] px-4 py-3">
            <div className="flex items-center gap-3">
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-clinical-success" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4 text-text-muted" aria-hidden="true" />
              )}
              <span className="text-sm text-text-primary">{item.label}</span>
            </div>
            <span className={`text-xs font-medium ${item.completed ? "text-clinical-success" : "text-text-muted"}`}>
              {item.completed ? "Done" : "Pending"}
            </span>
          </li>
        ))}
      </ul>
    </MedicalCard>
  );
}
