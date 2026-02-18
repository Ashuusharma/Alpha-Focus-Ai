"use client";

interface RoutineTimelineProps {
  steps: string[];
  category: string;
}

export default function RoutineTimeline({
  steps,
  category,
}: RoutineTimelineProps) {
  return (
    <div className="bg-transparent rounded-2xl p-0">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">⏱️</span>
        <h3 className="text-xl font-bold text-white tracking-wide">
          Your Step-by-Step {category} Routine
        </h3>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean to-accent text-white flex items-center justify-center font-extrabold text-sm">
                {idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-1 h-12 bg-ocean/30 mt-2" />
              )}
            </div>

            {/* Step content */}
            <div className="pb-3">
              <p className="text-onyx font-semibold">{step}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline note */}
      <div className="mt-6 p-4 bg-mist rounded-lg">
        <p className="text-sm text-ocean">
          💡 <strong>Pro Tip:</strong> Consistency is key! Follow this routine
          for at least 4 weeks to see visible results.
        </p>
      </div>
    </div>
  );
}
