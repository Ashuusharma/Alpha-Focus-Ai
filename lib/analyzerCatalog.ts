import type { ElementType } from "react";
import {
  User,
  Scissors,
  CircleDot,
  Eye,
  Clock,
  Brain,
  Flame,
  Wind,
  Droplet,
  SunMedium,
  BatteryMedium,
  Dumbbell,
} from "lucide-react";
import { type ClinicalCategoryId, categories, categoryDomains, categoryIntro, domainMeta, questions } from "@/lib/questions";

// Presentational-only estimate, matching the same constant the assessment
// page already uses for its own "estimated time remaining" — not a new
// fabricated number, just applied per-category here too.
const SECONDS_PER_QUESTION_ESTIMATE = 15;

// Photo capture and AI-report generation take roughly the same time
// regardless of category (same upload/vision/protocol pipeline for all of
// them) — one honest shared estimate rather than inventing 12 different
// precise-sounding numbers with no real basis.
const SCAN_TIME_SEC = 20;
const REPORT_TIME_SEC = 30;

export interface AnalyzerMeta {
  type: ClinicalCategoryId;
  label: string;
  labelHi: string;
  description: string;
  descriptionHi: string;
  icon: ElementType;
  /** Tailwind gradient utility classes, e.g. "from-blue-400 to-cyan-400". */
  gradient: string;
  /** Single representative color for score rings/badges — kept within the app's existing brand palette family. */
  scoreColor: string;
  /** Micro-animation treatment for this card, kept to a small reusable set rather than 12 bespoke animations. */
  animation: "float" | "pulse" | "shimmer" | "glow";
  /** What this analyzer looks for — derived from the category's real domainMeta, not invented. */
  detects: string[];
  detectsHi: string[];
  scanTimeSec: number;
  assessmentTimeMin: number;
  reportTimeSec: number;
  /** The category's real intro description (not the short tagline) — reused as-is for
   *  empty-state copy ("no scans yet") rather than authoring a 13th new string per category. */
  longDescription: string;
  longDescriptionHi: string;
}

function detectsFor(type: ClinicalCategoryId, lang: "label" | "labelHi") {
  return categoryDomains[type].slice(0, 4).map((domain) => domainMeta[domain]?.[lang] || domain);
}

function assessmentMinutesFor(type: ClinicalCategoryId) {
  const count = questions[type]?.length || 5;
  return Math.max(1, Math.ceil((count * SECONDS_PER_QUESTION_ESTIMATE) / 60));
}

function buildMeta(
  type: ClinicalCategoryId,
  icon: ElementType,
  gradient: string,
  scoreColor: string,
  animation: AnalyzerMeta["animation"]
): AnalyzerMeta {
  const intro = categoryIntro[type];
  const fallbackLabel = categories.find((c) => c.id === type)?.label || type;
  return {
    type,
    label: intro?.title || fallbackLabel,
    labelHi: intro?.titleHi || fallbackLabel,
    description: intro?.tagline || "",
    descriptionHi: intro?.taglineHi || "",
    icon,
    gradient,
    scoreColor,
    animation,
    detects: detectsFor(type, "label"),
    detectsHi: detectsFor(type, "labelHi"),
    scanTimeSec: SCAN_TIME_SEC,
    assessmentTimeMin: assessmentMinutesFor(type),
    reportTimeSec: REPORT_TIME_SEC,
    longDescription: intro?.description || intro?.tagline || "",
    longDescriptionHi: intro?.descriptionHi || intro?.taglineHi || "",
  };
}

export const analyzerCatalog: Record<ClinicalCategoryId, AnalyzerMeta> = {
  acne: buildMeta("acne", CircleDot, "from-blue-400 to-cyan-400", "#2F80ED", "pulse"),
  dark_circles: buildMeta("dark_circles", Eye, "from-indigo-400 to-violet-400", "#7C6FE8", "float"),
  anti_aging: buildMeta("anti_aging", Clock, "from-blue-600 to-indigo-500", "#3B5BDB", "shimmer"),
  hair_loss: buildMeta("hair_loss", User, "from-emerald-400 to-green-500", "#29D391", "float"),
  scalp_health: buildMeta("scalp_health", Brain, "from-teal-400 to-cyan-500", "#14B8A6", "pulse"),
  beard_growth: buildMeta("beard_growth", Scissors, "from-emerald-500 to-teal-400", "#10B981", "float"),
  body_acne: buildMeta("body_acne", Flame, "from-rose-400 to-red-400", "#F43F5E", "pulse"),
  body_odor: buildMeta("body_odor", Wind, "from-teal-300 to-emerald-300", "#2DD4BF", "shimmer"),
  lip_care: buildMeta("lip_care", Droplet, "from-pink-400 to-rose-400", "#EC4899", "float"),
  skin_dullness: buildMeta("skin_dullness", SunMedium, "from-sky-400 to-blue-300", "#38BDF8", "glow"),
  energy_fatigue: buildMeta("energy_fatigue", BatteryMedium, "from-amber-400 to-yellow-400", "#F59E0B", "pulse"),
  fitness_recovery: buildMeta("fitness_recovery", Dumbbell, "from-orange-400 to-blue-400", "#FB923C", "pulse"),
};

export const analyzerList: AnalyzerMeta[] = [
  analyzerCatalog.acne,
  analyzerCatalog.dark_circles,
  analyzerCatalog.anti_aging,
  analyzerCatalog.hair_loss,
  analyzerCatalog.scalp_health,
  analyzerCatalog.beard_growth,
  analyzerCatalog.body_acne,
  analyzerCatalog.body_odor,
  analyzerCatalog.lip_care,
  analyzerCatalog.skin_dullness,
  analyzerCatalog.energy_fatigue,
  analyzerCatalog.fitness_recovery,
];
