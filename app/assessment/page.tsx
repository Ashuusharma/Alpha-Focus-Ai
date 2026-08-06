"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Clock, Languages, PartyPopper } from "lucide-react";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { recalculateClinicalScores } from "@/lib/recalculateClinicalScores";
import { categories, CategoryId, domainMeta, categoryIntro, questions, type ClinicalCategoryId } from "@/lib/questions";
import { getParentCategoryFromChild, resolveClinicalChildCategoryFromAny } from "@/lib/categorySync";
import { getRecoveryLevelDisplay, normalizeRecoveryLevel, type ProtocolToleranceMode } from "@/lib/protocolTemplates";
import { getRecoveryProgramLevel, saveRecoveryProgramLevel } from "@/lib/userProfile";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import { useLanguage, pickLang } from "@/lib/languageContext";
import Button from "@/components/ui/Button";
import GlobalPageSkeleton from "@/app/_components/GlobalPageSkeleton";
import AILaboratory from "@/app/assessment/_components/AILaboratory";
import AnswerCard from "@/components/ui/AnswerCard";
import Timeline, { type TimelineStep } from "@/components/ui/Timeline";
import AISummary, { type AISummaryItem, type RelevanceTier } from "@/components/ui/AISummary";
import LoadingExperience from "@/components/ui/LoadingExperience";

/** Real, existing weight (0.9-1.5) bucketed into a display tier — replaces
 * the old getClinicalRelevance() lookup, which keyed off question ids from
 * a schema that no longer matches any real id and always fell back to
 * "Moderate". This derives the badge from data that's actually there. */
function relevanceTierFromWeight(weight: number): "High" | "Moderate" | "Low" {
  if (weight >= 1.3) return "High";
  if (weight >= 1.05) return "Moderate";
  return "Low";
}

const HOUR_24_MS = 24 * 60 * 60 * 1000;
// Presentational only — an estimate shown to set expectations, not tied to
// any real timing measurement or business logic.
const SECONDS_PER_QUESTION_ESTIMATE = 15;

type SubmitStage = "idle" | "preparing" | "profile" | "generating" | "validating" | "ready";

// Every stage is tied to a real, already-existing await in handleSubmit
// (see the matching comment at each call site) - no fabricated progress.
// "ready" is the one exception: a brief terminal beat shown only after
// success is already confirmed, before the redirect - not a claim about
// work still happening. Labels chosen to read as a premium AI moment
// rather than a technical status line, while still describing the real
// work at each stage — not 6 fabricated stages, exactly the 5 real ones.
const SUBMIT_STAGE_COPY: Record<Exclude<SubmitStage, "idle">, string> = {
  preparing: "Understanding your details",
  profile: "Combining your medical signals",
  generating: "Building your recovery roadmap",
  validating: "Running quality checks",
  ready: "Finalizing your recommendations",
};
const SUBMIT_STAGE_COPY_HI: Record<Exclude<SubmitStage, "idle">, string> = {
  preparing: "आपकी जानकारी समझी जा रही है",
  profile: "मेडिकल संकेतों को जोड़ा जा रहा है",
  generating: "आपकी रिकवरी योजना बनाई जा रही है",
  validating: "गुणवत्ता जांच की जा रही है",
  ready: "आपकी सिफारिशें तैयार की जा रही हैं",
};

function getCategoryLabel(categoryId: CategoryId) {
  return categories.find((category) => category.id === categoryId)?.label || categoryId;
}

// Encouraging microcopy tied to real progress milestones — not decorative
// filler, each threshold reflects the actual answeredCount/total ratio.
function getEncouragementCopy(progressPercent: number, isLastQuestion: boolean): string {
  if (isLastQuestion) return "🎉 Just one more question.";
  if (progressPercent >= 75) return "🚀 Almost there — final stretch.";
  if (progressPercent >= 50) return "✨ Great pace — you're halfway through.";
  if (progressPercent >= 25) return "🌱 You're doing great, keep going.";
  return "❤️ Let's get to know your recovery profile.";
}
function getEncouragementCopyHi(progressPercent: number, isLastQuestion: boolean): string {
  if (isLastQuestion) return "🎉 बस एक और सवाल बाकी है।";
  if (progressPercent >= 75) return "🚀 लगभग पूरा हो गया — बस थोड़ा और।";
  if (progressPercent >= 50) return "✨ अच्छी रफ़्तार — आधा काम हो गया।";
  if (progressPercent >= 25) return "🌱 बहुत बढ़िया, ऐसे ही आगे बढ़ें।";
  return "❤️ चलिए आपकी रिकवरी प्रोफ़ाइल समझते हैं।";
}

function getClinicalContextMessage(categoryId: CategoryId, photoMetrics: Record<string, unknown> | null) {
  const baseByCategory: Record<string, string> = {
    scalp_health: "We detected scalp imbalance indicators. Let's validate inflammation, shedding, sleep, and stress triggers.",
    acne: "We detected acne-pattern inflammation. Let's validate hormonal, stress, diet, and pore-congestion drivers.",
    dark_circles: "We detected under-eye stress signals. Let's validate sleep debt, hydration, and vascular stress factors.",
    hair_loss: "We detected hair-density risk patterns. Let's validate shedding rate, hormonal risk, and recovery friction.",
    beard_growth: "We detected beard growth variability. Let's validate density blockers, irritation, and grooming consistency.",
    body_acne: "We detected body-acne markers. Let's validate sweat load, friction, and hygiene consistency.",
    lip_care: "We detected lip barrier stress. Let's validate hydration, pigmentation, and UV exposure patterns.",
    anti_aging: "We detected early aging markers. Let's validate elasticity, UV load, and oxidative stress contributors.",
  };

  const base = baseByCategory[categoryId] || "Let's validate your lifestyle and behavior drivers.";
  if (!photoMetrics) return base;

  const numericValues = Object.values(photoMetrics)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const avgSignal = numericValues.length > 0
    ? Math.round(numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length)
    : null;

  if (avgSignal === null) return base;
  if (avgSignal >= 70) return `${base} Current signal intensity appears elevated.`;
  if (avgSignal >= 45) return `${base} Current signal intensity appears moderate.`;
  return `${base} Current signal intensity appears mild.`;
}

function hasRecentSessionScanForCategory(categoryId: CategoryId) {
  if (typeof window === "undefined") return false;

  const analysisCategory = sessionStorage.getItem("analysisCategory");
  const analysisAt = sessionStorage.getItem("analysisAt");
  const photoAnalysisRaw = sessionStorage.getItem("photoAnalysis");

  if (!analysisCategory || analysisCategory !== categoryId) return false;
  if (!analysisAt || !photoAnalysisRaw) return false;

  const ts = new Date(analysisAt).getTime();
  if (!Number.isFinite(ts)) return false;

  return Date.now() - ts <= HOUR_24_MS;
}

function getRecentSessionCategory(): CategoryId | null {
  if (typeof window === "undefined") return null;

  const analysisCategory = sessionStorage.getItem("analysisCategory") as CategoryId | null;
  const analysisAt = sessionStorage.getItem("analysisAt");
  const photoAnalysisRaw = sessionStorage.getItem("photoAnalysis");

  if (!analysisCategory || !analysisAt || !photoAnalysisRaw) return null;
  if (!questions[analysisCategory]) return null;

  const ts = new Date(analysisAt).getTime();
  if (!Number.isFinite(ts)) return null;
  if (Date.now() - ts > HOUR_24_MS) return null;

  return analysisCategory;
}

function getRecentSessionParentCategory() {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem("analysisParentCategory");
  return value || null;
}

function getRecentSessionRecoveryLevel() {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem("recoveryProgramLevel");
  return value ? normalizeRecoveryLevel(value) : null;
}

export default function AssessmentPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useContext(AuthContext);
  const { language, setLanguage } = useLanguage();
  const isHi = language === "hi";

  const [loading, setLoading] = useState(true);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<SubmitStage>("idle");
  const [clinicalContextMessage, setClinicalContextMessage] = useState<string>("");
  const [selectedProgramLevel, setSelectedProgramLevel] = useState<ProtocolToleranceMode>("intermediate");
  // Purely presentational gate — a Welcome/orientation moment before the
  // question flow starts. No data implications; flips once per page load.
  const [hasStarted, setHasStarted] = useState(false);
  // Purely presentational gate — lets the user glance back over their
  // answers (and jump back to edit any of them) before the real submit
  // fires. Does not touch handleSubmit or any scoring/storage logic.
  const [showReview, setShowReview] = useState(false);

  const categoryQuestions = useMemo(() => {
    if (!activeCategory) return [];
    return questions[activeCategory] || [];
  }, [activeCategory]);

  const answeredCount = useMemo(
    () => categoryQuestions.filter((question) => Boolean(answers[question.id])).length,
    [answers, categoryQuestions]
  );

  const progressPercent = categoryQuestions.length > 0
    ? Math.round((answeredCount / categoryQuestions.length) * 100)
    : 0;

  const estimatedMinutes = Math.max(1, Math.ceil((categoryQuestions.length * SECONDS_PER_QUESTION_ESTIMATE) / 60));
  const estimatedMinutesRemaining = Math.max(
    0,
    Math.ceil(((categoryQuestions.length - activeQuestionIndex) * SECONDS_PER_QUESTION_ESTIMATE) / 60)
  );

  useEffect(() => {
    async function validateFlow() {
      if (!user) {
        setBlockedMessage("Please log in to continue assessment.");
        setLoading(false);
        return;
      }

      const categoryFromQuery = params?.get("category");
      const levelFromQuery = params?.get("level");

      const { data: activeAnalysis } = await supabase
        .from("user_active_analysis")
        .select("selected_category,parent_category,selected_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const sessionCategory = getRecentSessionCategory();
      const selectedCategory = resolveClinicalChildCategoryFromAny(
        categoryFromQuery || activeAnalysis?.selected_category || null,
        sessionCategory || null
      );
      const parentCategory = selectedCategory
        ? getParentCategoryFromChild(selectedCategory)
        : (getRecentSessionParentCategory() || activeAnalysis?.parent_category || null);
      const resolvedLevel = normalizeRecoveryLevel(levelFromQuery || getRecentSessionRecoveryLevel() || getRecoveryProgramLevel());

      if (!selectedCategory || !questions[selectedCategory]) {
        setBlockedMessage("Start from analyzer and select a valid category first.");
        setLoading(false);
        return;
      }

      const threshold = new Date(Date.now() - HOUR_24_MS).toISOString();
      const { data: latestScan } = await supabase
        .from("photo_scans")
        .select("id,scan_date,image_valid,photo_metrics")
        .eq("user_id", user.id)
        .eq("analyzer_category", selectedCategory)
        .eq("image_valid", true)
        .gte("scan_date", threshold)
        .order("scan_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestScan?.id) {
        const hasSessionScan = hasRecentSessionScanForCategory(selectedCategory);
        if (!hasSessionScan) {
          setBlockedMessage("Assessment is locked. Upload and validate a photo scan for this category within the last 24 hours.");
          setLoading(false);
          return;
        }
      }

      const sessionFallbackMessage = "Live scan row not found yet, using your latest analyzer session data.";
      setClinicalContextMessage(
        latestScan?.id
          ? getClinicalContextMessage(
              selectedCategory,
              (latestScan?.photo_metrics || null) as Record<string, unknown> | null
            )
          : `${getClinicalContextMessage(selectedCategory, null)} ${sessionFallbackMessage}`
      );

      await supabase
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

      setActiveCategory(selectedCategory);
      setSelectedProgramLevel(resolvedLevel);
      setBlockedMessage(null);
      setLoading(false);
    }

    validateFlow();
  }, [params, user]);

  const activeQuestion = categoryQuestions[activeQuestionIndex];
  const selectedLevelMeta = getRecoveryLevelDisplay(selectedProgramLevel);

  // Section grouping: consecutive questions sharing the same domain are
  // presented as one visual "section" (no change to the underlying flow —
  // still one question at a time, same order).
  const currentSectionStartIndex = useMemo(() => {
    if (!activeQuestion) return activeQuestionIndex;
    let start = activeQuestionIndex;
    while (start > 0 && categoryQuestions[start - 1]?.domain === activeQuestion.domain) start -= 1;
    return start;
  }, [activeQuestion, activeQuestionIndex, categoryQuestions]);
  const isNewSection = activeQuestionIndex === currentSectionStartIndex;

  const handleSelectProgramLevel = (level: ProtocolToleranceMode) => {
    const normalized = normalizeRecoveryLevel(level);
    setSelectedProgramLevel(normalized);
    saveRecoveryProgramLevel(normalized);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("recoveryProgramLevel", normalized);
    }
  };

  const handleSelectAnswer = (label: string) => {
    if (!activeQuestion) return;
    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: label }));
  };

  const handleContinue = () => {
    if (activeQuestionIndex < categoryQuestions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex((prev) => prev - 1);
      return;
    }
    router.push("/image-analyzer");
  };

  const handleSubmit = async () => {
    if (!user || !activeCategory || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitStage("preparing"); // Stage 1: about to build + insert the assessment payload below.

    try {
      const answersWithScore = categoryQuestions.map((question) => {
        const selectedLabel = answers[question.id];
        const selectedOption = question.options.find((option) => option.label === selectedLabel);
        return {
          question_id: question.id,
          domain: question.domain,
          weight: question.weight,
          selected_label: selectedLabel || null,
          selected_score: selectedOption?.score ?? null,
        };
      });

      const completenessPct = categoryQuestions.length > 0
        ? Math.round((answeredCount / categoryQuestions.length) * 100)
        : 0;

      const fullAssessmentPayload = {
        user_id: user.id,
        category: activeCategory,
        parent_category: getParentCategoryFromChild(activeCategory),
        completed_at: new Date().toISOString(),
        completeness_pct: completenessPct,
        answers,
        answer_scores: answersWithScore,
      };

      let { error: assessmentInsertError } = await supabase.from("assessment_answers").insert(fullAssessmentPayload);

      if (assessmentInsertError) {
        const schemaMissingOptionalColumns = /completeness_pct|parent_category|answer_scores/i.test(assessmentInsertError.message || "");
        if (schemaMissingOptionalColumns) {
          const minimalAssessmentPayload = {
            user_id: user.id,
            category: activeCategory,
            completed_at: new Date().toISOString(),
            answers,
          };
          const retry = await supabase.from("assessment_answers").insert(minimalAssessmentPayload);
          assessmentInsertError = retry.error;
        }
      }

      if (assessmentInsertError) {
        throw new Error(`Could not save assessment: ${assessmentInsertError.message}`);
      }

      setSubmitStage("profile"); // Stage 2: recalculating clinical scores + hydrating store data below.
      await recalculateClinicalScores(user.id, activeCategory);
      await hydrateUserData(user.id);

      setSubmitStage("generating"); // Stage 3: the actual AI protocol generation call below.
      const protocolHeaders = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
      const shouldUseAsyncProtocolGeneration = true;
      console.info("[assessment] sending_generate_request", {
        asyncValue: shouldUseAsyncProtocolGeneration,
        nodeEnv: process.env.NODE_ENV,
      });
      const protocolResponse = await fetch("/api/protocol/generate", {
        method: "POST",
        headers: protocolHeaders,
        body: JSON.stringify({
          finalSubmission: true,
          category: activeCategory,
          answers,
          async: shouldUseAsyncProtocolGeneration,
          programContext: {
            toleranceMode: selectedProgramLevel,
          },
        }),
      });

      console.info("[assessment] generate_response", {
        status: protocolResponse.status,
        ok: protocolResponse.ok,
      });

      setSubmitStage("validating"); // Stage 4: validating the response below, same checks as before.
      const protocolPayload = (await protocolResponse.json()) as {
        ok?: boolean;
        reportId?: string;
        error?: string;
      };

      if (!protocolResponse.ok || !protocolPayload?.ok || !protocolPayload.reportId) {
        throw new Error(protocolPayload?.error || "protocol_generate_failed");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("recoveryProgramLevel", selectedProgramLevel);
        sessionStorage.setItem("protocolReportId", protocolPayload.reportId);
      }
      saveRecoveryProgramLevel(selectedProgramLevel);

      // Success is already confirmed at this point - "ready" is a brief
      // completion beat, not a claim about pending work.
      setSubmitStage("ready");
      await new Promise((resolve) => setTimeout(resolve, 550));
      router.push(`/result?category=${activeCategory}&level=${selectedProgramLevel}`);
    } catch (error) {
      console.error("Assessment submit failed", error);
      setBlockedMessage("Could not submit assessment. Please retry.");
      setSubmitStage("idle");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <GlobalPageSkeleton message="Preparing your AI Laboratory" />;
  }

  // No dead-end lock screen: whenever there's no valid category + fresh scan
  // to run an assessment against, the AI Laboratory is shown instead — it
  // always has a concrete next action (start a scan, pick an analyzer).
  if (blockedMessage || !activeCategory) {
    return <AILaboratory userId={user?.id || null} />;
  }

  const isAnswered = Boolean(activeQuestion && answers[activeQuestion.id]);
  const isLastQuestion = activeQuestionIndex === categoryQuestions.length - 1;
  const belowSubmitThreshold = progressPercent < 60;

  // Protocol generation in progress — a dedicated staged loading journey
  // (Phase 7F, restyled 7ZB), replacing the old inline "Compiling Report..."
  // button text with named, human stages instead of technical status text.
  if (isSubmitting) {
    const stageOrder: Exclude<SubmitStage, "idle">[] = ["preparing", "profile", "generating", "validating", "ready"];
    const currentIndex = submitStage === "idle" ? 0 : stageOrder.indexOf(submitStage);
    const isReady = submitStage === "ready";

    const submittingJourneySteps: TimelineStep[] = [
      { label: isHi ? "स्कैन" : "Scan", status: "done" },
      { label: isHi ? "सवाल" : "Questions", status: "done" },
      { label: isHi ? "AI सोच" : "AI Reasoning", status: isReady ? "done" : "current", progressWithinStep: 60 },
      { label: isHi ? "रिकवरी प्लान" : "Recovery Plan", status: isReady ? "current" : "upcoming" },
    ];

    const stageLabels = stageOrder.map((stage) => (isHi ? SUBMIT_STAGE_COPY_HI[stage] : SUBMIT_STAGE_COPY[stage]));

    return (
      <div className="af-page flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
        <div className="mb-8 w-full max-w-xs">
          <Timeline steps={submittingJourneySteps} />
        </div>
        <LoadingExperience
          stages={stageLabels}
          currentIndex={currentIndex}
          isComplete={isReady}
          completeLabel={isHi ? SUBMIT_STAGE_COPY_HI.ready : SUBMIT_STAGE_COPY.ready}
          helperText={isHi ? "इसमें आमतौर पर एक मिनट से कम समय लगता है। कृपया यह टैब खुला रखें।" : "This usually takes under a minute. Please keep this tab open."}
          completeHelperText={isHi ? "आपको आपकी रिकवरी योजना पर ले जाया जा रहा है।" : "Taking you to your recovery protocol."}
        />
      </div>
    );
  }

  // Welcome / orientation moment — shown once before the question flow
  // starts. Purely presentational; flips a local boolean, no data changes.
  if (!hasStarted) {
    const intro = categoryIntro[activeCategory as ClinicalCategoryId];

    return (
      <div className="af-page min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="af-card-primary relative w-full p-8 md:p-10">
            <button
              type="button"
              onClick={() => setLanguage(isHi ? "en" : "hi")}
              className="absolute right-4 top-4 inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent-blue)]"
              aria-label={isHi ? "Switch to English" : "हिन्दी में बदलें"}
            >
              <Languages className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
              {isHi ? "English" : "हिन्दी"}
            </button>

            <span className="af-page-kicker mx-auto">
              <Sparkles className="h-3.5 w-3.5" />
              {getCategoryLabel(activeCategory)} {isHi ? "असेसमेंट" : "Assessment"}
            </span>
            <h1 className="text-clinical-heading mt-4 text-3xl font-extrabold text-[var(--ink)]" lang={isHi ? "hi" : undefined}>
              {intro ? pickLang(intro.title, intro.titleHi, language) : (isHi ? "चलिए आपकी रिकवरी योजना बनाते हैं" : "Let's build your recovery plan")}
            </h1>
            {intro && (
              <p className="mt-1 text-sm font-medium text-[var(--accent-blue)]" lang={isHi ? "hi" : undefined}>
                {pickLang(intro.tagline, intro.taglineHi, language)}
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]" lang={isHi ? "hi" : undefined}>
              {intro ? pickLang(intro.description, intro.descriptionHi, language) : clinicalContextMessage}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="af-surface-soft flex items-center gap-3 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-blue)]" />
                <div className="text-left">
                  <p className="text-lg font-bold text-[var(--ink)]">{categoryQuestions.length}</p>
                  <p className="text-xs text-[var(--ink-soft)]">{isHi ? "सवाल" : "Questions"}</p>
                </div>
              </div>
              <div className="af-surface-soft flex items-center gap-3 p-4">
                <Clock className="h-5 w-5 shrink-0 text-[var(--accent-blue)]" />
                <div className="text-left">
                  <p className="text-lg font-bold text-[var(--ink)]">~{estimatedMinutes} {isHi ? "मिनट" : "min"}</p>
                  <p className="text-xs text-[var(--ink-soft)]">{isHi ? "अनुमानित समय" : "Estimated time"}</p>
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs text-[var(--ink-soft)]">
              {isHi
                ? "पिछले 2-4 हफ्तों के आधार पर ईमानदारी से जवाब दें — इससे आपकी हर सिफारिश तय होगी।"
                : "Answer honestly based on the last 2-4 weeks — this shapes every recommendation in your protocol."}
            </p>

            {/* Recovery pace — asked once up front, like a preference, not
                repeated as a control on every question card. */}
            <div className="af-surface-soft mt-6 p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                {isHi ? "अपनी रिकवरी की रफ़्तार चुनें" : "Choose your recovery pace"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Recovery track">
                {(["beginner", "intermediate", "advanced"] as ProtocolToleranceMode[]).map((level) => {
                  const option = getRecoveryLevelDisplay(level);
                  const active = selectedProgramLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => handleSelectProgramLevel(level)}
                      className={`min-h-[44px] rounded-xl px-4 py-2 text-left transition-all ${active ? "bg-[var(--accent-blue)] text-white" : "bg-white text-[var(--ink)] hover:bg-[var(--bg-wash-start)]"}`}
                    >
                      <span className="block text-[10px] font-black uppercase tracking-widest">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[var(--ink-soft)]">{selectedLevelMeta.description}</p>
            </div>

            <Button onClick={() => setHasStarted(true)} variant="primary" size="lg" className="mt-6 w-full justify-center">
              {isHi ? "असेसमेंट शुरू करें" : "Begin Assessment"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Review-answers step — a purely presentational gate between the last
  // question and the real submit. Every entry can jump back to edit that
  // answer; "Generate Recovery Plan" calls the same unmodified handleSubmit
  // used everywhere else, nothing about scoring/storage changes here.
  if (showReview) {
    // Tier-sorted (High relevance first) instead of chronological — the
    // grouping and "signals we noticed" framing are new; every answer
    // shown is the real selected label, and clicking a row still jumps
    // back to that exact question. No new scoring, no AI call.
    const summaryItems: AISummaryItem[] = categoryQuestions.map((question, index) => {
      const selectedLabel = answers[question.id];
      const selectedOption = question.options.find((option) => option.label === selectedLabel);
      return {
        key: question.id,
        emoji: question.emoji,
        label: pickLang(
          domainMeta[question.domain]?.label || question.domain.replace(/_/g, " "),
          domainMeta[question.domain]?.labelHi,
          language
        ),
        answer: selectedOption
          ? pickLang(selectedOption.label, selectedOption.labelHi, language)
          : isHi ? "जवाब नहीं दिया" : "Not answered",
        tier: relevanceTierFromWeight(question.weight) as RelevanceTier,
        onClick: () => {
          setActiveQuestionIndex(index);
          setShowReview(false);
        },
        lang: isHi ? "hi" : undefined,
      };
    });
    const highSignalCount = summaryItems.filter((item) => item.tier === "High").length;

    return (
      <div className="af-page min-h-screen">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:py-12">
          <div className="af-card-primary w-full p-6 text-center sm:p-10">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-green)]/15"
            >
              <PartyPopper className="h-8 w-8 text-[var(--accent-green)]" />
            </motion.div>
            <h1 className="text-clinical-heading mt-4 text-2xl font-extrabold text-[var(--ink)]">
              {isHi ? "🎉 असेसमेंट पूरा हुआ!" : "🎉 Assessment Complete!"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
              {highSignalCount > 0
                ? isHi
                  ? `हमें आपके जवाबों में ${highSignalCount} अहम संकेत मिले। भेजने से पहले एक नज़र डाल लें।`
                  : `We found ${highSignalCount} high-relevance signal${highSignalCount === 1 ? "" : "s"} in your answers. Take a quick look before we generate your plan.`
                : isHi
                  ? "अब हम आपकी रिकवरी प्रोफ़ाइल को समझ चुके हैं। भेजने से पहले अपने जवाब देख लें।"
                  : "We now understand your recovery profile. Take a quick look before we generate your plan."}
            </p>
          </div>

          <div className="mt-8">
            <AISummary
              items={summaryItems}
              tierLabels={{
                High: isHi ? "अहम संकेत" : "High-relevance signals",
                Moderate: isHi ? "सामान्य संकेत" : "Moderate signals",
                Low: isHi ? "अन्य जवाब" : "Other answers",
              }}
              editLabel={isHi ? "बदलें" : "Edit"}
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
            <Button onClick={handleSubmit} variant="primary" size="lg" className="justify-center sm:flex-1">
              <CheckCircle2 className="h-4 w-4" />
              {isHi ? "रिकवरी प्लान बनाएं" : "Generate Recovery Plan"}
            </Button>
            <Button onClick={() => setShowReview(false)} variant="outline" size="lg" className="justify-center sm:flex-1">
              <ArrowLeft className="h-4 w-4" />
              {isHi ? "जवाब बदलें" : "Edit Answers"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const journeySteps: TimelineStep[] = [
    { label: isHi ? "स्कैन" : "Scan", status: "done" },
    { label: isHi ? "सवाल" : "Questions", status: "current", progressWithinStep: progressPercent },
    { label: isHi ? "AI सोच" : "AI Reasoning", status: "upcoming" },
    { label: isHi ? "रिकवरी प्लान" : "Recovery Plan", status: "upcoming" },
  ];

  return (
    <div className="af-page flex min-h-screen w-full flex-col animate-in fade-in duration-700">
      {/* HEADER — one clear journey (Timeline) instead of four separate
          progress signals (ring + chip + bar) competing for attention. */}
      <div className="sticky top-0 z-30 border-b border-[var(--border-hairline)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-clinical-heading truncate text-base font-extrabold tracking-tight text-[var(--ink)] sm:text-lg">
              {getCategoryLabel(activeCategory)} {isHi ? "असेसमेंट" : "Assessment"}
            </h1>
            <button
              type="button"
              onClick={() => setLanguage(isHi ? "en" : "hi")}
              className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent-blue)]"
              aria-label={isHi ? "Switch to English" : "हिन्दी में बदलें"}
            >
              <Languages className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
              {isHi ? "English" : "हिन्दी"}
            </button>
          </div>

          <Timeline steps={journeySteps} />

          <AnimatePresence mode="wait">
            <motion.p
              key={isHi ? getEncouragementCopyHi(progressPercent, isLastQuestion) : getEncouragementCopy(progressPercent, isLastQuestion)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-center text-xs font-semibold text-[var(--accent-green)] sm:text-left"
              lang={isHi ? "hi" : undefined}
            >
              {isHi ? getEncouragementCopyHi(progressPercent, isLastQuestion) : getEncouragementCopy(progressPercent, isLastQuestion)}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <main className="relative mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10 pb-28 md:pb-10">
        {/* Glow effect */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[var(--accent-blue-soft)]/25 blur-[120px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {activeQuestion && (
            <motion.div
              key={activeQuestion.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="af-surface-card relative space-y-7 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
                <button
                  onClick={handleBack}
                  className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold text-[var(--ink)] hover:text-[var(--accent-blue)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> {isHi ? "पीछे" : "Back"}
                </button>
                <div className="flex items-center gap-1.5 rounded-full bg-[var(--tint-warm)] px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-blue-soft)] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-blue)]">
                    {isHi
                      ? { High: "उच्च", Moderate: "मध्यम", Low: "कम" }[relevanceTierFromWeight(activeQuestion.weight)] + " प्रासंगिकता"
                      : `${relevanceTierFromWeight(activeQuestion.weight)} relevance`}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Section marker — only shown when the topic domain
                    changes, giving a "moving through distinct sections"
                    feel without altering the underlying one-question-at-a-
                    time flow. Doubles as the topic label otherwise shown. */}
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-green)]" lang={isHi ? "hi" : undefined}>
                  {isNewSection ? `${isHi ? "सेक्शन" : "Section"} — ` : ""}
                  {pickLang(
                    domainMeta[activeQuestion.domain]?.label || activeQuestion.domain.replace(/_/g, " "),
                    domainMeta[activeQuestion.domain]?.labelHi,
                    language
                  )}
                  <span className="ml-2 font-bold normal-case tracking-normal text-[var(--ink-soft)]">
                    · {isHi ? "सवाल" : "Question"} {activeQuestionIndex + 1}/{categoryQuestions.length}
                  </span>
                </p>

                <h2 className="text-2xl font-bold leading-[1.25] tracking-tight text-[var(--ink)] sm:text-3xl" lang={isHi ? "hi" : undefined}>
                  {activeQuestion.emoji ? <span className="mr-2">{activeQuestion.emoji}</span> : null}
                  {pickLang(activeQuestion.text, activeQuestion.textHi, language)}
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-soft)]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--accent-blue)]" /> {isHi ? `लगभग ${estimatedMinutesRemaining} मिनट बाकी` : `About ${estimatedMinutesRemaining} min left`}
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-[var(--border-hairline)] sm:block" />
                  <span>{isHi ? "पिछले 2-4 हफ्तों के आधार पर जवाब दें।" : "Answer based on recent 2-4 weeks."}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2" role="radiogroup" aria-label={activeQuestion.text}>
                {activeQuestion.options.map((option) => (
                  <AnswerCard
                    key={option.label}
                    label={pickLang(option.label, option.labelHi, language)}
                    selected={answers[activeQuestion.id] === option.label}
                    onClick={() => handleSelectAnswer(option.label)}
                    lang={isHi ? "hi" : undefined}
                  />
                ))}
              </div>

              {/* Sticky on mobile so Next/Submit stays reachable without
                  scrolling back down a long option list; static on desktop. */}
              <div className="sticky bottom-4 z-10 -mx-6 -mb-6 flex flex-col gap-2 border-t border-[var(--border-hairline)] bg-white/95 px-6 py-4 backdrop-blur md:static md:mx-0 md:mb-0 md:border-0 md:bg-transparent md:p-0 md:pt-6">
                {isLastQuestion && belowSubmitThreshold && (
                  <p className="text-xs text-[var(--ink-soft)]">
                    {isHi
                      ? `अपनी योजना बनाने के लिए कम से कम 60% सवालों के जवाब दें (अभी तक ${answeredCount}/${categoryQuestions.length})।`
                      : `Answer at least 60% of questions to generate your protocol (${answeredCount}/${categoryQuestions.length} so far).`}
                  </p>
                )}
                <div className="flex justify-end">
                  {!isLastQuestion ? (
                    <Button onClick={handleContinue} disabled={!isAnswered} variant="soft">
                      {isHi ? "अगला सवाल" : "Next Question"} <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button onClick={() => setShowReview(true)} disabled={!isAnswered || belowSubmitThreshold} variant="primary">
                      <CheckCircle2 className="w-4 h-4" />
                      {isHi ? "जवाब देखें" : "Review Answers"}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
