"use client";

import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, RotateCcw, ScanLine, Sparkles, ArrowRight, AlertTriangle, ImageIcon } from "lucide-react";

import { AnalyzerType, AnalysisResult, DetectedIssue } from "@/lib/analyzeImage";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { recalculateClinicalScores } from "@/lib/recalculateClinicalScores";
import { getCategoryFromAnalyzer, buildCategoryPhotoMetrics } from "@/lib/clinicalFlow";
import { getParentCategoryFromChild } from "@/lib/categorySync";
import { uploadAnalyzerImagesToSupabase } from "@/lib/photoStorage";
import MultiAngleUpload from "./_components/ImageUpload";
import AnalyzerSelector from "./_components/AnalyzerSelector";
import Button from "@/components/ui/Button";

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

type GalaxyQualitySignal = {
  retakeRecommended: boolean;
  reason?: string;
};

type GalaxyAnalyzeResponse = {
  provider: string;
  issues: GalaxyIssue[];
  hotspots: GalaxyHotspot[];
  annotatedImageUrl?: string;
  confidence?: number;
  /** Already returned by /api/galaxy/analyze (lib buildQualitySignal) but
   *  previously unread by this page — Phase 7E surfaces it instead of
   *  relying solely on the blunt confidence<45 error. */
  quality?: GalaxyQualitySignal;
  /** Present only when the Vision pipeline already persisted every captured
   *  image to Storage, in the same order as the images sent to /api/galaxy/analyze. */
  uploadedImageUrls?: string[];
};

type SubscriptionPlan = "free" | "premium_monthly" | "premium_yearly";

type AnalysisStage = "preparing" | "optimizing" | "vision" | "validating" | "building";

const STAGE_COPY: Record<AnalysisStage, string> = {
  preparing: "Preparing your photo",
  optimizing: "Optimizing quality",
  vision: "AI analyzing your scan",
  validating: "Reviewing results",
  building: "Building your personalized assessment",
};

const STAGE_PROGRESS: Record<AnalysisStage, number> = {
  preparing: 10,
  optimizing: 25,
  vision: 55,
  validating: 78,
  building: 92,
};

// Advisory pre-check only — avoids a wasted upload/round-trip for a user
// who's obviously over the cap. The real enforcement is server-side in
// /api/galaxy/analyze (lib/server/entitlements.ts's canRunAnalyzer), which
// this client-side Supabase read can't be trusted to replace.
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

  const plan = ((subscription?.plan || "free") as string).toLowerCase() as SubscriptionPlan;
  const isActive = subscription?.active !== false && (!subscription?.expires_at || new Date(subscription.expires_at) > new Date());
  const effectivePlan: SubscriptionPlan = isActive ? plan : "free";

  const monthlyCapByPlan: Record<SubscriptionPlan, number> = {
    free: 2,
    premium_monthly: Number.POSITIVE_INFINITY,
    premium_yearly: Number.POSITIVE_INFINITY,
  };

  const used = Number(count || 0);
  const cap = monthlyCapByPlan[effectivePlan] ?? 2;
  if (used >= cap) {
    throw new Error(`Free plan limit reached (${used}/${Number.isFinite(cap) ? cap : "inf"} scans this month). Upgrade to Premium for unlimited scans.`);
  }
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

  const [step, setStep] = useState<"select" | "upload" | "review" | "analyzing" | "done">("select");
  const [selectedType, setSelectedType] = useState<AnalyzerType | null>(null);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>("preparing");
  const [analysisDetail, setAnalysisDetail] = useState("");
  const [qualitySignal, setQualitySignal] = useState<GalaxyQualitySignal | null>(null);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

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
    if (typeof window !== "undefined" && category) {
      sessionStorage.setItem("analysisCategory", category);
      sessionStorage.setItem("analysisAt", new Date().toISOString());
    }
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

  // Step 2 -> Step 3: images are captured but NOT yet submitted for
  // analysis — the user reviews them first (previously this callback went
  // straight into the AI call with no confirmation step).
  const handleImagesReady = (images: string[]) => {
    setReviewImages(images);
    setStep("review");
  };

  const runAnalysis = async (images: string[]) => {
    if (!selectedType) return;

    setStep("analyzing");
    setAnalysisStage("preparing");
    setAnalysisDetail("");
    setQualitySignal(null);

    const answers: Record<string, string> = {};
    const selectedCategory = getCategoryFromAnalyzer(selectedType);
    if (!selectedCategory) {
      throw new Error("Unsupported analyzer category for clinical protocol flow.");
    }
    const parentCategory = getParentCategoryFromChild(selectedCategory);

    try {
      if (!user) {
        throw new Error("Please log in first. Assessment and result sync require an authenticated account.");
      }

      await assertMonthlyScanLimit(user.id);

      setAnalysisStage("optimizing");
      await new Promise((resolve) => setTimeout(resolve, 250));

      setAnalysisStage("vision");
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

      setAnalysisStage("validating");
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
      if (galaxyData?.quality?.retakeRecommended) {
        setQualitySignal(galaxyData.quality);
      }

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

      setAnalysisStage("building");

      // The Vision pipeline (server-side) already persists every captured
      // image to Storage as part of analysis. Reuse those URLs instead of
      // uploading the same images again from the client. Only fall back to
      // the client upload when the server didn't provide a complete set
      // (e.g. the Galaxy fallback path, which doesn't upload anything) —
      // this preserves the exact previous behavior for that case.
      const serverUploadedUrls = galaxyData?.uploadedImageUrls;
      const serverUploadCoversAllImages =
        Array.isArray(serverUploadedUrls) &&
        serverUploadedUrls.length === images.length &&
        serverUploadedUrls.every((url) => typeof url === "string" && url.length > 0);

      const storageUpload = serverUploadCoversAllImages
        ? { urls: serverUploadedUrls as string[], paths: [] as string[], errors: [] as string[] }
        : await uploadAnalyzerImagesToSupabase({
            userId: user.id,
            category: selectedCategory,
            images,
          });

      const persistedImageUrl =
        storageUpload.urls[0] ||
        galaxyData?.annotatedImageUrl ||
        images[0];

      if (typeof window !== "undefined") {
        sessionStorage.setItem("uploadedPhotoUrls", JSON.stringify(storageUpload.urls));
      }

      const hairAnalyzers: AnalyzerType[] = ["hair", "scalp", "beard", "hair_loss", "scalp_health", "beard_growth"];
      const isHairFlow = hairAnalyzers.includes(selectedType);
      const fullScanPayload = {
        user_id: user.id,
        scan_date: new Date().toISOString(),
        image_url: persistedImageUrl,
        captured_image_urls: storageUpload.urls,
        analyzer_category: selectedCategory,
        parent_category: parentCategory,
        image_valid: imageValid,
        photo_metrics: photoMetrics,
        density_score: isHairFlow ? finalResult.confidence : null,
        inflammation_score: !isHairFlow ? Math.max(0, 100 - finalResult.confidence) : null,
        oil_balance_score: !isHairFlow ? finalResult.confidence : null,
      };

      let { error: scanInsertError } = await supabase.from("photo_scans").insert(fullScanPayload);

      if (scanInsertError) {
        const schemaMissingOptionalScoreColumn = /density_score|inflammation_score|oil_balance_score/i.test(scanInsertError.message || "");

        if (schemaMissingOptionalScoreColumn) {
          const minimalScanPayload = {
            user_id: user.id,
            scan_date: new Date().toISOString(),
            image_url: persistedImageUrl,
            captured_image_urls: storageUpload.urls,
            analyzer_category: selectedCategory,
            parent_category: parentCategory,
            image_valid: imageValid,
            photo_metrics: photoMetrics,
          };

          const retry = await supabase.from("photo_scans").insert(minimalScanPayload);
          scanInsertError = retry.error;
        }
      }

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
        console.warn("Active analysis upsert skipped:", activeAnalysisError.message);
      }

      await recalculateClinicalScores(user.id, selectedCategory);
      await hydrateUserData(user.id);

      setPendingCategory(selectedCategory);
      setStep("done");
    } catch (error) {
      console.error("Analysis failed:", error);
      const message = error instanceof Error ? error.message : "Analysis failed";
      setAnalysisDetail(message);
      setTimeout(() => setStep("review"), 1400);
    }
  };

  const continueToAssessment = () => {
    if (pendingCategory) {
      router.push(`/assessment?category=${pendingCategory}`);
    } else {
      router.push("/assessment");
    }
  };

  const categoryLabel = selectedType
    ? selectedType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  const stepIndex = { select: 1, upload: 2, review: 3, analyzing: 4, done: 5 }[step];

  return (
    <div className="af-page min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border-hairline)] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
            aria-label="Back to home"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Step indicator — Phase 7E's explicit 5-step guided workflow */}
          <div className="flex items-center gap-1.5" role="list" aria-label={`Step ${stepIndex} of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                role="listitem"
                className={`h-1.5 rounded-full transition-all ${
                  n === stepIndex ? "w-6 bg-[var(--accent-blue)]" : n < stepIndex ? "w-1.5 bg-[var(--accent-green)]" : "w-1.5 bg-[var(--border-hairline)]"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleQuestionsNavigation}
            className="rounded-lg border border-[var(--border-hairline)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--bg-wash-start)]"
          >
            Questions
          </button>
        </div>
      </header>

      <main className="af-page-frame mx-auto flex min-h-[calc(100vh-56px)] max-w-6xl flex-col justify-center px-4 py-10">
        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              <section className="af-card-primary p-8 text-center md:p-10">
                <div className="relative z-10 mx-auto max-w-3xl space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--ink)] shadow-[var(--shadow-raised)]">
                    <ScanLine className="h-7 w-7 text-white" />
                  </div>
                  <span className="af-page-kicker mx-auto">
                    <Sparkles className="h-3.5 w-3.5" />
                    Step 1 of 5 - Choose Category
                  </span>
                  <h1 className="text-clinical-heading text-3xl font-extrabold tracking-tight text-[var(--ink)] md:text-4xl">
                    Choose an area to analyze
                  </h1>
                  <p className="text-[var(--ink-soft)]">Select an analyzer mode, upload consistent angles, and move into the linked assessment.</p>
                </div>
              </section>

              <div className="af-card-secondary p-6 md:p-10">
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
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="mb-4 flex items-center gap-4">
                <button
                  onClick={() => setStep("select")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-white shadow-sm transition-colors hover:bg-[var(--bg-wash-start)]"
                  aria-label="Back to category selection"
                >
                  <ChevronLeft className="h-5 w-5 text-[var(--ink)]" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-blue)]">Step 2 of 5 - Upload Photos</p>
                  <h2 className="text-2xl font-bold text-[var(--ink)]">{categoryLabel}</h2>
                  <p className="text-sm text-[var(--ink-soft)]">Capture guided angles for stronger hotspot confidence and report quality</p>
                </div>
              </div>

              <div className="af-card-secondary p-6 md:p-10">
                <MultiAngleUpload analyzerType={selectedType || "skin"} onAllCaptured={handleImagesReady} />
              </div>
            </motion.div>
          )}

          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-blue)]">Step 3 of 5 - Review Images</p>
                <h2 className="text-2xl font-bold text-[var(--ink)]">Confirm your photos</h2>
                <p className="text-sm text-[var(--ink-soft)]">Double-check lighting and framing before we run AI Vision analysis.</p>
              </div>

              <div className="af-card-secondary p-6 md:p-10">
                {analysisDetail && (
                  <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{analysisDetail}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {reviewImages.map((src, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-white shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Captured photo ${idx + 1}`} className="h-full w-full object-cover" />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
                        <Check className="h-3 w-3" /> Ready
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-soft)]">
                  <ImageIcon className="h-3.5 w-3.5" />
                  {reviewImages.length} photo{reviewImages.length === 1 ? "" : "s"} ready for analysis
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button onClick={() => runAnalysis(reviewImages)} variant="primary" size="lg" className="flex-1 justify-center">
                    Start AI Analysis <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => setStep("upload")} variant="soft" size="lg" className="justify-center">
                    <RotateCcw className="h-4 w-4" /> Retake Photos
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center space-y-6 py-20 text-center"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-blue)]">Step 4 of 5 - AI Analysis</p>

              <div className="relative af-card-primary p-8">
                <div className="h-24 w-24 animate-spin rounded-full border-4 border-[var(--border-hairline)] border-t-[var(--accent-blue)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 animate-pulse text-[var(--accent-blue)]" />
                </div>
              </div>

              <div className="max-w-xl space-y-2" role="status" aria-live="polite">
                <h2 className="mb-2 text-2xl font-bold text-[var(--ink)]">{STAGE_COPY[analysisStage]}...</h2>
                <p className="text-sm text-[var(--ink-soft)]">This usually takes a few seconds. Please keep this tab open.</p>
              </div>

              <div className="af-card-secondary w-full max-w-md p-5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border-hairline)]">
                  <motion.div
                    className="h-full bg-[var(--accent-blue)]"
                    animate={{ width: `${STAGE_PROGRESS[analysisStage]}%` }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                  {(Object.keys(STAGE_COPY) as AnalysisStage[]).map((s) => (
                    <span key={s} className={s === analysisStage ? "text-[var(--accent-blue)]" : ""}>
                      {STAGE_PROGRESS[s]}%
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center space-y-6 py-20 text-center"
              role="status"
              aria-live="polite"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-blue)]">Step 5 of 5 - Continue to Assessment</p>

              <div className="af-card-primary flex h-24 w-24 items-center justify-center p-0">
                <Check className="h-10 w-10 text-[var(--accent-green)]" />
              </div>

              <div className="max-w-xl space-y-2">
                <h2 className="text-2xl font-bold text-[var(--ink)]">Analysis Complete</h2>
                <p className="text-sm text-[var(--ink-soft)]">Your photos have been analyzed and saved. Continue to the assessment to build your personalized recovery plan.</p>
              </div>

              {qualitySignal?.retakeRecommended && (
                <div className="flex max-w-md items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Photo quality could be better next time</p>
                    <p className="mt-1 text-xs leading-relaxed">
                      {qualitySignal.reason || "Lighting, angle, or focus made this analysis less reliable."} This result was still saved — you can continue now or retake for a stronger baseline.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={continueToAssessment} variant="primary" size="lg" className="justify-center">
                  Continue to Assessment <ArrowRight className="h-4 w-4" />
                </Button>
                {qualitySignal?.retakeRecommended && (
                  <Button onClick={() => setStep("upload")} variant="soft" size="lg" className="justify-center">
                    <RotateCcw className="h-4 w-4" /> Retake Photos
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
