"use client";

import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ScanLine, Sparkles } from "lucide-react";

import { analyzeImage, AnalyzerType, AnalysisResult, DetectedIssue } from "@/lib/analyzeImage";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import MultiAngleUpload from "./_components/ImageUpload";
import AnalyzerSelector from "./_components/AnalyzerSelector";

type GalaxyIssue = {
  name: string;
  confidence: number;
  impact: "minor" | "moderate" | "significant";
  description: string;
  affectedArea: string;
};

type GalaxyHotspot = {
  x: number;
  y: number;
  label: string;
  severity?: "low" | "medium" | "high";
};

type GalaxyAnalyzeResponse = {
  provider: string;
  issues: GalaxyIssue[];
  hotspots: GalaxyHotspot[];
  annotatedImageUrl?: string;
  confidence?: number;
};

function extractOpenedCategoriesFromAnswers(answers: Record<string, string>): string[] {
  const categories = new Set<string>();

  Object.keys(answers).forEach((key) => {
    if (key.startsWith("hair_")) categories.add("hairCare");
    if (key.startsWith("skin_")) categories.add("skinCare");
    if (key.startsWith("beard_")) categories.add("beardCare");
    if (key.startsWith("body_")) categories.add("bodyCare");
    if (key.startsWith("health_")) categories.add("healthCare");
    if (key.startsWith("fitness_")) categories.add("fitness");
    if (key.startsWith("fragrance_")) categories.add("fragrance");
  });

  return Array.from(categories);
}

function mapGalaxyIssuesToDetectedIssues(issues: GalaxyIssue[]): DetectedIssue[] {
  return issues.map((issue) => ({
    name: issue.name,
    confidence: issue.confidence,
    impact: issue.impact,
    description: issue.description,
    affectedArea: issue.affectedArea,
  }));
}

function deriveSeverity(issues: DetectedIssue[]): AnalysisResult["severity"] {
  const high = issues.some((issue) => issue.impact === "significant" || issue.confidence >= 90);
  const lowOnly = issues.every((issue) => issue.impact === "minor" || issue.confidence < 75);

  if (high) return "high";
  if (lowOnly) return "low";
  return "moderate";
}

function persistScanLocally(payload: {
  analyzerType: string;
  selectedCategories: string[];
  originalImages: string[];
  annotatedImageUrl?: string;
  hotspots: GalaxyHotspot[];
  issues: GalaxyIssue[];
  finalResult: AnalysisResult;
}) {
  if (typeof window === "undefined") return;

  const key = "oneman_scan_history";
  const existingRaw = localStorage.getItem(key);
  const existing = existingRaw ? JSON.parse(existingRaw) : [];

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...payload,
  };

  const updated = [entry, ...existing].slice(0, 50);
  localStorage.setItem(key, JSON.stringify(updated));
}

export default function ImageAnalyzerPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [step, setStep] = useState<"select" | "upload" | "analyzing" | "done">("select");
  const [selectedType, setSelectedType] = useState<AnalyzerType | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState("Preparing photos...");

  const handleTypeSelect = (type: AnalyzerType) => {
    setSelectedType(type);
    setStep("upload");
  };

  const handleAllCaptured = async (images: string[]) => {
    if (!selectedType) return;

    setStep("analyzing");
    setAnalysisProgress(8);
    setAnalysisStatus("Preparing secure request...");

    const savedAnswersRaw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("assessment_answers_v1")
        : null;
    const answers = savedAnswersRaw ? (JSON.parse(savedAnswersRaw) as Record<string, string>) : {};

    const answerCategories = extractOpenedCategoriesFromAnswers(answers);
    const selectedCategories = Array.from(new Set([selectedType, ...answerCategories]));

    const progressTimer = setInterval(() => {
      setAnalysisProgress((prev) => (prev < 88 ? prev + 4 : prev));
    }, 350);

    try {
      setAnalysisStatus("Running baseline analysis...");
      const fallbackResultPromise = analyzeImage(images, selectedType);

      setAnalysisStatus("Sending photos to Galaxy AI for hotspot detection...");
      const galaxyResponsePromise = fetch("/api/galaxy/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          analyzerType: selectedType,
          categories: selectedCategories,
          answers,
        }),
      });

      const [fallbackResult, galaxyRaw] = await Promise.all([fallbackResultPromise, galaxyResponsePromise]);

      let galaxyData: GalaxyAnalyzeResponse | null = null;
      if (galaxyRaw.ok) {
        galaxyData = (await galaxyRaw.json()) as GalaxyAnalyzeResponse;
      }

      const galaxyIssues = galaxyData?.issues || [];
      const mergedIssues =
        galaxyIssues.length > 0
          ? mapGalaxyIssuesToDetectedIssues(galaxyIssues)
          : fallbackResult.detectedIssues;

      const finalResult: AnalysisResult = {
        ...fallbackResult,
        confidence: galaxyData?.confidence ?? fallbackResult.confidence,
        detectedIssues: mergedIssues,
        severity: deriveSeverity(mergedIssues),
        capturedPhotos: images,
      };

      if (typeof window !== "undefined") {
        sessionStorage.setItem("capturedPhotos", JSON.stringify(images));
        sessionStorage.setItem("photoAnalysis", JSON.stringify(finalResult));
        sessionStorage.setItem("analyzerType", selectedType);
        sessionStorage.setItem("questionsAnswered", "true");
        sessionStorage.setItem(
          "galaxyAnalysis",
          JSON.stringify({
            provider: galaxyData?.provider || "galaxy-ai",
            originalImages: images,
            annotatedImageUrl: galaxyData?.annotatedImageUrl || images[0],
            hotspots: galaxyData?.hotspots || [],
            selectedCategories,
            issues: galaxyIssues,
          })
        );

        persistScanLocally({
          analyzerType: selectedType,
          selectedCategories,
          originalImages: images,
          annotatedImageUrl: galaxyData?.annotatedImageUrl || images[0],
          hotspots: galaxyData?.hotspots || [],
          issues: galaxyIssues,
          finalResult,
        });
      }

      if (user) {
        const hairAnalyzers: AnalyzerType[] = ["hair", "scalp", "beard"];
        const isHairFlow = hairAnalyzers.includes(selectedType);
        await supabase.from("photo_scans").insert({
          user_id: user.id,
          scan_date: new Date().toISOString(),
          image_url: galaxyData?.annotatedImageUrl || images[0],
          density_score: isHairFlow ? finalResult.confidence : null,
          inflammation_score: !isHairFlow ? Math.max(0, 100 - finalResult.confidence) : null,
          oil_balance_score: !isHairFlow ? finalResult.confidence : null,
        });
      }

      setAnalysisStatus("Analysis complete. Redirecting to report...");
      setAnalysisProgress(100);
      setStep("done");

      setTimeout(() => {
        router.push("/result?source=photo");
      }, 600);
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisStatus("Analysis failed. Returning to upload...");
      setTimeout(() => setStep("upload"), 1000);
    } finally {
      clearInterval(progressTimer);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4EFE6] via-[#EFE8DD] to-[#E5E0D4] text-[#1F3D2B] selection:bg-[#1F3D2B]/20">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#1F3D2B]/10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-[#6B665D] hover:text-[#1F3D2B] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <span className="font-semibold text-[#1F3D2B]">Alpha Focus Analyzer</span>
          <button
            onClick={() => router.push("/assessment")}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#1F3D2B]/10 text-[#1F3D2B] bg-white/60 hover:bg-white/80 transition-colors shadow-sm"
          >
            Questions
          </button>
        </div>
      </header>

      <main className="pt-24 pb-20 px-4 max-w-6xl mx-auto min-h-screen flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-[#1F3D2B] mx-auto flex items-center justify-center shadow-[0_10px_24px_rgba(47,111,87,0.2)]">
                  <ScanLine className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-[#1F3D2B]">What would you like to analyze?</h1>
                <p className="text-[#6B665D]">Select an area for our AI clinical engine to evaluate.</p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/40 p-8 md:p-10 shadow-sm">
                <AnalyzerSelector selected={selectedType} onSelect={handleTypeSelect} />
              </div>
            </motion.div>
          )}

          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setStep("select")}
                  className="w-10 h-10 rounded-full bg-white/60 border border-white/40 hover:bg-white/80 flex items-center justify-center transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5 text-[#1F3D2B]" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-[#1F3D2B]">Upload Photos</h2>
                  <p className="text-sm text-[#6B665D]">Capture 3 angles for stronger hotspot confidence and report quality</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/40 p-8 md:p-10 shadow-sm">
                <MultiAngleUpload analyzerType={selectedType || "skin"} onAllCaptured={handleAllCaptured} />
              </div>
            </motion.div>
          )}

          {(step === "analyzing" || step === "done") && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center space-y-6 py-20"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-[#D9D2C7] border-t-[#2F6F57] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {step === "done" ? (
                    <Check className="w-8 h-8 text-[#2F6F57]" />
                  ) : (
                    <Sparkles className="w-8 h-8 text-[#2F6F57] animate-pulse" />
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {step === "done" ? "Analysis Complete" : "Analyzing Images..."}
                </h2>
                <p className="text-[#2F6F57]">{analysisStatus}</p>
              </div>

              <div className="w-full max-w-md">
                <div className="h-2 w-full bg-[#E2DDD4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-medical-gradient transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
                <p className="text-xs text-[#6E9F87] mt-2">{analysisProgress}%</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
