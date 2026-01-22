"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getRecommendations } from "@/lib/getRecommendations";
import { getRecoveryScore } from "@/lib/getRecoveryScore";
import { categories } from "@/lib/questions";
import { analyzeWithAI, CombinedAnalysis } from "@/lib/aiAnalysisEngine";
import { AnalysisResult } from "@/lib/analyzeImage";
import { generateRoutine, generateRoutineProgram } from "@/lib/routineGenerator";
import {
  saveScanRecord,
  getCurrentUser,
  getLatestScan,
} from "@/lib/userProfileManager";
import Container from "@/app/result/_components/Container";
import ResultHeader from "@/app/result/_components/ResultHeader";
import IssueSummary from "@/app/result/_components/IssueSummary";
import AIIssuesDisplay from "@/app/result/_components/AIIssuesDisplay";
import EnhancedProductCard from "@/app/result/_components/EnhancedProductCard";
import RoutineTimeline from "@/app/result/_components/RoutineTimeline";
import RecoveryScore from "@/app/result/_components/RecoveryScore";
import StartFreshButton from "@/app/result/_components/StartFreshButton";
import ImageAnalyzerCTA from "@/app/result/_components/ImageAnalyzerCTA";
import RoutineComplianceTracker from "@/app/result/_components/RoutineComplianceTracker";
import ResultsTimeline from "@/app/result/_components/ResultsTimeline";
import ExpertConsultationCTA from "@/app/result/_components/ExpertConsultationCTA";
import SocialProofWidget from "@/app/result/_components/SocialProofWidget";
import ProgressComparison from "@/app/result/_components/ProgressComparison";
import RoutineDisplay from "@/app/result/_components/RoutineDisplay";

type Answers = Record<string, string>;

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [answers, setAnswers] = useState<Answers>({});
  const [photoAnalysis, setPhotoAnalysis] = useState<AnalysisResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<CombinedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parse answers and photo analysis from URL
    const answersParam = searchParams.get("answers");
    const photoParam = searchParams.get("photo");

    const parsedAnswers: Answers = {};
    let parsedPhoto: AnalysisResult | null = null;

    try {
      if (answersParam) {
        const parsed = JSON.parse(decodeURIComponent(answersParam));
        Object.assign(parsedAnswers, parsed);
      }

      if (photoParam) {
        const parsed = JSON.parse(decodeURIComponent(photoParam));
        parsedPhoto = parsed;
      }

      setAnswers(parsedAnswers);
      setPhotoAnalysis(parsedPhoto);

      // Run AI Analysis Engine
      const analysis = analyzeWithAI(parsedPhoto, parsedAnswers);
      setAiAnalysis(analysis);

      // Save scan to user history
      if (typeof window !== "undefined") {
        const user = getCurrentUser();
        if (user && user.id) {
          saveScanRecord(
            parsedPhoto,
            parsedAnswers,
            analysis
          );
        }
      }
    } catch (e) {
      console.error("Failed to parse analysis data:", e);
    }

    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p className="text-gray-600 font-medium">
            Analyzing your profile…
          </p>
        </div>
      </div>
    );
  }

  if (!Object.keys(answers).length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Container>
          <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-auto shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Assessment Found
            </h2>
            <p className="text-gray-600 mb-6">
              Please complete the Oneman Assistant questionnaire first.
            </p>
            <StartFreshButton />
          </div>
        </Container>
      </div>
    );
  }

  // Get recommendations and recovery score
  const recommendations = getRecommendations(answers);
  const { score: recoveryScore, reasons: recoveryReasons } =
    getRecoveryScore(answers);

  // Use AI-powered confidence if available
  const aiConfidence = aiAnalysis?.confidence || 0;
  const displayConfidence = photoAnalysis ? aiConfidence : recoveryScore;

  // Calculate progress
  const categoriesAnswered = categories.filter((cat) =>
    Object.keys(answers).some((q) => q.startsWith(cat.id.slice(0, 4)))
  ).length;

  const progress = Math.min(50 + Math.ceil((recommendations.length * 10) / 7), 100);

  return (
    <div className="min-h-screen bg-blue-50 py-6 sm:py-10">
      <Container>
        <div className="space-y-8">
          {/* RESULT HEADER */}
          <ResultHeader
            progress={progress}
            categoriesAnalyzed={categoriesAnswered}
            totalCategories={7}
          />

          {/* AI INSIGHTS */}
          {aiAnalysis && aiAnalysis.insights.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                🧠 AI Analysis Insights
              </h3>
              <div className="space-y-4">
                {aiAnalysis.insights.slice(0, 3).map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.type === "validation"
                        ? "bg-green-50 border-green-500"
                        : insight.type === "warning"
                          ? "bg-red-50 border-red-500"
                          : insight.type === "opportunity"
                            ? "bg-blue-50 border-blue-500"
                            : "bg-amber-50 border-amber-500"
                    }`}
                  >
                    <p className="font-semibold text-slate-900">
                      {insight.title}
                    </p>
                    <p className="text-sm text-slate-700 mt-1">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PHOTO & QUESTIONNAIRE ANALYSIS INFO */}
          {photoAnalysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4">
                📸 Analysis Confidence
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800">Photo Analysis</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-white rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${photoAnalysis.confidence}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-blue-900 w-12">
                      {photoAnalysis.confidence}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-800">Combined AI Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-white rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${aiAnalysis?.confidence || 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-blue-900 w-12">
                      {aiAnalysis?.confidence || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-8">
              {/* AI-ENRICHED ISSUES (if photo analysis exists) */}
              {photoAnalysis && aiAnalysis && aiAnalysis.detectedIssues.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🔍 AI-Detected Issues
                  </h2>
                  <AIIssuesDisplay issues={aiAnalysis.detectedIssues} />
                </div>
              )}

              {/* ISSUE SUMMARY */}
              {recommendations.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🎯 {photoAnalysis ? "Recommended Solutions" : "Detected Issues & Solutions"}
                  </h2>
                  <IssueSummary recommendations={recommendations} />
                </div>
              )}

              {/* RESULTS TIMELINE */}
              {recommendations.length > 0 && (
                <ResultsTimeline issue={recommendations[0]?.title || "Your Condition"} />
              )}

              {/* PRODUCTS */}
              {recommendations.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    💊 Recommended Products
                  </h2>
                  <div className="space-y-6">
                    {recommendations.flatMap((rec) =>
                      rec.products.map((product) => (
                        <EnhancedProductCard
                          key={product.id}
                          product={product}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ROUTINE TIMELINE */}
              {recommendations.length > 0 && (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <RoutineTimeline
                      key={rec.id}
                      steps={rec.steps}
                      category={rec.title}
                    />
                  ))}
                </div>
              )}

              {/* ROUTINE COMPLIANCE TRACKER */}
              <RoutineComplianceTracker routineTitle="Your Daily Routine" />

              {/* AI-GENERATED ROUTINE */}
              {aiAnalysis && (
                <div>
                  <RoutineDisplay
                    routine={generateRoutine(
                      aiAnalysis.detectedIssues,
                      recommendations,
                      answers
                    )}
                    program={generateRoutineProgram(
                      aiAnalysis.detectedIssues,
                      recommendations,
                      answers
                    )}
                    issues={aiAnalysis.detectedIssues}
                  />
                </div>
              )}

              {/* PROGRESS TRACKING */}
              <ProgressComparison />

              {/* SOCIAL PROOF */}
              <SocialProofWidget />

              {/* EXPERT CONSULTATION */}
              <ExpertConsultationCTA />

              {/* TRY IMAGE ANALYZER */}
              <ImageAnalyzerCTA />
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              <RecoveryScore
                score={recoveryScore}
                reasons={recoveryReasons}
              />

              {/* ACTION BUTTONS */}
              <div className="space-y-3">
                <StartFreshButton />
                <button
                  onClick={() => router.push("/")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Modify Answers
                </button>
              </div>

              {/* QUICK TIPS */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-3">💡 Quick Tips</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>✓ Start slowly with new products</li>
                  <li>✓ Take before photos (Day 1, Week 4)</li>
                  <li>✓ Drink 3L+ water daily</li>
                  <li>✓ Get 7-8 hours sleep</li>
                  <li>✓ Check in weekly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <p className="text-gray-600 font-medium">Loading results…</p>
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
