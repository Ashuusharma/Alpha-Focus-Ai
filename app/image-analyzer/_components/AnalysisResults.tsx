"use client";

import { useRouter } from "next/navigation";
import { AnalysisResult } from "@/lib/analyzeImage";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReanalyze: () => void;
}

export default function AnalysisResults({
  result,
  onReanalyze,
}: AnalysisResultsProps) {
  const router = useRouter();

  const handleFullAssessment = () => {
    // Save the photo analysis and redirect to questionnaire
    const photoData = JSON.stringify(result);
    sessionStorage.setItem("photoAnalysis", photoData);
    router.push("/");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "minor":
        return "bg-green-50 border-l-4 border-green-500";
      case "moderate":
        return "bg-yellow-50 border-l-4 border-yellow-500";
      case "significant":
        return "bg-red-50 border-l-4 border-red-500";
      default:
        return "bg-gray-50 border-l-4 border-gray-500";
    }
  };

  const analyzerLabels = {
    skin: "Skin Analysis",
    hair: "Hair Analysis",
    beard: "Beard Analysis",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-slate-800 text-white rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-4">
          Your {analyzerLabels[result.type]} Results
        </h2>
        <p className="text-blue-100">
          AI Confidence: <span className="font-bold">{result.confidence}%</span>
        </p>
      </div>

      {/* Severity Badge */}
      <div className={`border-2 rounded-xl p-6 ${getSeverityColor(result.severity)}`}>
        <p className="text-sm font-semibold mb-1">Overall Severity</p>
        <p className="text-2xl font-bold capitalize">{result.severity}</p>
        <p className="text-xs opacity-75 mt-2">
          {result.severity === "low"
            ? "Your condition is mild. Maintenance products recommended."
            : result.severity === "moderate"
            ? "Your condition requires consistent treatment. Results in 4 weeks."
            : "Your condition is significant. Professional treatment recommended."}
        </p>
      </div>

      {/* Detected Issues */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          🔍 Detected Issues ({result.detectedIssues.length})
        </h3>
        <div className="space-y-4">
          {result.detectedIssues.map((issue, idx) => (
            <div key={idx} className={`rounded-lg p-4 ${getImpactColor(issue.impact)}`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-slate-900">{issue.name}</h4>
                <span className="text-xs font-bold bg-white/50 px-2 py-1 rounded">
                  {issue.confidence}% confident
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {issue.description}
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Impact Level</span>
                  <span className="text-xs font-bold capitalize">{issue.impact}</span>
                </div>
                <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      issue.impact === "minor"
                        ? "bg-green-500 w-1/3"
                        : issue.impact === "moderate"
                        ? "bg-yellow-500 w-2/3"
                        : "bg-red-500 w-full"
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-4">
          ✅ Recommended Products & Routine
        </h3>
        <ul className="space-y-2">
          {result.recommendations.map((rec, idx) => (
            <li key={idx} className="flex gap-3 text-blue-800">
              <span className="text-blue-600 font-bold">→</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pro Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-amber-900 mb-4">
          💡 Pro Tips for Success
        </h3>
        <ul className="space-y-2">
          {result.tips.map((tip, idx) => (
            <li key={idx} className="flex gap-3 text-amber-800">
              <span className="text-amber-600">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Next Steps */}
      <div className="bg-white border border-blue-300 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">🎯 Next Steps</h3>
        <ol className="space-y-3">
          <li className="flex gap-4">
            <span className="font-bold text-blue-600 text-lg">1</span>
            <span className="text-gray-700">
              <strong>Review Results</strong> - Understand your detected issues and severity
            </span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-blue-600 text-lg">2</span>
            <span className="text-gray-700">
              <strong>Take Full Assessment</strong> - Answer our detailed questionnaire for
              personalized product recommendations
            </span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-blue-600 text-lg">3</span>
            <span className="text-gray-700">
              <strong>Get Routine Plan</strong> - Receive AI-generated daily routine with
              specific products and timeline
            </span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-blue-600 text-lg">4</span>
            <span className="text-gray-700">
              <strong>Track Progress</strong> - Monitor improvements with photo comparisons
              and recovery score
            </span>
          </li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onReanalyze}
          className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition"
        >
          📸 Re-analyze
        </button>
        <button
          onClick={handleFullAssessment}
          className="flex-1 bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition"
        >
          → Take Full Assessment
        </button>
      </div>
    </div>
  );
}
