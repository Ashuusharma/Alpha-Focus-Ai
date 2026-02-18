"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Award,
  Bell,
  Camera,
  Crown,
  ChevronDown,
  Globe,
  MapPin,
  Settings,
  ShoppingCart,
  Sparkles,
  Sun,
  Thermometer,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  FileText,
  Medal,
  Flame,
  User,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

import LoginScreen from "@/app/_components/LoginScreen";
import { getEnvironment } from "@/lib/envService";
import { calculateHabitScore, HabitTier } from "@/lib/habitScore";
import { getNextNudge, Nudge } from "@/lib/nudges";
import { categories, CategoryId, questions } from "@/lib/questions";
import { getWearableSnapshot } from "@/lib/wearableStub";
import { useRewardsStore } from "@/lib/rewardsStore";
import { useScans } from "@/lib/useUserData";
import AlphaScoreCard from "@/components/dashboard/AlphaScoreCard";
import ProgressChart, { ProgressPoint } from "@/components/dashboard/ProgressChart";
import { AlphaScoreInput, calculateAlphaScore } from "@/lib/calculateAlphaScore";
import {
  getActiveUserName,
  getScopedLocalItem,
  getScopedSessionItem,
  setScopedLocalItem,
  setScopedSessionItem,
} from "@/lib/userScopedStorage";
import { useToast } from "@/app/toast/ToastContext";
import { generateConciergeBriefing } from "@/lib/conciergeMode";

// --- Types ---

type EnvSummary = {
  uv: number;
  humidity: number;
  pm25: number;
  tempC: number;
  label: string;
  fetchedAt: string;
  pollutionRisk: string;
};

// --- Utils ---

const categoryColors: Record<CategoryId, string> = {
  hairCare: "from-blue-700 to-indigo-500",
  skinCare: "from-blue-600 to-cyan-500",
  beardCare: "from-indigo-700 to-blue-600",
  bodyCare: "from-blue-600 to-cyan-400",
  healthCare: "from-indigo-700 to-blue-500",
  fitness: "from-slate-700 to-blue-600",
  fragrance: "from-blue-700 to-indigo-600",
};

function getPollutionRisk(pm25: number): string {
  if (pm25 <= 20) return "Good";
  if (pm25 <= 50) return "Moderate";
  if (pm25 <= 100) return "Unhealthy";
  return "Very Unhealthy";
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getWeeklyResetTimeLabel() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayMs = 24 * 60 * 60 * 1000;
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / dayMs) + 1;
  const currentWeek = Math.ceil(dayOfYear / 7);
  const nextWeekStartDay = currentWeek * 7 + 1;
  const nextReset = new Date(now.getFullYear(), 0, nextWeekStartDay);

  const diff = Math.max(0, nextReset.getTime() - now.getTime());
  const totalMinutes = Math.floor(diff / (60 * 1000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// --- Components ---

function LandingStepCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06]">
        <Icon className="h-5 w-5 text-blue-300" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

function CapabilityColumn({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-[0_10px_28px_rgba(2,6,23,0.22)]">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <ul className="mt-3 space-y-2">
        {points.map((point) => (
          <li key={point} className="text-sm text-gray-300">{point}</li>
        ))}
      </ul>
    </div>
  );
}

function LandingPage({ onStart, onLogin, onNavigate }: { onStart: () => void, onLogin: () => void, onNavigate: (path: string) => void }) {
  const navItems = [
    { label: "Assistant", path: "/", active: true },
    { label: "Photo Analyzer", path: "/image-analyzer", active: false },
    { label: "Challenges", path: "/challenges", active: false },
    { label: "Learn", path: "/learning-center", active: false },
    { label: "Progress", path: "/dashboard", active: false },
  ];

  return (
    <div className="min-h-screen bg-[#030917] text-white selection:bg-blue-500/30">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(5,10,26,0.76)] backdrop-blur-xl shadow-[0_10px_28px_rgba(2,6,23,0.32)]">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 shadow-lg shadow-blue-500/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Alpha <span className="text-blue-400">Focus</span></span>
            </div>

            <div className="hidden items-center gap-5 lg:flex">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.path)}
                  className={`relative pb-1 text-sm font-medium transition-colors ${item.active ? "text-white" : "text-gray-400 hover:text-gray-200"}`}
                >
                  {item.label}
                  {item.active && <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-blue-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-gray-300 transition-colors hover:text-white md:flex"><Bell className="h-4 w-4" /></button>
            <button onClick={() => onNavigate("/saved-scans")} className="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-gray-300 transition-colors hover:text-white md:flex"><ShoppingCart className="h-4 w-4" /></button>
            <button onClick={onLogin} className="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-gray-300 transition-colors hover:text-white md:flex"><User className="h-4 w-4" /></button>
            <button
              onClick={() => onNavigate("/upgrade")}
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/10"
            >
              <Crown className="h-3.5 w-3.5" />
              Upgrade to Pro
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-7xl space-y-20 px-6 py-14 md:space-y-24">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              Premium AI Assistant
            </p>
            <h1 className="text-5xl font-bold leading-[1.1] text-white md:text-6xl">
              Become the <span className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text text-transparent">Most Confident</span> Version of Yourself
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-300 md:text-lg">
              AI-powered grooming intelligence designed for modern men.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onStart} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500">Start Free Scan</button>
              <button onClick={() => onNavigate("/result")} className="rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-gray-100 transition-colors hover:bg-white/[0.08]">View Demo Report</button>
              <button onClick={() => onNavigate("/assessment")} className="rounded-xl border border-blue-400/35 bg-blue-500/10 px-6 py-3 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/15">Answer Category Questions</button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-300">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-300" />Dermatology Inspired</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-300" />AI Analyzed</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-300" />Personalized Protocol</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b1b3e] via-[#09142d] to-[#050b19] p-6">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(96,165,250,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="relative grid gap-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs uppercase tracking-wider text-blue-300">Live Alpha Score</p>
                <p className="mt-1 text-3xl font-bold text-white">78 <span className="text-base text-gray-400">/100</span></p>
                <p className="mt-1 text-xs text-blue-200">↑ +6 This Month</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs text-gray-400">Clinical Confidence</p>
                  <p className="mt-1 text-lg font-semibold text-white">82%</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs text-gray-400">Primary Concern</p>
                  <p className="mt-1 text-lg font-semibold text-white">Hair Fall</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-gray-400">Weekly Progress</p>
                <svg viewBox="0 0 320 90" className="mt-2 h-20 w-full">
                  <polyline fill="none" stroke="rgba(96,165,250,0.95)" strokeWidth="3" points="5,72 50,64 95,58 140,55 185,42 230,36 275,30 315,22" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">How Alpha Focus Works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <LandingStepCard icon={Camera} title="Step 1 — Upload Scan" description="Upload your latest face or scalp scan with clear lighting for baseline analysis." />
            <LandingStepCard icon={Activity} title="Step 2 — AI Clinical Review" description="Structured AI scoring maps severity signals, confidence, and trend direction." />
            <LandingStepCard icon={FileText} title="Step 3 — Personalized Treatment Plan" description="Receive an actionable protocol with products, routines, and follow-up checkpoints." />
          </div>
          <div className="mt-4 hidden md:grid md:grid-cols-3 md:gap-4">
            <div className="h-px bg-white/10" />
            <div className="h-px bg-white/10" />
            <div className="h-px bg-white/10" />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">AI Capabilities</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <CapabilityColumn title="AI Skin Analysis" points={["Detect oil levels", "Detect acne severity"]} />
            <CapabilityColumn title="Hair & Scalp Mapping" points={["Detect thinning density", "DHT risk estimation"]} />
            <CapabilityColumn title="Lifestyle Scoring" points={["Sleep & hydration", "Stress correlation"]} />
          </div>
          <p className="mt-4 text-sm text-gray-400">Built using dermatology research datasets and structured AI analysis.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white">Visual Data Preview</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-wider text-gray-400">Alpha Score</p>
              <div className="mt-4 flex items-center justify-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-blue-500/30">
                  <span className="text-3xl font-bold text-white">78</span>
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-blue-300">↑ +6 This Month</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
              <p className="text-xs uppercase tracking-wider text-gray-400">Line Chart Example</p>
              <svg viewBox="0 0 520 180" className="mt-5 h-36 w-full">
                <line x1="0" y1="150" x2="520" y2="150" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
                <line x1="0" y1="90" x2="520" y2="90" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
                <polyline fill="none" stroke="rgba(96,165,250,0.95)" strokeWidth="4" points="8,148 72,138 136,134 200,118 264,116 328,99 392,90 456,74 512,58" />
              </svg>
              <div className="mt-3 inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-300">Severity scale sample: Mild → Moderate → High</div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.18)]">
            <p className="text-xs uppercase tracking-wider text-gray-400">Sample Medical Report Preview</p>
            <h3 className="mt-3 text-lg font-semibold text-white">AI Dermatology Report</h3>
            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <p>Primary Concern: Hair Fall</p>
              <p>Severity: Moderate</p>
              <p>Confidence: 82%</p>
              <p>Treatment Protocol: 6 Weeks</p>
            </div>
            <button onClick={() => onNavigate("/result")} className="mt-5 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.06]">View Full Sample Report</button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.18)]">
            <p className="text-xs uppercase tracking-wider text-gray-400">Challenge System Preview</p>
            <h3 className="mt-3 text-lg font-semibold text-white">90-Day Transformation</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-300" />Build routine</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-300" />Improve consistency</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-300" />Unlock rewards</li>
            </ul>
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <Medal className="h-8 w-8 text-blue-300" />
              <div>
                <p className="text-sm font-semibold text-white">XP System • Level Badge</p>
                <p className="text-xs text-gray-400">Level 6 – Momentum Builder</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.18)]">
          <h2 className="text-2xl font-semibold text-white">AF Coins & Rewards</h2>
          <p className="mt-2 text-sm text-gray-300">Earn coins for completing routines, redeem discounts, and unlock progress tiers.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-sm font-semibold text-white">Bronze</p><p className="text-xs text-gray-400 mt-1">5% reward unlock</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-sm font-semibold text-white">Silver</p><p className="text-xs text-gray-400 mt-1">10% reward unlock</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-sm font-semibold text-white">Gold</p><p className="text-xs text-gray-400 mt-1">15% reward unlock</p></div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.18)]">
          <h2 className="text-2xl font-semibold text-white">Trust & Safety</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "End-to-End Encrypted",
              "Data Not Shared",
              "Dermatology Knowledge Base Integrated",
              "Science-Backed Ingredient Guidance",
            ].map((item) => (
              <p key={item} className="inline-flex items-center gap-2 text-sm text-gray-200"><ShieldCheck className="h-4 w-4 text-blue-300" />{item}</p>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">Alpha Focus does not replace licensed medical consultation.</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center shadow-[0_10px_30px_rgba(2,6,23,0.18)]">
          <h2 className="text-2xl font-semibold text-white">Install Alpha Focus on your phone.</h2>
          <p className="mt-2 text-sm text-gray-300">No app store required.</p>
          <button onClick={onStart} className="mt-5 rounded-xl border border-blue-500/40 px-6 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/10">Install Now</button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-[0_10px_30px_rgba(2,6,23,0.18)]">
          <h2 className="text-[2rem] font-bold text-white">Ready to Upgrade Your Grooming Intelligence?</h2>
          <button onClick={onStart} className="mt-6 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-500">Start Free Scan</button>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 text-sm text-gray-500">
          <p>© 2026 Alpha Focus</p>
          <p>Clinical AI Grooming Intelligence</p>
        </div>
      </footer>
    </div>
  );
}

// --- Main Page Component ---

export default function Home() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { scans } = useScans();
  const credits = useRewardsStore((s) => s.credits);
  const lifetimeCredits = useRewardsStore((s) => s.lifetimeCredits);
  const level = useRewardsStore((s) => s.level);
  const levelTitle = useRewardsStore((s) => s.levelTitle);
  const xp = useRewardsStore((s) => s.xp);
  const achievements = useRewardsStore((s) => s.achievements);
  const streakCount = useRewardsStore((s) => s.streakCount);
  const setStreakCount = useRewardsStore((s) => s.setStreakCount);
  const unlockAchievement = useRewardsStore((s) => s.unlockAchievement);
  const weeklyMissions = useRewardsStore((s) => s.weeklyMissions);
  const initializeWeeklyMissions = useRewardsStore((s) => s.initializeWeeklyMissions);
  const syncWeeklyMissions = useRewardsStore((s) => s.syncWeeklyMissions);
  const claimWeeklyMission = useRewardsStore((s) => s.claimWeeklyMission);
  const activeDiscount = useRewardsStore((s) => s.activeDiscount);
  const tiers = useRewardsStore((s) => s.tiers);
  const { showToast } = useToast();
  const seenAchievementsRef = useRef<Set<string> | null>(null);
  const seenMissionCompletionsRef = useRef<Set<string> | null>(null);

  const [userName, setUserName] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Home Logic
  const [showQuestions, setShowQuestions] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [inlineAnswers, setInlineAnswers] = useState<Record<string, string>>({});

  const [habitScore, setHabitScore] = useState<{ score: number; tier: HabitTier } | null>(null);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [envSummary, setEnvSummary] = useState<EnvSummary | null>(null);
  const [greeting, setGreeting] = useState("Welcome");

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");

  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [assessmentAnsweredCount, setAssessmentAnsweredCount] = useState(0);
  const [categoriesCompleted, setCategoriesCompleted] = useState(0);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);
  const [alphaScoreInput, setAlphaScoreInput] = useState<AlphaScoreInput>({
    skinScore: 0,
    hairScore: 0,
    lifestyleScore: 0,
    streakScore: 0,
  });
  const [alphaProgressData, setAlphaProgressData] = useState<ProgressPoint[]>([]);
  const [alphaMonthlyDelta, setAlphaMonthlyDelta] = useState(0);
  const [missionResetLabel, setMissionResetLabel] = useState(getWeeklyResetTimeLabel());

  const handleInlineAnswerSelect = (questionId: string, option: string) => {
    setInlineAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleInlineResults = () => {
    if (Object.keys(inlineAnswers).length === 0) return;
    setScopedSessionItem("assessment_answers_v1", JSON.stringify(inlineAnswers), userName, true);
    setScopedSessionItem("questionsAnswered", "true", userName, true);
    router.push("/result?source=inline");
  };

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("oneman-language", lang);
    localStorage.setItem("oneman_lang", lang);
    setCurrentLang(lang);
    setLangMenuOpen(false);
  };

  const getLocationLabel = async (lat: number, lon: number): Promise<string> => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return "Local Area";
      const json = await res.json();
      const place = json?.results?.[0];
      if (!place) return "Local Area";
      const parts = [place.name, place.admin1, place.country].filter(Boolean);
      return parts.join(", ");
    } catch {
      return "Local Area";
    }
  };

  const fetchLocationData = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!("geolocation" in navigator)) {
      setLocationLoading(false);
      setLocationError("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          const cacheKey = `geo_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;

          const [env, label] = await Promise.all([
            getEnvironment(cacheKey, latitude, longitude),
            getLocationLabel(latitude, longitude),
          ]);

          if (!env) {
            setLocationError("Could not fetch local environment data.");
            return;
          }

          const pm25 = env.pm25 ?? 0;
          const summary: EnvSummary = {
            uv: env.uvIndex ?? 0,
            humidity: env.humidity ?? 0,
            pm25,
            tempC: env.tempC ?? 0,
            label,
            fetchedAt: env.fetchedAt,
            pollutionRisk: getPollutionRisk(pm25),
          };

          setEnvSummary(summary);

          if (habitScore) {
            const n = getNextNudge({
              tier: habitScore.tier,
              env,
              wearable: getWearableSnapshot() || undefined,
            });
            setNudge(n);
          }
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Enable it in browser settings.");
        } else {
          setLocationError("Unable to read your location right now.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [habitScore]);

  const toggleLocation = async (enabled: boolean) => {
    setLocationEnabled(enabled);
    localStorage.setItem("oneman_location_enabled", String(enabled));

    if (!enabled) {
      setEnvSummary(null);
      setLocationError(null);
      return;
    }

    await fetchLocationData();
  };

  useEffect(() => {
    const storedName = localStorage.getItem("oneman_user_name");
    if (storedName) setUserName(storedName);

    const storedLastLogin = localStorage.getItem("oneman_last_login");
    if (storedLastLogin) setLastLoginAt(storedLastLogin);

    const savedLang = localStorage.getItem("oneman-language") || localStorage.getItem("oneman_lang") || i18n.language || "en";
    setCurrentLang(savedLang);
    i18n.changeLanguage(savedLang);

    const savedLocationPref = localStorage.getItem("oneman_location_enabled") === "true";
    setLocationEnabled(savedLocationPref);

    setLoadingAuth(false);
  }, [i18n]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const answersRaw = getScopedSessionItem("assessment_answers_v1", userName, true);
    const answers = answersRaw ? (JSON.parse(answersRaw) as Record<string, string>) : {};
    const answeredIds = new Set(Object.keys(answers));

    const questionToCategory = new Map<string, CategoryId>();
    categories.forEach((cat) => {
      questions[cat.id].forEach((question) => {
        questionToCategory.set(question.id, cat.id);
      });
    });

    const completed = new Set<CategoryId>();
    answeredIds.forEach((questionId) => {
      const category = questionToCategory.get(questionId);
      if (category) completed.add(category);
    });

    setAssessmentAnsweredCount(answeredIds.size);
    setCategoriesCompleted(completed.size);
  }, [showQuestions, userName]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const answersRaw = getScopedSessionItem("assessment_answers_v1", userName, true);
    const answers = answersRaw ? (JSON.parse(answersRaw) as Record<string, string>) : {};

    const categoryQuestionIds = new Map<CategoryId, string[]>();
    categories.forEach((category) => {
      categoryQuestionIds.set(
        category.id,
        questions[category.id].map((question) => question.id)
      );
    });

    const getCategoryCompletion = (targetCategories: CategoryId[]) => {
      const targetIds = targetCategories.flatMap((categoryId) => categoryQuestionIds.get(categoryId) || []);
      if (targetIds.length === 0) return 0;
      const answeredCount = targetIds.reduce((count, questionId) => (answers[questionId] ? count + 1 : count), 0);
      return clampScore((answeredCount / targetIds.length) * 100);
    };

    const streakState = getScopedLocalItem("oneman_streak", userName, true);
    const streakDays = streakState ? JSON.parse(streakState).streak || 0 : 0;
    const consistencyScore = habitScore?.score ?? clampScore(streakDays * 6);

    const skinScore = getCategoryCompletion(["skinCare", "bodyCare"]);
    const hairScore = getCategoryCompletion(["hairCare", "beardCare", "fragrance"]);
    const lifestyleQuestionScore = getCategoryCompletion(["healthCare", "fitness"]);
    const environmentScore = envSummary
      ? clampScore(100 - envSummary.pm25 * 1.2 + envSummary.humidity * 0.1 + (10 - Math.abs(24 - envSummary.tempC)) * 2)
      : 60;
    const lifestyleScore = clampScore(lifestyleQuestionScore * 0.7 + environmentScore * 0.3);

    const computedInput: AlphaScoreInput = {
      skinScore,
      hairScore,
      lifestyleScore,
      streakScore: consistencyScore,
    };

    setAlphaScoreInput(computedInput);

    const activityRaw =
      getScopedLocalItem("oneman_activity", userName, true) ||
      getScopedLocalItem("oneman_activity_log", userName, true);
    const activities = activityRaw ? (JSON.parse(activityRaw) as Array<{ timestamp?: string; action?: string }>) : [];
    const baseScore = calculateAlphaScore(computedInput);
    const today = new Date();

    const points: ProgressPoint[] = [];
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const day = new Date(today);
      day.setHours(0, 0, 0, 0);
      day.setDate(today.getDate() - dayOffset);

      const dailyActivityCount = activities.filter((activity: { timestamp?: string }) => {
        if (!activity.timestamp) return false;
        const activityDate = new Date(activity.timestamp);
        activityDate.setHours(0, 0, 0, 0);
        return activityDate.getTime() === day.getTime();
      }).length;

      const trendBoost = (6 - dayOffset) * 1.5;
      const score = clampScore(baseScore - 8 + trendBoost + dailyActivityCount * 2);

      points.push({
        date: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        score,
      });
    }

    setAlphaProgressData(points);

    const getMonthScore = (monthOffset: number) => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1);

      const monthActivities = activities.filter((activity) => {
        if (!activity.timestamp) return false;
        const timestamp = new Date(activity.timestamp);
        return timestamp >= start && timestamp < end;
      });

      const scanCount = monthActivities.filter((activity) => activity.action?.includes("scan")).length;
      const reminderCount = monthActivities.filter((activity) => activity.action?.includes("reminder")).length;
      const cartCount = monthActivities.filter((activity) => activity.action?.includes("cart")).length;

      const engagementBoost = Math.min(18, monthActivities.length * 1.2 + scanCount * 2 + reminderCount + cartCount * 0.5);
      return clampScore(baseScore - 10 + engagementBoost);
    };

    const currentMonthScore = getMonthScore(0);
    const previousMonthScore = getMonthScore(1);
    setAlphaMonthlyDelta(currentMonthScore - previousMonthScore);
  }, [assessmentAnsweredCount, envSummary, habitScore, userName]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t("good_morning"));
    else if (hour < 18) setGreeting(t("good_afternoon"));
    else setGreeting(t("good_evening"));

    const hydrateScoreAndNudge = async () => {
      if (!userName) return;

      try {
        const now = Date.now();
        const activeUser = userName || getActiveUserName();
        const activityRaw =
          getScopedLocalItem("oneman_activity", activeUser, true) ||
          getScopedLocalItem("oneman_activity_log", activeUser, true);
        const streakState = getScopedLocalItem("oneman_streak", activeUser, true);
        const activities: Array<{ timestamp?: string; action?: string }> = activityRaw ? JSON.parse(activityRaw) : [];
        const streakDays = streakState ? JSON.parse(streakState).streak || 0 : 0;
        setStreakCount(streakDays);
        const last7d = activities.filter((activity) => activity.timestamp && now - new Date(activity.timestamp).getTime() < 7 * 86400000);

        const scoreRes = calculateHabitScore({
          routineCompletions7d: last7d.length,
          scansLast14d: activities.filter((activity) => activity.action?.includes("scan")).length,
          remindersOpened7d: last7d.filter((activity) => activity.action?.includes("reminder")).length,
          remindersDismissed7d: 0,
          cartInteractions7d: last7d.filter((activity) => activity.action?.includes("cart")).length,
          streakDays,
          lastActiveAt: activities[0]?.timestamp,
        });

        setHabitScore(scoreRes);
        
        // Only run nudge logic if we have score
        const n = getNextNudge({
          tier: scoreRes.tier,
          wearable: getWearableSnapshot() || undefined,
          env: undefined,
        });
        setNudge(n);
      } catch (error) {
        console.error(error);
      }
    };

    hydrateScoreAndNudge();
  }, [userName, t, setStreakCount]);

  useEffect(() => {
    if (level >= 3 && !achievements.includes("Level 3 • Disciplined Alpha")) {
      unlockAchievement("Level 3 • Disciplined Alpha");
    }
    if (streakCount >= 7 && !achievements.includes("7-Day Consistency")) {
      unlockAchievement("7-Day Consistency");
    }
    if (scans.length >= 3 && !achievements.includes("Scan Specialist")) {
      unlockAchievement("Scan Specialist");
    }
    if (categoriesCompleted === categories.length && !achievements.includes("Assessment Complete")) {
      unlockAchievement("Assessment Complete");
    }
  }, [level, streakCount, scans.length, categoriesCompleted, achievements, unlockAchievement]);

  useEffect(() => {
    if (!userName) return;

    if (!seenAchievementsRef.current) {
      seenAchievementsRef.current = new Set(achievements);
      return;
    }

    achievements.forEach((achievement) => {
      if (!seenAchievementsRef.current?.has(achievement)) {
        showToast(`Achievement unlocked: ${achievement}`, "success");
        seenAchievementsRef.current?.add(achievement);
      }
    });
  }, [achievements, showToast, userName]);

  useEffect(() => {
    if (userName && locationEnabled) {
      fetchLocationData();
    }
  }, [userName, locationEnabled, fetchLocationData]);

  useEffect(() => {
    if (!userName) return;
    initializeWeeklyMissions();
  }, [initializeWeeklyMissions, userName]);

  useEffect(() => {
    if (!userName) return;

    syncWeeklyMissions({
      assessmentAnswered: assessmentAnsweredCount,
      scansCount: scans.length,
      streakCount,
      consistencyScore: habitScore?.score || 0,
    });
  }, [assessmentAnsweredCount, scans.length, streakCount, habitScore, syncWeeklyMissions, userName]);

  useEffect(() => {
    if (!userName) return;

    const interval = setInterval(() => {
      setMissionResetLabel(getWeeklyResetTimeLabel());
    }, 60000);

    setMissionResetLabel(getWeeklyResetTimeLabel());
    return () => clearInterval(interval);
  }, [userName]);

  useEffect(() => {
    if (!userName) return;

    const doneMissionIds = new Set(
      weeklyMissions
        .filter((mission) => mission.progress >= mission.target)
        .map((mission) => mission.id)
    );

    if (!seenMissionCompletionsRef.current) {
      seenMissionCompletionsRef.current = doneMissionIds;
      return;
    }

    weeklyMissions.forEach((mission) => {
      const missionDone = mission.progress >= mission.target;
      if (missionDone && !mission.claimed && !seenMissionCompletionsRef.current?.has(mission.id)) {
        showToast(`Mission complete: ${mission.title}. Claim your reward.`, "success");
        seenMissionCompletionsRef.current?.add(mission.id);
      }
    });
  }, [weeklyMissions, showToast, userName]);

  const conciergeBriefing = useMemo(() => {
    const latestScan = scans.length > 0 ? scans[0] : null;
    const latestScanAt = latestScan ? new Date(latestScan.date) : null;
    const daysSinceLastScan = latestScanAt
      ? Math.max(0, Math.floor((Date.now() - latestScanAt.getTime()) / 86400000))
      : null;
    const completedMissionsCount = weeklyMissions.filter((mission) => mission.progress >= mission.target).length;
    const alphaScore = calculateAlphaScore(alphaScoreInput);

    return generateConciergeBriefing({
      alphaScore,
      consistencyScore: habitScore?.score || 0,
      completedMissions: completedMissionsCount,
      totalMissions: weeklyMissions.length,
      categoriesCompleted,
      totalCategories: categories.length,
      daysSinceLastScan,
    });
  }, [alphaScoreInput, habitScore?.score, weeklyMissions, categoriesCompleted, scans]);

  // --- RENDER LOGIC ---

  if (loadingAuth) return <div className="min-h-screen bg-black" />;

  // LOGOUT
  const handleLogout = () => {
    setUserName(null);
    localStorage.removeItem("oneman_user_name");
  }

  // If no user, show Landing Page (or Login Modal)
  if (!userName) {
    if (showLoginModal) {
      return (
        <div className="relative">
          <button 
            onClick={() => setShowLoginModal(false)}
            className="fixed top-6 right-6 z-[60] text-gray-400 hover:text-white"
          >
            <X className="w-8 h-8" />
          </button>
          <LoginScreen onLogin={(name) => {
            setUserName(name); 
            setShowLoginModal(false);
          }} />
        </div>
      );
    }
    return <LandingPage onStart={() => setShowLoginModal(true)} onLogin={() => setShowLoginModal(true)} onNavigate={(path) => router.push(path)} />;
  }

  const showLegacyDashboard = false;
  if (!showLegacyDashboard) {
    return (
      <LandingPage
        onStart={() => router.push("/image-analyzer")}
        onLogin={() => router.push("/profile")}
        onNavigate={(path) => router.push(path)}
      />
    );
  }

  // --- DASHBOARD RENDER ---

  const profileCompletion = Math.min(100, Math.round((categoriesCompleted / categories.length) * 100));
  const lastScan = scans.length > 0 ? scans[0] : null;
  const lastScanAt = lastScan ? new Date(lastScan.date) : null;
  const daysSinceLastScan = lastScanAt ? Math.max(0, Math.floor((Date.now() - lastScanAt.getTime()) / 86400000)) : null;
  const lastLoginLabel = lastLoginAt
    ? new Date(lastLoginAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
    : "First session";
  const nextTier = [...tiers].sort((a, b) => a.creditsCost - b.creditsCost).find((tier) => tier.creditsCost > credits) || null;
  const creditsToNextTier = nextTier ? Math.max(0, nextTier.creditsCost - credits) : 0;
  const recentAchievements = achievements.slice(-3).reverse();
  const completedMissions = weeklyMissions.filter((mission) => mission.progress >= mission.target).length;
  const alphaScoreValue = calculateAlphaScore(alphaScoreInput);

  const handleApplyWeekPlan = () => {
    const activeUser = userName || getActiveUserName();
    const payload = {
      mode: conciergeBriefing.mode,
      tone: conciergeBriefing.tone,
      expectedVisibleChangeWindow: conciergeBriefing.expectedVisibleChangeWindow,
      actions: conciergeBriefing.actions,
      generatedAt: new Date().toISOString(),
      alphaScore: alphaScoreValue,
      consistencyScore: habitScore?.score || 0,
    };

    setScopedLocalItem("oneman_weekly_concierge_plan_v1", JSON.stringify(payload), activeUser, true);
    setScopedSessionItem("oneman_prefilled_week_plan_v1", JSON.stringify(payload), activeUser, true);
    showToast("This week plan applied to your profile", "success");
  };

  const primaryAction = !lastScan
    ? { label: "Run Photo Analyzer", hint: "No recent scan found", path: "/image-analyzer" }
    : categoriesCompleted < categories.length
      ? { label: "Answer Category Questions", hint: `${categories.length - categoriesCompleted} categories pending`, path: "/assessment" }
      : { label: "Open Your AI Report", hint: "Review latest plan and actions", path: "/result" };

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 pb-20">
      
      {/* Dashboard Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Alpha <span className="text-blue-400">Focus</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-2 text-sm text-gray-200 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase hidden md:inline">{currentLang}</span>
              </button>
              {langMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-36 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden p-1 z-50">
                  <button onClick={() => toggleLanguage("en")} className="w-full px-4 py-2 text-left hover:bg-white/10 rounded-lg text-sm text-gray-200">
                    English
                  </button>
                  <button onClick={() => toggleLanguage("hi")} className="w-full px-4 py-2 text-left hover:bg-white/10 rounded-lg text-sm text-gray-200">
                    Hindi
                  </button>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-gray-300 border border-white/5">
              <MapPin className="w-3 h-3 text-blue-400" />
              {locationEnabled ? envSummary?.label || "Fetching..." : "Off"}
            </div>

            <button 
              onClick={handleLogout}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center text-blue-400 font-bold text-sm hover:border-blue-500/50 transition-colors"
              title="Logout"
            >
              {userName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 max-w-5xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-blue-400 font-medium mb-1 flex items-center gap-2">
              <Sun className="w-4 h-4" /> {greeting}, {userName}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Alpha Command Center
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              Last login: {lastLoginLabel} · Profile completion: {profileCompletion}% · Total scans: {scans.length}
            </p>
          </div>
          
          {habitScore && (
            <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-400">Consistency Score</p>
                <p className="text-xl font-bold text-white">{habitScore.score}/100</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
        </section>

        <section className="grid lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
            <p className="text-xs uppercase tracking-wider text-blue-300 mb-2">Priority Action</p>
            <h3 className="text-lg font-bold text-white mb-1">{primaryAction.label}</h3>
            <p className="text-sm text-blue-100/80 mb-4">{primaryAction.hint}</p>
            <button
              onClick={() => router.push(primaryAction.path)}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-110 transition-colors"
            >
              Continue Now
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Photo Analyzer</p>
            <h3 className="text-lg font-bold text-white mb-1">Keep Scan Data Fresh</h3>
            <p className="text-sm text-gray-300 mb-4">
              {daysSinceLastScan === null
                ? "No scans yet. Start your first photo analysis for high-precision insights."
                : `Last scan was ${daysSinceLastScan} day${daysSinceLastScan === 1 ? "" : "s"} ago. Refresh for better recommendations.`}
            </p>
            <button
              onClick={() => router.push("/image-analyzer")}
              className="text-sm font-semibold text-primary hover:text-primary/80"
            >
              Open Analyzer →
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Category Questions</p>
            <h3 className="text-lg font-bold text-white mb-1">Complete Your Profile</h3>
            <p className="text-sm text-gray-300 mb-4">
              {categoriesCompleted === categories.length
                ? "Great work — all categories are covered for advanced personalization."
                : `${categories.length - categoriesCompleted} categories still pending. Completing them improves routine precision.`}
            </p>
            <button
              onClick={() => {
                setShowQuestions(true);
                document.getElementById("inline-questions")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm font-semibold text-primary hover:text-primary/80"
            >
              Answer Now →
            </button>
          </div>
        </section>

        <AlphaScoreCard data={alphaScoreInput} monthlyDelta={alphaMonthlyDelta} />
        <ProgressChart data={alphaProgressData} />

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Alpha Progression</p>
            <p className="text-sm font-semibold text-white mb-2">Level {level} – {levelTitle}</p>
            <p className="text-2xl font-bold text-primary">{credits}</p>
            <p className="text-xs text-gray-500 mt-1">XP: {xp} · Lifetime earned: {lifetimeCredits}</p>
          </div>
          <div className="bg-surface border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Active Discount</p>
            <p className="text-2xl font-bold text-white">{activeDiscount ? `${activeDiscount.discountPercent}%` : "None"}</p>
            <p className="text-xs text-gray-500 mt-1">{activeDiscount ? activeDiscount.code : "Redeem from rewards"}</p>
          </div>
          <div className="bg-surface border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Assessment Progress</p>
            <p className="text-2xl font-bold text-white">{categoriesCompleted}/{categories.length}</p>
            <p className="text-xs text-gray-500 mt-1">{assessmentAnsweredCount} questions answered</p>
          </div>
          <div className="bg-surface border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Next Reward Tier</p>
            <p className="text-2xl font-bold text-white">{nextTier ? nextTier.label : "Maxed"}</p>
            <p className="text-xs text-gray-500 mt-1">{nextTier ? `${creditsToNextTier} credits to unlock` : "Top tier unlocked"}</p>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Medal className="w-4 h-4 text-blue-300" />
              <p className="text-xs text-gray-400 uppercase tracking-wider">Recent Achievements</p>
            </div>
            {recentAchievements.length > 0 ? (
              <div className="space-y-2">
                {recentAchievements.map((achievement) => (
                  <div key={achievement} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200">
                    {achievement}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No achievements unlocked yet. Keep progressing daily.</p>
            )}
          </div>

          <div className="bg-surface border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-blue-300" />
              <p className="text-xs text-gray-400 uppercase tracking-wider">Consistency Streak</p>
            </div>
            <p className="text-3xl font-bold text-white">{streakCount} days</p>
            <p className="text-xs text-gray-500 mt-2">Maintain momentum to unlock higher-tier Alpha achievements.</p>
          </div>
        </section>

        <section className="bg-surface border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Weekly Missions</p>
              <h3 className="text-lg font-bold text-white">{completedMissions}/{weeklyMissions.length} Completed</h3>
            </div>
            <span className="text-xs text-gray-400">Resets in {missionResetLabel}</span>
          </div>

          <div className="space-y-3">
            {weeklyMissions.map((mission) => {
              const missionDone = mission.progress >= mission.target;
              return (
                <div key={mission.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{mission.title}</p>
                      <p className="text-xs text-gray-400">{mission.description}</p>
                    </div>
                    <span className="text-xs text-primary font-semibold">+{mission.rewardCredits} credits</span>
                  </div>

                  <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                      style={{ width: `${Math.min(100, Math.round((mission.progress / mission.target) * 100))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{mission.progress}/{mission.target}</p>
                    {mission.claimed ? (
                      <span className="text-xs text-blue-300 font-semibold">Claimed</span>
                    ) : missionDone ? (
                      <button
                        onClick={() => {
                          const result = claimWeeklyMission(mission.id);
                          showToast(result.message, result.ok ? "success" : "info");
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-semibold hover:brightness-110"
                      >
                        Claim Reward
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">In progress</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-surface border border-white/10 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Concierge Mode</p>
              <h3 className="text-lg font-bold text-white">Weekly AI Briefing</h3>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${
              conciergeBriefing.mode === "optimization"
                ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-300"
            }`}>
              {conciergeBriefing.mode === "optimization" ? "Optimization" : "Recovery"}
            </span>
          </div>

          <p className="text-sm text-gray-200 mb-2">{conciergeBriefing.tone}</p>
          <p className="text-xs text-gray-400 mb-4">{conciergeBriefing.confidenceRationale}</p>

          <div className="space-y-3 mb-4">
            {conciergeBriefing.actions.map((action, index) => (
              <div key={`${action.title}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-white">{index + 1}. {action.title}</p>
                  <span className="text-[11px] text-blue-300">{action.expectedWindow}</span>
                </div>
                <p className="text-xs text-gray-400">{action.rationale}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-gray-400">
              Expected visible change window: <span className="text-gray-200 font-semibold">{conciergeBriefing.expectedVisibleChangeWindow}</span>
            </p>
            <button
              onClick={handleApplyWeekPlan}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:brightness-110 transition-colors"
            >
              Apply this week plan
            </button>
          </div>
        </section>

        {/* Nudge / Insight */}
        {nudge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-600/10 border border-blue-500/20 relative overflow-hidden"
          >
            <div className="relative z-10 flex gap-4 items-start">
              <div className="p-3 rounded-full bg-blue-500/20 text-blue-300">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">{nudge.title}</h3>
                <p className="text-gray-300 text-sm mb-3">{nudge.body}</p>
                <button 
                  onClick={() => router.push("/result")}
                  className="text-xs font-bold text-blue-300 hover:text-blue-200 uppercase tracking-wide flex items-center gap-1"
                >
                  {nudge.cta} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </motion.div>
        )}

        {/* Environment Quick View */}
        <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Environment Impact
            </h2>
            <div className="flex items-center gap-2">
               {!locationEnabled ? (
                 <button
                  onClick={() => toggleLocation(true)}
                  disabled={locationLoading}
                  className="text-xs px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                >
                  {locationLoading ? "Connecting..." : "Enable Location"}
                </button>
               ) : (
                <button
                  onClick={fetchLocationData}
                  disabled={locationLoading}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Refresh"
                >
                   <Activity className={`w-4 h-4 ${locationLoading ? "animate-spin" : ""}`} />
                </button>
               )}
            </div>
          </div>

          {locationEnabled && envSummary ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "UV Index", value: envSummary.uv, unit: "", icon: Sun, color: "text-blue-300" },
                { label: "UV Index", value: envSummary.uv, unit: "", icon: Sun, color: "text-blue-300" },
                { label: "Humidity", value: envSummary.humidity, unit: "%", icon: Activity, color: "text-blue-400" },
                { label: "Air Quality", value: envSummary.pollutionRisk, unit: "", icon: Activity, color: "text-indigo-300" },
                { label: "Temp", value: envSummary.tempC, unit: "°C", icon: Thermometer, color: "text-blue-300" },
              ].map((item) => (
                <div key={item.label} className="bg-black/40 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <p className="text-xl font-bold text-white">
                    {item.value}<span className="text-sm font-normal text-gray-500">{item.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              <MapPin className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              Enable location access to get real-time<br/>environmental skincare recommendations.
            </div>
          )}
          {locationError && <p className="text-center text-xs text-red-400 mt-4">{locationError}</p>}
        </section>

        {/* Quick Actions Grid */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6">Tools & Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push("/image-analyzer")}
              className="group p-6 rounded-3xl bg-zinc-900 border border-white/5 hover:border-blue-500/50 hover:bg-zinc-800 transition-all text-left relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">Face AI</h3>
                <p className="text-sm text-gray-400">Scan skin & face shape</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/result")}
              className="group p-6 rounded-3xl bg-zinc-900 border border-white/5 hover:border-blue-500/50 hover:bg-zinc-800 transition-all text-left relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">My Routine</h3>
                <p className="text-sm text-gray-400">View your daily plan</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/assessment")}
              className="group p-6 rounded-3xl bg-zinc-900 border border-white/5 hover:border-indigo-500/50 hover:bg-zinc-800 transition-all text-left relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">Assessment</h3>
                <p className="text-sm text-gray-400">Update your profile</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/settings")}
              className="group p-6 rounded-3xl bg-zinc-900 border border-white/5 hover:border-blue-500/50 hover:bg-zinc-800 transition-all text-left relative overflow-hidden"
            >
              <div className="relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                   <Settings className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">Settings</h3>
                <p className="text-sm text-gray-400">App preferences</p>
              </div>
            </button>
          </div>
        </section>

        {/* Quick Question Access (Legacy support but prettier) */}
        {!showQuestions && (
          <section id="inline-questions" className="relative rounded-3xl overflow-hidden min-h-[200px] flex items-center justify-center text-center p-8 group cursor-pointer border border-white/10" onClick={() => setShowQuestions(true)}>
            <div className="absolute inset-0">
               <Image 
                src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=2070&auto=format&fit=crop"
                alt="Product background"
                fill
                className="object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
               />
               <div className="absolute inset-0 bg-black/60" />
            </div>
            <div className="relative z-10 max-w-lg">
              <h2 className="text-2xl font-bold text-white mb-2">{t("questions_title")}</h2>
              <p className="text-gray-300 mb-6">{t("questions_subtitle")}</p>
              <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors">
                Answer Now <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </section>
        )}

        <AnimatePresence>
          {showQuestions && (
            <motion.section
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-zinc-900 border border-white/5 rounded-3xl"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Categories</h3>
                  <button onClick={() => setShowQuestions(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <div key={cat.id} className="rounded-xl border border-white/5 bg-black/40 overflow-hidden">
                        <button
                          onClick={() => setActiveCategory(isActive ? null : cat.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[cat.id]} flex items-center justify-center opacity-90 shadow-lg`}>
                               <span className="text-white text-xs font-bold">{cat.label[0]}</span>
                            </div>
                            <span className="font-medium text-white">{cat.label}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isActive ? "rotate-180" : ""}`} />
                        </button>
                        {isActive && (
                          <div className="px-4 pb-4 border-t border-white/5 bg-black/20 pt-4">
                            <div className="space-y-4">
                              {questions[cat.id].map((q) => (
                                <div key={q.id}>
                                  <p className="text-sm font-medium text-gray-300 mb-3">{q.text}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {q.options.map((opt) => (
                                      <button
                                        key={opt}
                                        onClick={() => handleInlineAnswerSelect(q.id, opt)}
                                        className={`px-4 py-2 rounded-lg border text-xs font-medium transition-all ${
                                          inlineAnswers[q.id] === opt
                                            ? "border-blue-500 bg-blue-500/10 text-blue-300"
                                            : "border-white/10 text-gray-400 hover:border-white/30 hover:text-white hover:bg-white/5"
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-white/5">
                    <button onClick={() => router.push("/assessment")} className="text-gray-400 hover:text-white text-sm font-medium px-4 py-2">
                      Full Assessment
                    </button>
                    <button
                      onClick={handleInlineResults}
                      disabled={Object.keys(inlineAnswers).length === 0}
                      className="px-6 py-2 rounded-lg bg-white text-black text-sm font-bold disabled:opacity-50 hover:bg-gray-200 transition-colors"
                    >
                      Update Results
                    </button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
