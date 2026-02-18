"use client";

import { useMemo, useState, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronDown, ArrowLeft, Sparkles, CheckCircle2, Info } from "lucide-react";
import { categories, questions, CategoryId } from "@/lib/questions";
import { setScopedSessionItem } from "@/lib/userScopedStorage";
import {
    getCategoryImageCandidates,
    getClinicalRelevance,
    getQuestionContextOverride,
    getQuestionImageCandidates,
    getQuestionLabel,
} from "@/lib/assessmentContentMap";

const QUESTION_CONTEXT: Record<string, string> = {
    hair_concern: "We use this to identify active scalp stress and common shedding triggers.",
    hair_type: "Hair density helps estimate current growth baseline and support needed.",
    scalp_type: "Scalp feel indicates oil balance, dryness and irritation risk.",
    hair_damage: "Styling frequency reflects external stress on scalp and hair shafts.",
    hair_goal: "Your goal sets recommendation priority for the next 6-8 weeks.",
    skin_type: "Midday skin feel reveals hydration and oil-control balance.",
    skin_concern: "This helps prioritize acne, pigmentation or early-aging pathways.",
    breakouts: "Breakout frequency helps measure inflammation pattern and urgency.",
    sun_exposure: "UV load is a key driver of pigmentation and visible aging.",
    skin_goal: "Goal alignment improves routine relevance and consistency.",
    beard_growth: "Growth pattern shows density behavior and stimulation need.",
    beard_issue: "Comfort issues signal irritation, dryness or ingrown tendency.",
    beard_length: "Length impacts cleansing, hydration and styling method.",
    beard_care: "Routine consistency predicts speed of visible beard improvement.",
    beard_goal: "Your goal controls what we optimize first in beard care.",
    body_skin: "Post-shower skin feel indicates barrier and moisture status.",
    body_issue: "Persistent issue helps identify odor, acne or dryness drivers.",
    sweat: "Sweat profile guides freshness and anti-irritation planning.",
    shower_freq: "Cleansing frequency affects odor control and barrier resilience.",
    body_goal: "Outcome preference directs the body-care routine sequence.",
    energy: "Energy patterns can reflect recovery quality and lifestyle load.",
    sleep: "Sleep quality is strongly linked with skin repair and under-eye recovery.",
    stress: "Stress can influence inflammation, breakouts and shedding.",
    diet: "Food quality patterns impact skin clarity and recovery pace.",
    health_goal: "A clear health target improves adherence and visible outcomes.",
    activity: "Activity level helps calibrate recovery and care rhythm.",
    workout: "Training frequency affects sweat exposure and repair needs.",
    goal: "Fitness objective aligns support with your body goals.",
    injury: "Pain or injury status shapes safe progression recommendations.",
    fitness_focus: "Focus area helps us prioritize your most important gains.",
    scent_type: "Scent preference defines your fragrance identity baseline.",
    usage: "Usage timing helps optimize concentration and wear style.",
    strength: "Projection preference balances subtlety versus strong presence.",
    climate: "Climate changes fragrance performance and longevity.",
    fragrance_goal: "Desired fragrance result guides personalized scent direction.",
};

function getQuestionContext(questionId: string): string {
    return getQuestionContextOverride(questionId) || QUESTION_CONTEXT[questionId] || "This question improves recommendation precision for your profile.";
}

function getOptionInsight(questionId: string, option: string): string {
    const value = option.toLowerCase();
    const id = questionId.toLowerCase();

    if (/(high|frequent|poor|low\/fatigued|patchy|oily|dry|itchy|dandruff|acne|processed|high sugar|noticeably reduced|yes \(active\)|body acne|hair fall|thinning)/.test(value)) {
        return "This may indicate an active concern that needs focused correction and tighter routine consistency.";
    }
    if (/(moderate|sometimes|average|mixed|medium|2-4 days\/week|alternate days|some days only|past history only)/.test(value)) {
        return "This suggests a manageable pattern that can improve with targeted adjustments and consistency.";
    }
    if (/(balanced|good|rarely|low|full and even|daily|active most days|high\/stable|no|restorative|mostly balanced whole foods)/.test(value)) {
        return "This usually reflects a stable baseline where maintenance and optimization become the main focus.";
    }
    if (/(goal|focus|outcome)/.test(id)) {
        return "This choice helps us prioritize your personalized action plan in the right order.";
    }
    return "This response helps us infer what issue pattern you may be experiencing currently.";
}

function getQuestionImage(categoryId: CategoryId, questionId: string, defaultImage?: string): string {
    return getQuestionImageCandidates(categoryId, questionId, defaultImage)[0] || "/images/question-fallback.svg";
}

function getClinicalTagClass(relevance: "Low" | "Moderate" | "High"): string {
    if (relevance === "High") return "border-red-400/40 bg-red-500/10 text-red-300";
    if (relevance === "Low") return "border-emerald-400/40 bg-emerald-500/10 text-emerald-300";
    return "border-amber-400/40 bg-amber-500/10 text-amber-300";
}

function handleGuardedImageError(event: SyntheticEvent<HTMLImageElement>) {
    const target = event.currentTarget;
    const fallbackRaw = target.dataset.fallbacks || "";
    const fallbacks = fallbackRaw.split("|").map((item) => item.trim()).filter(Boolean);
    const currentSrc = target.getAttribute("src") || "";
    const currentIndex = fallbacks.findIndex((item) => currentSrc.includes(item));
    const nextCandidate = currentIndex >= 0 ? fallbacks[currentIndex + 1] : fallbacks[0];

    if (!nextCandidate || currentSrc.includes(nextCandidate)) {
        target.src = "/images/question-fallback.svg";
        return;
    }

    target.src = nextCandidate;
}

export default function AssessmentPage() {
  const { t } = useTranslation();
  const router = useRouter();
    const [activeCategory, setActiveCategory] = useState<CategoryId | null>(categories[0]?.id ?? null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

    const totalQuestions = useMemo(
        () => categories.reduce((sum: number, cat: any) => sum + questions[cat.id as CategoryId].length, 0),
        []
    );

    const answeredCount = Object.keys(selectedAnswers).length;
    const completion = Math.round((answeredCount / totalQuestions) * 100);

    const toggleCategory = (categoryId: CategoryId) => {
        setActiveCategory((prev) => (prev === categoryId ? null : categoryId));
    };

    const selectAnswer = (questionId: string, option: string) => {
        setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
        setOpenQuestionId((prev) => (prev === questionId ? null : prev));
    };

    const handleGetResults = () => {
        if (typeof window !== "undefined") {
            const activeUser = localStorage.getItem("oneman_user_name");
            setScopedSessionItem("assessment_answers_v1", JSON.stringify(selectedAnswers), activeUser, true);
            setScopedSessionItem("questionsAnswered", "true", activeUser, true);
        }
        router.push("/result?source=assessment");
    };

  return (
        <div className="min-h-screen bg-background text-white p-6 pt-24 pb-32">
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
                <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
                <h1 className="text-xl font-bold text-white">{t("start_assessment")}</h1>
      </header>

      <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        Alpha Focus Questions
            </h2>
                    <p className="text-gray-300">Get perfect guidance after answering the questions.</p>
                </div>

                <div className="bg-surface border border-white/10 rounded-2xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-200">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span>Assessment Progress</span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                            {answeredCount}/{totalQuestions}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${completion}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        You can get your results after answering even one category.
                    </p>
        </div>

        <div className="space-y-6">
            {categories.map((cat) => {
                const isOpen = activeCategory === cat.id;
                const answeredInCategory = questions[cat.id].filter((q) => selectedAnswers[q.id]).length;

                return (
                    <motion.div 
                        key={cat.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface border border-white/10 rounded-3xl shadow-2xl shadow-black/20"
                    >
                        {/* Category Header Card */}
                        <button 
                            onClick={() => toggleCategory(cat.id)}
                            className="w-full relative group h-36 md:h-40 overflow-hidden text-left"
                        >
                            {/* Background Image with Overlay */}
                            <div className="absolute inset-0">
                                <img 
                                    src={getCategoryImageCandidates(cat.id, cat.imageUrl)[0]} 
                                    alt={cat.label}
                                    data-fallbacks={getCategoryImageCandidates(cat.id, cat.imageUrl).join("|")}
                                    onError={handleGuardedImageError}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/40" />
                            </div>

                            {/* Content */}
                            <div className="relative z-10 p-6 md:p-8 flex items-center justify-between h-full">
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
                                        {cat.label}
                                    </h3>
                                    <p className="text-gray-300 font-medium flex items-center gap-2 flex-wrap">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${answeredInCategory === questions[cat.id].length ? 'bg-blue-500/20 text-blue-300' : 'bg-primary/20 text-primary'}`}>
                                            {answeredInCategory}/{questions[cat.id].length} Answered
                                        </span>
                                        {answeredInCategory === questions[cat.id].length && (
                                            <span className="text-xs text-blue-300 font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Complete
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className={`w-11 h-11 rounded-full backdrop-blur-md bg-white/10 flex items-center justify-center border border-white/20 transition-all duration-300 ${isOpen ? "rotate-180 bg-primary text-black border-primary" : "text-white"}`}>
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            </div>
                        </button>
                    
                        {/* Expandable Questions Section */}
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="border-t border-white/10 bg-black/35 overflow-visible"
                                >
                                    <div className="p-6 md:p-8 space-y-6">
                                        {questions[cat.id]?.map((q, idx) => (
                                            <div key={q.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
                                                {(() => {
                                                    const clinicalRelevance = getClinicalRelevance(q.id);
                                                    const displayText = getQuestionLabel(q.id, q.text);
                                                    const imageCandidates = getQuestionImageCandidates(cat.id, q.id, q.imageUrl || cat.imageUrl);
                                                    return (
                                                <div className="flex flex-col md:flex-row gap-4 md:gap-5">
                                                    <div className="w-full md:w-48 shrink-0">
                                                        <div className="rounded-xl overflow-hidden border border-white/10 h-28 md:h-32 w-full relative">
                                                            <img
                                                                src={getQuestionImage(cat.id, q.id, q.imageUrl || cat.imageUrl)}
                                                                alt={displayText}
                                                                data-fallbacks={imageCandidates.join("|")}
                                                                onError={handleGuardedImageError}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-xs font-bold border border-white/10">
                                                                {idx + 1}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <p className="font-bold text-lg text-white leading-tight">{displayText}</p>
                                                            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${getClinicalTagClass(clinicalRelevance)}`}>
                                                                {clinicalRelevance} Relevance
                                                            </span>
                                                        </div>
                                                        <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 mb-4">
                                                            <Info className="w-4 h-4 text-primary mt-0.5" />
                                                            <p className="text-xs text-gray-300 leading-relaxed">{getQuestionContext(q.id)}</p>
                                                        </div>

                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setOpenQuestionId((prev) => (prev === q.id ? null : q.id))}
                                                                className="w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors px-4 py-3 text-left"
                                                            >
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">Select your answer</p>
                                                                        <p className="font-medium text-white leading-snug break-words">
                                                                            {selectedAnswers[q.id] || "Choose the option that matches you best"}
                                                                        </p>
                                                                    </div>
                                                                    <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform ${openQuestionId === q.id ? "rotate-180" : ""}`} />
                                                                </div>
                                                            </button>

                                                            <AnimatePresence>
                                                                {openQuestionId === q.id && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: -6 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -6 }}
                                                                        className="mt-2 w-full rounded-xl border border-white/15 bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden"
                                                                    >
                                                                        <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                                                                            {q.options.map((opt) => {
                                                                                const isSelected = selectedAnswers[q.id] === opt;
                                                                                return (
                                                                                    <button
                                                                                        key={opt}
                                                                                        onClick={() => selectAnswer(q.id, opt)}
                                                                                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                                                                                            isSelected
                                                                                                ? "border-primary bg-primary/15"
                                                                                                : "border-white/10 bg-white/5 hover:bg-white/10"
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex items-start gap-3">
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <div className="flex items-center justify-between gap-3">
                                                                                                    <span className="font-medium text-white text-sm md:text-base break-words leading-snug">{opt}</span>
                                                                                                    {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                                                                                                </div>
                                                                                                <p className="text-xs text-gray-400 mt-1 pr-2 leading-relaxed break-words">{getOptionInsight(q.id, opt)}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                </div>
                                                    );
                                                })()}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>

                <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-t border-white/10 px-6 py-4">
                    <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-3 items-center justify-between">
                        <p className="text-sm text-gray-300">
                            {answeredCount > 0
                                ? `${answeredCount} answers selected. You can generate your report now.`
                                : "Answer at least one question to generate a personalized report."}
                        </p>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={() => router.push("/image-analyzer")}
                                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl border border-white/20 text-gray-200 hover:bg-white/5"
                            >
                                Use Photo Analyzer
                            </button>
                            <button
                                onClick={handleGetResults}
                                disabled={answeredCount === 0}
                                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Get Results Now
                            </button>
                        </div>
                    </div>
                </div>
      </div>
    </div>
  );
}
