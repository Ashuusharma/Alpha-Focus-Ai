"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Upload,
  Star,
  ArrowRight,
  Camera,
  ShieldCheck,
  BadgeCheck,
  ChevronDown,
  Beaker,
  ScanFace,
  Brain,
  FileText,
  Users,
  Clock3,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import { useLanguage, pickLang } from "@/lib/languageContext";
import { type ClinicalCategoryId } from "@/lib/questions";
import { analyzerList, type AnalyzerMeta } from "@/lib/analyzerCatalog";
import { getRecommendedAnalyzers, type RecommendedAnalyzer } from "@/lib/analyzerRecommendations";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Hero from "@/components/ui/Hero";
import ScanUsageRing from "@/components/ui/ScanUsageRing";
import AnalyzerCard from "@/components/ui/AnalyzerCard";

type BillingStatus = {
  plan: "free" | "premium_monthly" | "premium_yearly";
  active: boolean;
  scans: { used: number; cap: number | null; allowed: boolean };
};

type RecentScan = {
  id: string;
  scan_date: string;
  analyzer_category: string | null;
  image_url: string | null;
  density_score: number | null;
  inflammation_score: number | null;
  oil_balance_score: number | null;
};

// Categories whose scan-insert path stores the real confidence value in
// density_score instead of oil_balance_score (see app/image-analyzer/page.tsx's
// fullScanPayload) — reused here so the AI Lab's per-card confidence stars
// read the same real number, never a fabricated one.
const HAIR_FLOW_CATEGORIES = new Set<ClinicalCategoryId>(["hair_loss", "scalp_health", "beard_growth"]);

function confidenceFromScan(category: string | null, scan: RecentScan): number | undefined {
  if (!category) return undefined;
  const raw = HAIR_FLOW_CATEGORIES.has(category as ClinicalCategoryId) ? scan.density_score : scan.oil_balance_score;
  return typeof raw === "number" ? raw : undefined;
}

function nextResetDateLabel(language: "en" | "hi" | string) {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long" });
}

const HOW_IT_WORKS = [
  {
    icon: Camera,
    title: "Capture",
    titleHi: "फोटो लें",
    description: "Take a few guided photos in good lighting.",
    descriptionHi: "अच्छी रोशनी में कुछ गाइडेड फोटो लें।",
  },
  {
    icon: ScanFace,
    title: "AI reads your photos",
    titleHi: "AI आपकी फोटो पढ़ता है",
    description: "Our vision model looks for the real signals dermatologists check for.",
    descriptionHi: "हमारा AI वही संकेत ढूंढता है जो त्वचा विशेषज्ञ देखते हैं।",
  },
  {
    icon: Brain,
    title: "A few honest questions",
    titleHi: "कुछ ईमानदार सवाल",
    description: "Short lifestyle questions fill in what a photo alone can't tell us.",
    descriptionHi: "छोटे सवाल वह बताते हैं जो सिर्फ़ फोटो से पता नहीं चलता।",
  },
  {
    icon: FileText,
    title: "Your recovery plan",
    titleHi: "आपकी रिकवरी योजना",
    description: "Everything combines into a daily plan built specifically for you.",
    descriptionHi: "सब कुछ मिलकर आपके लिए बनी एक रोज़ाना योजना बन जाता है।",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is this a medical diagnosis?",
    qHi: "क्या यह एक मेडिकल डायग्नोसिस है?",
    a: "No. Alpha Focus provides educational wellness guidance based on your photos and answers — not a substitute for seeing a dermatologist or doctor.",
    aHi: "नहीं। Alpha Focus आपकी फोटो और जवाबों के आधार पर शैक्षिक वेलनेस मार्गदर्शन देता है — यह डॉक्टर या त्वचा विशेषज्ञ से मिलने का विकल्प नहीं है।",
  },
  {
    q: "How many scans do I get for free?",
    qHi: "मुझे मुफ़्त में कितने स्कैन मिलते हैं?",
    a: "Free accounts get 2 scans a month, resetting on the 1st. Premium plans get unlimited scans.",
    aHi: "मुफ़्त खाते को महीने में 2 स्कैन मिलते हैं, जो हर महीने की 1 तारीख़ को रीसेट होते हैं। प्रीमियम प्लान में असीमित स्कैन मिलते हैं।",
  },
  {
    q: "What happens to my photos?",
    qHi: "मेरी फोटो का क्या होता है?",
    a: "Your photos are stored securely and used only to generate your analysis and protocol — never shared or sold.",
    aHi: "आपकी फोटो सुरक्षित रूप से सेव होती हैं और सिर्फ़ आपके विश्लेषण और प्रोटोकॉल के लिए उपयोग होती हैं — कभी शेयर या बेची नहीं जातीं।",
  },
  {
    q: "Can I redo an analysis?",
    qHi: "क्या मैं दोबारा विश्लेषण कर सकता हूं?",
    a: "Yes — rescanning any category any time gives you a fresh, updated read on your progress.",
    aHi: "हां — किसी भी कैटेगरी को कभी भी दोबारा स्कैन करके आप अपनी ताज़ा प्रगति देख सकते हैं।",
  },
];

// Real, live entitlements only (confirmed against /upgrade's actual feature
// set) — kept separate from COMING_SOON_FEATURES below so a "coming soon"
// idea never gets presented as something a paying user already has.
const PREMIUM_FEATURES = [
  "Unlimited scans across every analyzer",
  "Unlimited assessments",
  "Daily recovery protocol",
  "Progress tracking & photo comparison",
  "Alpha Sikka rewards & challenges",
  "Weekly recovery insights",
];
const PREMIUM_FEATURES_HI = [
  "हर एनालाइज़र पर असीमित स्कैन",
  "असीमित असेसमेंट",
  "रोज़ाना रिकवरी प्रोटोकॉल",
  "प्रगति ट्रैकिंग और फोटो तुलना",
  "अल्फा सिक्का रिवॉर्ड्स और चैलेंज",
  "साप्ताहिक रिकवरी जानकारी",
];

const COMING_SOON_FEATURES = ["Priority processing", "Advanced reports", "Personal AI coach"];
const COMING_SOON_FEATURES_HI = ["प्राथमिकता प्रोसेसिंग", "एडवांस्ड रिपोर्ट्स", "पर्सनल AI कोच"];

export default function AILaboratory({ userId }: { userId: string | null }) {
  const router = useRouter();
  const { language } = useLanguage();
  const isHi = language === "hi";

  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedAnalyzer[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const headers = await getSupabaseAuthHeaders();
        const [statusRes, scansRes, assessmentsRes, activeRes] = await Promise.all([
          fetch("/api/billing/status", { headers }).then((r) => r.json()).catch(() => null),
          supabase
            .from("photo_scans")
            .select("id,scan_date,analyzer_category,image_url,density_score,inflammation_score,oil_balance_score")
            .eq("user_id", userId)
            .order("scan_date", { ascending: false })
            .limit(4),
          supabase.from("assessment_answers").select("category").eq("user_id", userId),
          supabase.from("user_active_analysis").select("selected_category").eq("user_id", userId).maybeSingle(),
        ]);

        if (cancelled) return;

        if (statusRes?.ok) {
          setBilling({ plan: statusRes.plan, active: statusRes.active, scans: statusRes.scans });
        }

        const scans = (scansRes?.data || []) as RecentScan[];
        setRecentScans(scans);

        const scansByCategory: Partial<Record<ClinicalCategoryId, string>> = {};
        for (const scan of scans) {
          const cat = scan.analyzer_category as ClinicalCategoryId | null;
          if (cat && !scansByCategory[cat]) scansByCategory[cat] = scan.scan_date;
        }

        const assessedCategories = Array.from(
          new Set(((assessmentsRes?.data || []) as Array<{ category: string | null }>).map((row) => row.category).filter(Boolean))
        ) as ClinicalCategoryId[];

        const activeProtocolCategory = (activeRes?.data?.selected_category || null) as ClinicalCategoryId | null;

        setRecommendations(
          getRecommendedAnalyzers({ scansByCategory, assessedCategories, activeProtocolCategory }, 3)
        );
      } catch (error) {
        console.error("[AILaboratory] load_failed", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const scansUsed = billing?.scans.used ?? 0;
  const scansCap = billing?.scans.cap ?? null;
  const isPremium = billing?.plan === "premium_monthly" || billing?.plan === "premium_yearly";
  const usagePercent = scansCap ? Math.min(100, Math.round((scansUsed / scansCap) * 100)) : 0;
  const scansRemaining = Math.max(0, (scansCap || 0) - scansUsed);

  // Confidence stars only appear on cards where a real scan already exists
  // for that category — sourced from the same 4 most-recent scans already
  // being fetched for "Recent Analysis," not a new query, and never a
  // fabricated number for categories with no scan yet.
  const confidenceByCategory = useMemo(() => {
    const map: Partial<Record<string, number>> = {};
    for (const scan of recentScans) {
      if (!scan.analyzer_category || map[scan.analyzer_category] !== undefined) continue;
      const value = confidenceFromScan(scan.analyzer_category, scan);
      if (value !== undefined) map[scan.analyzer_category] = value;
    }
    return map;
  }, [recentScans]);

  const recommendedMeta = useMemo(
    () =>
      recommendations
        .map((rec) => ({ rec, meta: analyzerList.find((a) => a.type === rec.type) }))
        .filter((entry): entry is { rec: RecommendedAnalyzer; meta: AnalyzerMeta } => Boolean(entry.meta)),
    [recommendations]
  );

  const topRecommendedMeta = recommendedMeta[0]?.meta;

  const goToAnalyzer = (type?: ClinicalCategoryId) => {
    router.push(type ? `/image-analyzer?type=${type}` : "/image-analyzer");
  };

  return (
    <div className="af-page-shell min-h-screen px-4 py-6 sm:py-8">
      <div className="af-page-frame mx-auto max-w-6xl space-y-8 sm:space-y-10">
        {/* DARK HERO */}
        <Hero
          layout="center"
          kicker={
            <>
              <Beaker className="h-3.5 w-3.5" />
              {isHi ? "AI लैबोरेटरी" : "AI Laboratory"}
            </>
          }
          title={isHi ? "आपकी त्वचा और बालों का AI विश्लेषण, कुछ ही मिनटों में" : "Your skin & hair, read by AI in minutes"}
          subtitle={
            isHi
              ? "एक फोटो अपलोड करें, कुछ आसान सवालों के जवाब दें, और अपनी निजी रिकवरी योजना पाएं।"
              : "Upload a photo, answer a few simple questions, and get a recovery plan built specifically for you."
          }
          cta={
            <>
              <Button onClick={() => goToAnalyzer()} variant="primary" size="lg">
                <Upload className="h-4 w-4" />
                {isHi ? "स्कैन शुरू करें" : "Start a Scan"} <ArrowRight className="h-4 w-4" />
              </Button>
              <span className="inline-flex items-center gap-1.5 self-center text-xs font-semibold text-[var(--clinical-cyan)]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isHi ? "निजी और सुरक्षित" : "Private & clinically-informed"}
              </span>
            </>
          }
        />

        {/* GLASS STATISTICS — plan status + scan usage ring */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="glass-card flex items-center justify-between gap-4 p-5 sm:p-6">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                {isHi ? "आपका प्लान" : "Your Plan"}
              </p>
              <p className="mt-2 truncate text-xl font-bold text-[var(--ink)] sm:text-2xl">
                {loading ? "…" : isPremium ? (billing?.plan === "premium_yearly" ? (isHi ? "प्रीमियम (सालाना)" : "Premium Yearly") : isHi ? "प्रीमियम (मासिक)" : "Premium Monthly") : isHi ? "फ्री" : "Free"}
              </p>
              {!isPremium && !loading && (
                <Button onClick={() => router.push("/upgrade")} variant="accent" size="sm" className="mt-4">
                  {isHi ? "अपग्रेड करें" : "Upgrade"} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
              {isPremium && (
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-green)]">
                  <BadgeCheck className="h-3.5 w-3.5" /> {isHi ? "सक्रिय" : "Active"}
                </span>
              )}
            </div>
          </div>

          <div className="glass-card flex items-center justify-between gap-4 p-5 sm:p-6">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                {isHi ? "बचे हुए स्कैन" : "Remaining Scans"}
              </p>
              <p className="mt-2 text-xl font-bold text-[var(--ink)] sm:text-2xl">
                {loading ? "…" : isPremium ? (isHi ? "असीमित" : "Unlimited") : `${scansRemaining} / ${scansCap ?? 0}`}
              </p>
              {!isPremium && !loading && (
                <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
                  {isHi ? `${nextResetDateLabel(language)} को रीसेट होगा` : `Resets ${nextResetDateLabel(language)}`}
                </p>
              )}
            </div>
            {!isPremium && (
              <ScanUsageRing
                percent={usagePercent}
                variant="light"
                size={76}
                strokeWidth={5}
                centerValue={scansRemaining}
                centerLabel={isHi ? "बचे" : "left"}
              />
            )}
            {isPremium && (
              <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full bg-[var(--accent-green)]/10 text-[var(--accent-green)]">
                <Sparkles className="h-7 w-7" />
              </div>
            )}
          </div>
        </section>

        {/* GRADIENT / TINT SECTION — recommended for you */}
        {recommendedMeta.length > 0 && (
          <section className="nv-section-tint-warm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--ink)] sm:text-xl">
              <Star className="h-5 w-5 text-[var(--accent-amber)]" />
              {isHi ? "आपके लिए सुझाव" : "Recommended for You"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {recommendedMeta.map(({ rec, meta }) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={rec.type}
                    onClick={() => goToAnalyzer(meta.type)}
                    className="af-card-secondary group flex min-h-[48px] flex-col items-start gap-2 p-5 text-left transition-transform hover:-translate-y-1"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-[var(--ink)]">{pickLang(meta.label, meta.labelHi, language)}</p>
                    <p className="text-xs text-[var(--ink-soft)]">{pickLang(rec.reason, rec.reasonHi, language)}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* WHITE CONTENT — choose an analyzer */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-[var(--ink)] sm:text-xl">
            {isHi ? "एनालाइज़र चुनें" : "Choose an Analyzer"}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {analyzerList.map((meta, idx) => (
              <AnalyzerCard
                key={meta.type}
                meta={meta}
                language={language}
                index={idx}
                variant="browse"
                onClick={() => goToAnalyzer(meta.type)}
                confidence={confidenceByCategory[meta.type]}
              />
            ))}
          </div>
        </section>

        {/* TINTED SECTION — how it works */}
        <section className="nv-section-tint-cool">
          <h2 className="mb-6 text-lg font-bold text-[var(--ink)] sm:text-xl">
            {isHi ? "Alpha Focus कैसे काम करता है" : "How Alpha Focus Works"}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-xs font-black uppercase tracking-wider text-[var(--ink-soft)]">
                    {isHi ? `चरण ${idx + 1}` : `Step ${idx + 1}`}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[var(--ink)]">{pickLang(step.title, step.titleHi, language)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ink-soft)]">{pickLang(step.description, step.descriptionHi, language)}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* WHITE CONTENT — recent analysis */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-[var(--ink)] sm:text-xl">
            {isHi ? "हाल की जांच" : "Recent Analysis"}
          </h2>
          {loading ? (
            <div className="glass-card h-32 animate-pulse" />
          ) : recentScans.length === 0 ? (
            <EmptyState
              icon={<Camera className="h-5 w-5" />}
              title={isHi ? "अभी तक कोई स्कैन नहीं" : "No scans yet"}
              description={
                topRecommendedMeta
                  ? pickLang(topRecommendedMeta.longDescription, topRecommendedMeta.longDescriptionHi, language)
                  : isHi
                    ? "अपना पहला स्कैन शुरू करें और अपनी रिकवरी यात्रा देखें।"
                    : "Start your first scan to begin tracking your recovery journey."
              }
              actionLabel={isHi ? "स्कैन शुरू करें" : "Start a Scan"}
              onAction={() => goToAnalyzer(topRecommendedMeta?.type)}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentScans.map((scan) => {
                const meta = analyzerList.find((a) => a.type === scan.analyzer_category);
                return (
                  <Link
                    key={scan.id}
                    href="/saved-scans"
                    className="af-card-secondary flex min-h-[48px] items-center gap-3 p-4 transition-transform hover:-translate-y-1"
                  >
                    {meta && (
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient} text-white`}>
                        <meta.icon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--ink)]">
                        {meta ? pickLang(meta.label, meta.labelHi, language) : scan.analyzer_category || "Scan"}
                      </p>
                      <p className="text-xs text-[var(--ink-soft)]">{new Date(scan.scan_date).toLocaleDateString()}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* DARK CTA — subscription comparison */}
        {!isPremium && (
          <section className="af-hero-dark relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-center">
                <span className="af-page-kicker mx-auto">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {isHi ? "अनलॉक करें" : "Unlock More"}
                </span>
                <h2 className="mt-3 text-xl font-extrabold text-white sm:text-2xl">
                  {isHi ? "अपनी रिकवरी के लिए सही क्षमताएं अनलॉक करें" : "Unlock the capabilities your recovery needs"}
                </h2>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {/* Free */}
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#b7c4d7]">{isHi ? "फ्री" : "Free"}</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">₹0</p>
                  <p className="mt-3 text-sm text-[#b7c4d7]">
                    {isHi ? `हर महीने ${scansCap ?? 2} स्कैन` : `${scansCap ?? 2} scans every month`}
                  </p>
                </div>

                {/* Premium — real features only */}
                <div className="glass-premium-strong rounded-2xl p-5 ring-1 ring-[var(--accent-green)]/40">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent-green)]">{isHi ? "प्रीमियम" : "Premium"}</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">₹199<span className="text-sm font-medium text-[#b7c4d7]">{isHi ? "/महीना" : "/mo"}</span></p>
                  <p className="text-xs text-[#b7c4d7]">{isHi ? "या ₹1,999/साल — 2 महीने मुफ़्त" : "or ₹1,999/yr — 2 months free"}</p>
                  <ul className="mt-3 space-y-1.5">
                    {(isHi ? PREMIUM_FEATURES_HI : PREMIUM_FEATURES).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-[#b7c4d7]">
                        <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-green)]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 border-t border-white/10 pt-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-amber)]">
                      <Clock3 className="h-3 w-3" /> {isHi ? "जल्द आ रहा है" : "Coming soon"}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {(isHi ? COMING_SOON_FEATURES_HI : COMING_SOON_FEATURES).map((feature) => (
                        <li key={feature} className="text-[11px] text-[#8290a8]">{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <Button onClick={() => router.push("/upgrade")} variant="accent" className="mt-4 w-full justify-center">
                    {isHi ? "प्लान देखें" : "View Plans"} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Family — presentation-only, not purchasable */}
                <div className="relative rounded-2xl border border-dashed border-white/15 bg-black/15 p-5 opacity-90">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#b7c4d7]">
                    <Users className="h-3.5 w-3.5" /> {isHi ? "फैमिली" : "Family"}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-amber)]">
                    <Clock3 className="h-3 w-3" /> {isHi ? "जल्द आ रहा है" : "Coming soon"}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {(isHi
                      ? ["कई सदस्य", "साझा डैशबोर्ड", "फैमिली रिपोर्ट्स"]
                      : ["Multiple members", "Shared dashboard", "Family reports"]
                    ).map((feature) => (
                      <li key={feature} className="text-xs text-[#8290a8]">{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TRUST / MEDICAL DISCLAIMER */}
        <section className="af-card-secondary p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--ink-soft)]">
            {isHi ? "किस आधार पर बना" : "Built Using"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(isHi
              ? ["त्वचा विज्ञान शोध", "क्लिनिकल लाइफस्टाइल साइंस", "AI इमेज विश्लेषण", "प्रमाण-आधारित प्रोटोकॉल"]
              : ["Dermatology research", "Clinical lifestyle science", "AI image analysis", "Evidence-based protocols"]
            ).map((chip) => (
              <span key={chip} className="rounded-full border border-[var(--border-hairline)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)]">
                {chip}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--ink-soft)]">
            {isHi
              ? "Alpha Focus शैक्षिक वेलनेस मार्गदर्शन देता है, न कि मेडिकल डायग्नोसिस। किसी भी त्वचा या स्वास्थ्य समस्या के लिए हमेशा एक योग्य डॉक्टर से सलाह लें।"
              : "Alpha Focus provides educational wellness guidance, not a medical diagnosis. Always consult a qualified doctor for any skin or health concern."}
          </p>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-[var(--ink)] sm:text-xl">FAQ</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={item.q} className="af-card-secondary overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex min-h-[48px] w-full items-center justify-between gap-3 p-4 text-left"
                  aria-expanded={openFaq === idx}
                >
                  <span className="text-sm font-semibold text-[var(--ink)]">{pickLang(item.q, item.qHi, language)}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--ink-soft)] transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {openFaq === idx && (
                  <p className="px-4 pb-4 text-xs leading-relaxed text-[var(--ink-soft)]">{pickLang(item.a, item.aHi, language)}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-center gap-2 pb-4 text-xs text-[var(--ink-soft)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
          {isHi ? "हर स्कैन आपकी रिकवरी को बेहतर समझने में मदद करता है।" : "Every scan helps us understand your recovery a little better."}
        </div>
      </div>
    </div>
  );
}
