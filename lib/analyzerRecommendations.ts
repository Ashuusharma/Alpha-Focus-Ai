import { type ClinicalCategoryId } from "@/lib/questions";
import { analyzerList } from "@/lib/analyzerCatalog";

export interface RecommendedAnalyzer {
  type: ClinicalCategoryId;
  reason: string;
  reasonHi: string;
}

export interface RecommendationInput {
  /** Most recent scan date (ISO string) per category, from real photo_scans rows. */
  scansByCategory: Partial<Record<ClinicalCategoryId, string>>;
  /** Categories with at least one real assessment_answers row. */
  assessedCategories: ClinicalCategoryId[];
  /** The category currently active in user_active_analysis, if any. */
  activeProtocolCategory: ClinicalCategoryId | null;
}

/**
 * Simple, transparent rule-based ranking over real user data — not a new
 * AI/ML model, and it never fabricates a "popular" or "trending" claim it
 * can't back up. Three rules, in priority order:
 *   1. Active-protocol category overdue for a re-scan (30+ days, or never scanned).
 *   2. Categories never assessed yet at all.
 *   3. Fallback: the catalog's default order, framed as a neutral suggestion.
 */
export function getRecommendedAnalyzers(input: RecommendationInput, limit = 3): RecommendedAnalyzer[] {
  const now = Date.now();
  const recs: RecommendedAnalyzer[] = [];
  const seen = new Set<ClinicalCategoryId>();

  const add = (type: ClinicalCategoryId, reason: string, reasonHi: string) => {
    if (seen.has(type) || recs.length >= limit) return;
    seen.add(type);
    recs.push({ type, reason, reasonHi });
  };

  if (input.activeProtocolCategory) {
    const lastScanIso = input.scansByCategory[input.activeProtocolCategory];
    const daysSince = lastScanIso ? (now - new Date(lastScanIso).getTime()) / (24 * 60 * 60 * 1000) : Infinity;
    if (daysSince >= 30) {
      const label = analyzerList.find((a) => a.type === input.activeProtocolCategory)?.label || input.activeProtocolCategory;
      const labelHi = analyzerList.find((a) => a.type === input.activeProtocolCategory)?.labelHi || label;
      add(
        input.activeProtocolCategory,
        `Time for your ${label} progress check-in`,
        `आपके ${labelHi} की प्रगति जांचने का समय आ गया है`
      );
    }
  }

  for (const meta of analyzerList) {
    if (recs.length >= limit) break;
    if (!input.assessedCategories.includes(meta.type)) {
      add(meta.type, `Start your ${meta.label} analysis`, `अपना ${meta.labelHi} विश्लेषण शुरू करें`);
    }
  }

  for (const meta of analyzerList) {
    if (recs.length >= limit) break;
    add(meta.type, `Explore ${meta.label}`, `${meta.labelHi} देखें`);
  }

  return recs;
}
