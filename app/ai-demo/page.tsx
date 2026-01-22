"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { analyzeImage, AnalysisResult } from "@/lib/analyzeImage";
import { analyzeWithAI, CombinedAnalysis } from "@/lib/aiAnalysisEngine";
import Container from "@/app/result/_components/Container";

export default function AITestPage() {
  const router = useRouter();
  const [demoStep, setDemoStep] = useState(0);
  const [photoAnalysis, setPhotoAnalysis] = useState<AnalysisResult | null>(null);
  const [combinedAnalysis, setCombinedAnalysis] = useState<CombinedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  // Sample questionnaire answers
  const sampleAnswers = {
    skin_type: "Oily",
    skin_concern: "Acne and dryness",
    skin_severity: "Moderate",
    hair_concern: "Hair fall",
    hair_type: "Dry",
    beard_issue: "Itching and dryness",
    beard_coverage: "Patchy",
  };

  const runDemo = async () => {
    setLoading(true);

    // Step 1: Simulate photo analysis
    console.log("Step 1: Analyzing photo...");
    const photo = await analyzeImage("", "skin");
    setPhotoAnalysis(photo);
    setDemoStep(1);

    // Wait a moment
    await new Promise((r) => setTimeout(r, 1000));

    // Step 2: Combine with questionnaire
    console.log("Step 2: Combining analysis with questionnaire...");
    const combined = analyzeWithAI(photo, sampleAnswers);
    setCombinedAnalysis(combined);
    setDemoStep(2);

    setLoading(false);
  };

  const goToFullResult = () => {
    const params = new URLSearchParams();
    params.append("answers", JSON.stringify(sampleAnswers));
    if (photoAnalysis) {
      params.append("photo", JSON.stringify(photoAnalysis));
    }
    router.push(`/result?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-10">
      <Container>
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-slate-800 bg-clip-text text-transparent mb-2">
            🧠 AI Analysis Engine Demo
          </h1>
          <p className="text-gray-600 mb-8">
            See how the AI combines photo analysis with questionnaire answers for intelligent recommendations
          </p>

          {/* Demo Steps */}
          <div className="space-y-8">
            {/* Step 0: Start */}
            {demoStep === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📸</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Demo the AI Analysis Engine
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  This demo shows how the system analyzes a photo, combines it with questionnaire
                  answers, and generates intelligent recommendations with confidence scores.
                </p>
                <button
                  onClick={runDemo}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-700 to-slate-800 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? "Running..." : "Start Demo"}
                </button>
              </div>
            )}

            {/* Step 1: Photo Analysis */}
            {demoStep >= 1 && photoAnalysis && (
              <div className="border-2 border-green-300 rounded-2xl p-6 bg-green-50">
                <h3 className="text-xl font-bold text-green-900 mb-4">
                  ✅ Step 1: Photo Analysis Complete
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-bold text-gray-900 capitalize">
                      {photoAnalysis.type} Analysis
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="font-bold text-gray-900">
                      {photoAnalysis.confidence}%
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Severity</p>
                    <p className="font-bold text-gray-900 capitalize">
                      {photoAnalysis.severity}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Issues Found</p>
                    <p className="font-bold text-gray-900">
                      {photoAnalysis.detectedIssues.length}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Detected Issues:</p>
                  <ul className="space-y-2">
                    {photoAnalysis.detectedIssues.map((issue, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between text-gray-700"
                      >
                        <span>{issue.name}</span>
                        <span className="text-sm font-bold text-blue-600">
                          {issue.confidence}% confident
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Step 2: Combined Analysis */}
            {demoStep >= 2 && combinedAnalysis && (
              <div className="border-2 border-purple-300 rounded-2xl p-6 bg-purple-50">
                <h3 className="text-xl font-bold text-purple-900 mb-4">
                  ✅ Step 2: AI Analysis Complete
                </h3>

                {/* Overall Confidence */}
                <div className="bg-white p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">Overall Confidence</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {combinedAnalysis.confidence}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-700 to-slate-800 h-3 rounded-full"
                      style={{ width: `${combinedAnalysis.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Enriched Issues */}
                <div className="bg-white p-4 rounded-lg mb-4">
                  <p className="font-semibold text-gray-900 mb-3">
                    🔍 Enriched Issues ({combinedAnalysis.detectedIssues.length})
                  </p>
                  <div className="space-y-3">
                    {combinedAnalysis.detectedIssues.slice(0, 3).map((issue, i) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900">
                              {issue.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {issue.source === "both"
                                ? "📸 Photo + 📝 Questionnaire"
                                : issue.source === "photo"
                                  ? "📸 Photo Analysis"
                                  : "📝 Questionnaire"}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-purple-600">
                            {issue.combinedConfidence}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${issue.combinedConfidence}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                <div className="bg-white p-4 rounded-lg mb-6">
                  <p className="font-semibold text-gray-900 mb-3">
                    💡 AI Insights ({combinedAnalysis.insights.length})
                  </p>
                  <div className="space-y-2">
                    {combinedAnalysis.insights.map((insight, i) => (
                      <div
                        key={i}
                        className="text-sm bg-blue-50 p-2 rounded border border-blue-200"
                      >
                        <p className="font-semibold text-blue-900">
                          {insight.title}
                        </p>
                        <p className="text-xs text-blue-800">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Step */}
                <button
                  onClick={goToFullResult}
                  className="w-full bg-gradient-to-r from-blue-700 to-slate-800 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg transition"
                >
                  View Full Recommendations & Products →
                </button>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-3">How It Works:</h3>
            <ol className="space-y-2 text-slate-800 text-sm">
              <li>
                <strong>1. Photo Analysis:</strong> AI analyzes uploaded photo and
                detects issues with confidence scores
              </li>
              <li>
                <strong>2. Questionnaire Parsing:</strong> System extracts issues
                from user answers
              </li>
              <li>
                <strong>3. Smart Merging:</strong> Issues confirmed by both sources
                get boosted confidence
              </li>
              <li>
                <strong>4. Enriched Results:</strong> Each issue shows source
                (photo/questionnaire/both) and combined confidence
              </li>
              <li>
                <strong>5. AI Insights:</strong> System generates validation,
                warnings, and opportunities
              </li>
              <li>
                <strong>6. Product Matching:</strong> Recommendations are scored
                based on merged issue data
              </li>
            </ol>
          </div>
        </div>
      </Container>
    </div>
  );
}
