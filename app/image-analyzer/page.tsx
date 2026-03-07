"use client";

import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ScanLine, Sparkles } from "lucide-react";

import { AnalyzerType, AnalysisResult, DetectedIssue } from "@/lib/analyzeImage";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { recalculateClinicalScores } from "@/lib/recalculateClinicalScores";
import { getCategoryFromAnalyzer, buildCategoryPhotoMetrics } from "@/lib/clinicalFlow";
import { getParentCategoryFromChild } from "@/lib/categorySync";
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

type SubscriptionPlan = "basic" | "plus" | "pro";

async function assertMonthlyScanLimit(userId: string) {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [{ data: subscription }, { count }] = await Promise.all([
    supabase
      .from("user_subscriptions")
      .select("plan,active,expires_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("photo_scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("scan_date", monthStart.toISOString()),
  ]);

  const plan = ((subscription?.plan || "basic") as string).toLowerCase() as SubscriptionPlan;
  const isActive = subscription?.active !== false && (!subscription?.expires_at || new Date(subscription.expires_at) > new Date());
  const effectivePlan: SubscriptionPlan = isActive ? plan : "basic";

  const monthlyCapByPlan: Record<SubscriptionPlan, number> = {
    basic: 2,
    plus: 5,
    pro: Number.POSITIVE_INFINITY,
  };

  const used = Number(count || 0);
  const cap = monthlyCapByPlan[effectivePlan] ?? 2;
  if (used >= cap) {
    const label = effectivePlan.toUpperCase();
    throw new Error(`${label} plan limit reached (${used}/${Number.isFinite(cap) ? cap : "∞"} scans this month).`);
  }
}

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

function deriveConfidenceScore(apiConfidence: number | undefined, issues: DetectedIssue[]) {
  if (typeof apiConfidence === "number" && Number.isFinite(apiConfidence) && apiConfidence > 0) {
    return Math.max(0, Math.min(100, Math.round(apiConfidence)));
  }

  if (!issues.length) return 0;
  const avgIssueConfidence = issues.reduce((sum, issue) => sum + (issue.confidence || 0), 0) / issues.length;
  return Math.max(0, Math.min(100, Math.round(avgIssueConfidence)));
}

function assertValidImagePayload(result: AnalysisResult) {
  const hasIssues = Array.isArray(result.detectedIssues) && result.detectedIssues.length > 0;
  if (!hasIssues || result.confidence < 45) {
    throw new Error("Image validation failed. Please retake photos in clear lighting with full target area visibility.");
  }
}

export default function ImageAnalyzerPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [step, setStep] = useState<"select" | "upload" | "analyzing" | "done">("select");
  const [selectedType, setSelectedType] = useState<AnalyzerType | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState("Preparing photos...");
  const [diagnosticMode, setDiagnosticMode] = useState<"db_persisted" | "session_only" | null>(null);

  const handleQuestionsNavigation = () => {
    const selectedCategory = selectedType ? getCategoryFromAnalyzer(selectedType) : null;
    const sessionCategory = typeof window !== "undefined"
      ? sessionStorage.getItem("analysisCategory")
      : null;
    const category = selectedCategory || sessionCategory;

    if (category) {
      router.push(`/assessment?category=${category}`);
      return;
    }

    router.push("/assessment");
  };

  const handleTypeSelect = (type: AnalyzerType) => {
    setSelectedType(type);
    setStep("upload");

    const category = getCategoryFromAnalyzer(type);
    if (user && category) {
      const parentCategory = getParentCategoryFromChild(category);
      (async () => {
        try {
          await supabase
            .from("user_active_analysis")
            .upsert(
              {
                user_id: user.id,
                selected_category: category,
                parent_category: parentCategory,
                selected_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
        } catch (error) {
          console.error("Failed to persist active analysis category", error);
        }
      })();
    }
  };

  const handleAllCaptured = async (images: string[]) => {
    if (!selectedType) return;

    setStep("analyzing");
    setAnalysisProgress(8);
    setAnalysisStatus("Preparing secure request...");

    const answers: Record<string, string> = {};
    const selectedCategory = getCategoryFromAnalyzer(selectedType);
    if (!selectedCategory) {
      throw new Error("Unsupported analyzer category for clinical protocol flow.");
    }
    const parentCategory = getParentCategoryFromChild(selectedCategory);

    const progressTimer = setInterval(() => {
      setAnalysisProgress((prev) => (prev < 88 ? prev + 4 : prev));
    }, 350);

    try {
      if (user) {
        await assertMonthlyScanLimit(user.id);
      }

      setAnalysisStatus("Sending photos to Galaxy AI for hotspot detection...");
      const galaxyRaw = await fetch("/api/galaxy/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          analyzerType: selectedType,
          categories: [selectedCategory],
          answers,
        }),
      });

      if (!galaxyRaw.ok) {
        throw new Error("Galaxy analysis failed");
      }

      const galaxyData = (await galaxyRaw.json()) as GalaxyAnalyzeResponse;

      const galaxyIssues = galaxyData?.issues || [];
      const mergedIssues = mapGalaxyIssuesToDetectedIssues(galaxyIssues);
      const derivedConfidence = deriveConfidenceScore(galaxyData?.confidence, mergedIssues);

      const finalResult: AnalysisResult = {
        type: selectedType,
        confidence: derivedConfidence,
        detectedIssues: mergedIssues,
        severity: deriveSeverity(mergedIssues),
        recommendations: [],
        tips: [],
        products: [],
        weeklyRoutines: [],
        capturedPhotos: images,
      };

      assertValidImagePayload(finalResult);

      const photoMetrics = buildCategoryPhotoMetrics(selectedCategory, mergedIssues, finalResult.confidence);
      const imageValid = photoMetrics.image_valid !== false;

      if (typeof window !== "undefined") {
        sessionStorage.setItem("capturedPhotos", JSON.stringify(images));
        sessionStorage.setItem("photoAnalysis", JSON.stringify(finalResult));
        sessionStorage.setItem("analyzerType", selectedType);
        sessionStorage.setItem("analysisCategory", selectedCategory);
        sessionStorage.setItem("analysisParentCategory", parentCategory);
        sessionStorage.setItem("selectedCategories", JSON.stringify([selectedCategory]));
        sessionStorage.setItem("analysisAt", new Date().toISOString());
        sessionStorage.setItem(
          "galaxyAnalysis",
          JSON.stringify({
            provider: galaxyData?.provider || "galaxy-ai",
            originalImages: images,
            annotatedImageUrl: galaxyData?.annotatedImageUrl || images[0],
            hotspots: galaxyData?.hotspots || [],
            selectedCategories: [selectedCategory],
            issues: galaxyIssues,
          })
        );
      }

      if (user) {
        const hairAnalyzers: AnalyzerType[] = ["hair", "scalp", "beard"];
        const isHairFlow = hairAnalyzers.includes(selectedType);
        const { error: scanInsertError } = await supabase.from("photo_scans").insert({
          user_id: user.id,
          scan_date: new Date().toISOString(),
          image_url: galaxyData?.annotatedImageUrl || images[0],
          analyzer_category: selectedCategory,
          parent_category: parentCategory,
          image_valid: imageValid,
          photo_metrics: photoMetrics,
          density_score: isHairFlow ? finalResult.confidence : null,
          inflammation_score: !isHairFlow ? Math.max(0, 100 - finalResult.confidence) : null,
          oil_balance_score: !isHairFlow ? finalResult.confidence : null,
        });
        if (scanInsertError) {
          throw new Error(`Could not save scan: ${scanInsertError.message}`);
        }

        const { error: activeAnalysisError } = await supabase
          .from("user_active_analysis")
          .upsert(
            {
              user_id: user.id,
              selected_category: selectedCategory,
              parent_category: parentCategory,
              selected_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        if (activeAnalysisError) {
          throw new Error(`Could not save active category: ${activeAnalysisError.message}`);
        }

        await recalculateClinicalScores(user.id, selectedCategory);
        await hydrateUserData(user.id);
        setDiagnosticMode("db_persisted");
        setAnalysisStatus("Scan persisted to DB. Redirecting to category assessment...");
      } else {
        setDiagnosticMode("session_only");
        setAnalysisStatus("Saved in session mode (guest). Redirecting to category assessment...");
      }

      setAnalysisProgress(100);
      setStep("done");

      setTimeout(() => {
        router.push(`/assessment?category=${selectedCategory}`);
      }, 600);
    } catch (error) {
      console.error("Analysis failed:", error);
      const message = error instanceof Error ? error.message : "Analysis failed";
      setAnalysisStatus(`${message} Returning to upload...`);
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
            onClick={handleQuestionsNavigation}
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
                {diagnosticMode && (
                  <p className="mt-2 text-xs text-[#6B665D]">
                    Diagnostic mode: {diagnosticMode === "db_persisted" ? "DB persisted" : "Session only"}
                  </p>
                )}
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
