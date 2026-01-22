"use client";

interface RecoveryScoreProps {
  score: number; // 0–100
  reasons: string[];
}

export default function RecoveryScore({
  score,
  reasons,
}: RecoveryScoreProps) {
  const getLabel = () => {
    if (score >= 80) return "Strong alignment";
    if (score >= 60) return "Fair alignment";
    return "Needs improvement";
  };

  return (
    <div className="rounded-2xl border p-6 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        📊 <h4 className="font-semibold">Recovery score</h4>
      </div>

      {/* Score */}
      <div className="flex items-end gap-2 mb-3">
        <span className="text-4xl font-bold">{score}</span>
        <span className="text-gray-500 mb-1">/ 100</span>
        <span className="ml-3 rounded-full bg-gray-100 px-3 py-1 text-sm">
          {getLabel()}
        </span>
      </div>

      {/* 🔥 Animated progress bar */}
      <div className="relative h-3 rounded-full bg-gray-200 overflow-hidden mb-4">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${score}%`,
            background:
              "linear-gradient(90deg, #111 0%, #16a34a 100%)",
          }}
        />
      </div>

      {/* Explanation */}
      <p className="text-sm text-gray-600 mb-3">
        This score reflects how well your current habits align with your
        recovery plan. Consistency can improve this over time.
      </p>

      {/* Why score */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-1">
          Why your score looks like this:
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <button
        onClick={() =>
          document
            .getElementById("routine-section")
            ?.scrollIntoView({ behavior: "smooth" })
        }
        className="text-sm font-medium text-green-700 hover:underline"
      >
        Improve my recovery score →
      </button>

      {/* Shopify-ready note */}
      <div className="mt-3 text-xs text-gray-400">
        Using recommended products consistently may increase your recovery
        score.
      </div>
    </div>
  );
}
