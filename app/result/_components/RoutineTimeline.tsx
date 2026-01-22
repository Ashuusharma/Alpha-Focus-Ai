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
    <div className="bg-white rounded-2xl border p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">⏱️</span>
        <h3 className="text-lg font-bold text-gray-900">
          Your Step-by-Step {category} Routine
        </h3>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-1 h-12 bg-blue-200 mt-2" />
              )}
            </div>

            {/* Step content */}
            <div className="pb-3">
              <p className="text-slate-800 font-medium">{step}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline note */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          💡 <strong>Pro Tip:</strong> Consistency is key! Follow this routine
          for at least 4 weeks to see visible results.
        </p>
      </div>
    </div>
  );
}
