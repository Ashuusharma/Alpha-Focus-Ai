import { EnrichedIssue } from "@/lib/aiAnalysisEngine";

interface AIIssuesDisplayProps {
  issues: EnrichedIssue[];
}

export default function AIIssuesDisplay({ issues }: AIIssuesDisplayProps) {
  const getSourceBadge = (source: "photo" | "questionnaire" | "both") => {
    if (source === "both") {
      return (
        <div className="flex gap-1">
          <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
            📸 Photo
          </span>
          <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
            📝 Answers
          </span>
        </div>
      );
    }
    return (
      <span
        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
          source === "photo"
            ? "bg-green-100 text-green-800"
            : "bg-blue-100 text-blue-800"
        }`}
      >
        {source === "photo" ? "📸 Photo" : "📝 Answers"}
      </span>
    );
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "minor":
        return "bg-yellow-50 border-yellow-200";
      case "moderate":
        return "bg-orange-50 border-orange-200";
      case "significant":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case "minor":
        return "⚠️ Minor";
      case "moderate":
        return "⚠️ Moderate";
      case "significant":
        return "🔴 Significant";
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
              <h4 className="text-lg font-bold text-gray-900">
                {issue.name}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
            </div>
            <div className="text-right">
              {getSourceBadge(issue.source)}
              <div className="mt-2 text-sm">
                <span
                  className={`inline-block px-2 py-1 rounded font-semibold ${
                    issue.impact === "significant"
                      ? "bg-red-100 text-red-800"
                      : issue.impact === "moderate"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-yellow-100 text-yellow-800"
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
              <span className="text-xs font-semibold text-gray-700">
                Confidence
              </span>
              <span className="text-sm font-bold text-gray-900">
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
              ✅ Suggested Actions:
            </p>
            <ul className="space-y-1">
              {issue.suggestedActions.map((action, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-600 font-bold flex-shrink-0">→</span>
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
