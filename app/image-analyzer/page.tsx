"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { analyzeImage, AnalyzerType, AnalysisResult } from "@/lib/analyzeImage";
import Container from "@/app/result/_components/Container";
import ImageUpload from "./_components/ImageUpload";
import AnalyzerSelector from "./_components/AnalyzerSelector";
import AnalysisResults from "./_components/AnalysisResults";

export default function ImageAnalyzerPage() {
  const router = useRouter();

  const [step, setStep] = useState<"select" | "upload" | "analyzing" | "results">(
    "select"
  );
  const [selectedType, setSelectedType] = useState<AnalyzerType | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Select analyzer type
  const handleTypeSelect = (type: AnalyzerType) => {
    setSelectedType(type);
    setStep("upload");
  };

  // Step 2: Capture image
  const handleImageCapture = async (data: string) => {
    setImageData(data);
    setStep("analyzing");
    setLoading(true);

    try {
      const analysisResult = await analyzeImage(data, selectedType!);
      setResult(analysisResult);
      setStep("results");
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Analysis failed. Please try again.");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  // Reset and start over
  const handleReanalyze = () => {
    setStep("select");
    setSelectedType(null);
    setImageData(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-blue-50 py-10">
      <Container>
        <div className="space-y-8">
          {/* HEADER */}
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">
              🎯 AI Photo Analyzer
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Upload a photo to get instant AI analysis of your skin, hair, or beard condition.
              Detect issues and get personalized product recommendations in seconds.
            </p>
          </div>

          {/* STEP INDICATOR */}
          <div className="flex justify-between items-center max-w-2xl mx-auto w-full">
            {[
              { step: "select", label: "Choose" },
              { step: "upload", label: "Upload" },
              { step: "analyzing", label: "Analyzing" },
              { step: "results", label: "Results" },
            ].map((s) => (
              <div key={s.step} className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                    step === s.step
                      ? "bg-purple-600 text-white"
                      : ["upload", "analyzing", "results"].includes(step) &&
                          ["select", "upload", "analyzing"].includes(s.step)
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {["upload", "analyzing", "results"].includes(step) &&
                  ["select", "upload", "analyzing"].includes(s.step)
                    ? "✓"
                    : s.label.charAt(0)}
                </div>
                {s.step !== "results" && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      ["upload", "analyzing", "results"].includes(step) &&
                      ["select"].includes(s.step)
                        ? "bg-green-500"
                        : ["analyzing", "results"].includes(step) &&
                            ["select", "upload"].includes(s.step)
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* CONTENT */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            {step === "select" && (
              <AnalyzerSelector
                selected={selectedType}
                onSelect={handleTypeSelect}
              />
            )}

            {step === "upload" && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Analyzing:</strong> {selectedType === "skin"
                      ? "Skin"
                      : selectedType === "hair"
                      ? "Hair"
                      : "Beard"}
                  </p>
                  <button
                    onClick={() => setStep("select")}
                    className="text-sm text-purple-600 hover:underline"
                  >
                    ← Change analyzer
                  </button>
                </div>

                <ImageUpload
                  onImageCapture={handleImageCapture}
                  disabled={loading}
                />
              </div>
            )}

            {step === "analyzing" && (
              <div className="text-center py-12">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-700 mb-6"></div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Analyzing Your Photo
                </h3>
                <p className="text-slate-600">
                  Our AI is examining your {selectedType} condition...
                </p>
              </div>
            )}

            {step === "results" && result && (
              <AnalysisResults
                result={result}
                onReanalyze={handleReanalyze}
              />
            )}
          </div>

          {/* FEATURES SECTION */}
          {step === "select" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-bold text-slate-900 mb-2">Instant Detection</h3>
                <p className="text-sm text-gray-600">
                  Get AI-powered analysis in seconds. Identify skin issues, hair loss, and
                  beard growth potential.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-bold text-gray-900 mb-2">Confidence Scores</h3>
                <p className="text-sm text-gray-600">
                  See how confident our AI is about each detection with percentage scores and
                  severity ratings.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">💊</div>
                <h3 className="font-bold text-gray-900 mb-2">Smart Recommendations</h3>
                <p className="text-sm text-gray-600">
                  Get specific product and routine recommendations tailored to your detected
                  condition.
                </p>
              </div>
            </div>
          )}

          {/* BACK BUTTON */}
          {step !== "select" && (
            <div className="flex justify-center">
              <button
                onClick={() => setStep("select")}
                className="px-6 py-3 border border-blue-300 rounded-xl font-semibold text-slate-700 hover:bg-blue-50 transition"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
