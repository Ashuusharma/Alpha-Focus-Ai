import { EnrichedIssue } from "@/lib/aiAnalysisEngine";

interface AIIssuesDisplayProps {
  issues: EnrichedIssue[];
}

export default function AIIssuesDisplay({ issues }: AIIssuesDisplayProps) {
  const getSourceBadge = (source: "photo" | "questionnaire" | "both") => {
    if (source === "both") {
      return (
        <div className="flex gap-1">
          <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-500/20 text-green-300 rounded-full border border-green-500/20">
             Photo
          </span>
          <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/20">
             Answers
          </span>
        </div>
      );
    }
    return (
      <span
        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full border ${
          source === "photo"
            ? "bg-green-500/20 text-green-300 border-green-500/20"
            : "bg-blue-500/20 text-blue-300 border-blue-500/20"
        }`}
      >
        {source === "photo" ? " Photo" : " Answers"}
      </span>
    );
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "minor":
        return "bg-yellow-500/10 border-yellow-500/20";
      case "moderate":
        return "bg-orange-500/10 border-orange-500/20";
      case "significant":
        return "bg-red-500/10 border-red-500/20";
      default:
        return "bg-white/5 border-white/10";
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case "minor":
        return "Minor";
      case "moderate":
        return "Moderate";
      case "significant":
        return " Significant";
      default:
        return impact;
    }
  };

  return (
    <div className="space-y-4">
      {issues.map((issue, idx) => (
        <div
          key={idx}
          className={`border rounded-xl p-5 ${getImpactColor(issue.impact)}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3 gap-3">
            <div>
              <h4 className="text-lg font-bold text-white">
                {issue.name}
              </h4>
              <p className="text-sm text-gray-300 mt-1">{issue.description}</p>
            </div>
            <div className="text-right">
              {getSourceBadge(issue.source)}
              <div className="mt-2 text-sm">
                <span
                  className={`inline-block px-2 py-1 rounded font-semibold ${
                    issue.impact === "significant"
                      ? "bg-red-500/20 text-red-300 border border-red-500/20"
                      : issue.impact === "moderate"
                        ? "bg-orange-500/20 text-orange-300 border border-orange-500/20"
                        : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/20"
                  }`}
                >
                  {getImpactLabel(issue.impact)}
                </span>
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400">
                Confidence
              </span>
              <span className="text-sm font-bold text-white">
                {issue.combinedConfidence}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-slate-700 h-2 rounded-full"
                style={{ width: `${issue.combinedConfidence}%` }}
              />
            </div>
          </div>

          {/* Suggested Actions */}
          <div className="pt-3 border-t border-gray-300/50">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Suggested Actions:
            </p>
            <ul className="space-y-1">
              {issue.suggestedActions.map((action, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-600 font-bold flex-shrink-0">-&gt;</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

