"use client";

interface TimelinePhase {
  week: string;
  title: string;
  description: string;
  emoji: string;
}

interface ResultsTimelineProps {
  issue: string;
}

export default function ResultsTimeline({ issue }: ResultsTimelineProps) {
  const phases: TimelinePhase[] = [
    {
      week: "Week 1-2",
      title: "Cleansing Phase",
      description: "Your skin/hair starts responding to treatment. Initial shedding of dead cells.",
      emoji: "",
    },
    {
      week: "Week 3-4",
      title: "Healing Phase",
      description:
        "Visible improvement! Inflammation reduces, texture improves, hair looks healthier.",
      emoji: "",
    },
    {
      week: "Month 2-3",
      title: "Transformation Phase",
      description:
        "Significant visible changes. Friends will notice! Problem areas are mostly resolved.",
      emoji: "*",
    },
    {
      week: "Month 3+",
      title: "Maintenance Phase",
      description:
        "Results are stable. Continue routine to prevent relapse. Skin/hair at peak condition.",
      emoji: "",
    },
  ];

  return (
    <div className="bg-white border rounded-2xl p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        Timeline Your Expected Results Timeline
      </h3>

      <div className="space-y-4">
        {phases.map((phase, idx) => (
          <div key={idx} className="relative flex gap-4">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                {phase.emoji}
              </div>
              {idx < phases.length - 1 && (
                <div className="w-1 h-16 bg-blue-200 mt-2" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 pt-2">
              <div className="flex items-baseline gap-2 mb-1">
                <h4 className="font-bold text-slate-900">{phase.title}</h4>
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {phase.week}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {phase.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-900">
           <strong>Note:</strong> Timeline varies by individual. Genetics, climate,
          diet, and consistency all impact results. Photos on Day 1 and Week 4 help
          track progress visually.
        </p>
      </div>
    </div>
  );
}

