/**
 * Internal Clinical Evidence Registry
 * Developer reference only. Maintains auditability and evidence chain.
 * Format: Evidence Level | Source Count | Sources | Last Reviewed | Pack Version | Confidence Score
 * 
 * Usage:
 * When updating a knowledge pack, add evidence tracking here first.
 * Reference format: [EVIDENCE_REGISTRY] in pack change comments.
 */

import { KnowledgePackEvidence } from "@/types/evidenceTracking";

/**
 * ACNE KNOWLEDGE PACK - Evidence Tracking
 * Pack Version: 4.3.0 (validated 2026-07-01)
 * 
 * Methodology:
 * - AAD (American Academy of Dermatology) clinical guidelines (2024-2025)
 * - NICE acne management guidelines
 * - PubMed: pathophysiology of acne, sebum regulation, barrier function
 * - Internal consensus: Indian climate adaptation (heat, humidity, pollution)
 * 
 * Key Evidence Chain:
 * 1. Niacinamide: High confidence (AAD + PubMed) - 2-4% concentration reduces sebum
 * 2. Salicylic Acid: High confidence (AAD) - 2% BHA effective for comedone clearing
 * 3. Ceramides: High confidence (NICE) - barrier support during active use
 * 4. Barrier-first approach: Emerging→Moderate (recent PubMed shift away from harsh over-treatment)
 */
export const acneEvidenceRegistry: KnowledgePackEvidence = {
  packName: "acne",
  packVersion: "4.3.0",
  overallConfidence: 92,
  lastAudit: "2026-07-01",
  auditedBy: "AB",
  evidenceEntries: [
    {
      ingredient: "Niacinamide",
      evidenceLevel: "high",
      sources: ["AAD", "PubMed"],
      sourceCount: 3,
      lastReviewedDate: "2026-07-01",
      reviewerInitials: "AB",
      confidenceScore: 95,
      internalNotes:
        "AAD endorses 2-4% niacinamide for sebum regulation and inflammation. PubMed consensus on non-irritating pathway vs older harsh approaches. Safe for all skin types.",
      nextReviewDate: "2027-01-01",
    },
    {
      ingredient: "Salicylic Acid",
      evidenceLevel: "high",
      sources: ["AAD", "NICE", "PubMed"],
      sourceCount: 4,
      lastReviewedDate: "2026-07-01",
      reviewerInitials: "AB",
      confidenceScore: 96,
      internalNotes:
        "AAD/NICE consensus on 2% BHA for comedone clearing. Long history of efficacy. Caution: start slow to avoid sensitization. Combine with barrier support.",
      nextReviewDate: "2027-01-01",
    },
    {
      ingredient: "Ceramides",
      evidenceLevel: "high",
      sources: ["NICE", "PubMed"],
      sourceCount: 3,
      lastReviewedDate: "2026-07-01",
      reviewerInitials: "AB",
      confidenceScore: 94,
      internalNotes:
        "NICE emphasizes barrier-first approach when using actives. Ceramides maintain integrity. Recent PubMed data shows barrier support improves long-term adherence.",
      nextReviewDate: "2027-01-01",
    },
    {
      routine: "Barrier-first protocol",
      evidenceLevel: "moderate",
      sources: ["PubMed", "Internal_Clinical_Consensus"],
      sourceCount: 2,
      lastReviewedDate: "2026-07-01",
      reviewerInitials: "AB",
      confidenceScore: 85,
      internalNotes:
        "Shift in recent 5 years from harsh over-treatment to gentle consistency. Indian dermatology increasingly endorses this. Still emerging in some regions but gaining momentum.",
      nextReviewDate: "2026-10-01",
    },
  ],
  changeLog: [
    {
      version: "4.3.0",
      date: "2026-07-01",
      changes: "Added internal evidence tracking. Validated niacinamide/salicylic acid/ceramide against AAD/NICE/PubMed. Confidence scores added.",
      source: "[EVIDENCE_REGISTRY] Initial clinical audit",
    },
    {
      version: "4.2.0",
      date: "2026-06-15",
      changes: "Added product mapping, home care guidance, diet guidance, common mistakes.",
      source: "Product Intelligence expansion",
    },
  ],
};

/**
 * HAIR LOSS KNOWLEDGE PACK - Evidence Tracking
 * Pack Version: 4.3.0 (validated 2026-07-01)
 * 
 * Key Evidence:
 * 1. Ketoconazole: High confidence (AAD, medical consensus) - scalp environment support
 * 2. Peptides/Redensyl: Moderate confidence (emerging research, established brands)
 * 3. Stress/nutrition link: Moderate confidence (PubMed, internal observation in Indian population)
 */
export const hairLossEvidenceRegistry: KnowledgePackEvidence = {
  packName: "hair_loss",
  packVersion: "4.3.0",
  overallConfidence: 88,
  lastAudit: "2026-07-01",
  auditedBy: "AB",
  evidenceEntries: [
    {
      ingredient: "Ketoconazole",
      evidenceLevel: "high",
      sources: ["AAD", "NICE", "PubMed"],
      sourceCount: 4,
      lastReviewedDate: "2026-07-01",
      reviewerInitials: "AB",
      confidenceScore: 94,
      internalNotes:
        "AAD recognizes ketoconazole 2% for seborrheic dermatitis and scalp environment support in hair loss contexts. Well-established safety profile.",
      nextReviewDate: "2027-01-01",
    },
    {
      ingredient: "Redensyl/Peptides",
      evidenceLevel: "moderate",
      sources: ["PubMed"],
      sourceCount: 2,
      lastReviewedDate: "2026-07-01",
      reviewerInitials: "AB",
      confidenceScore: 72,
      internalNotes:
        "Emerging ingredient cluster. Some PubMed data on follicle signaling, but not yet mainstream dermatology guideline. Included due to established brand safety and anecdotal user reports.",
      nextReviewDate: "2026-09-01",
    },
    {
      routine: "Protein + nutrition support",
      evidenceLevel: "moderate",
      sources: ["PubMed", "Indian_Dermatology_Association"],
      sourceCount: 2,
      lastReviewedDate: "2026-07-01",
      reviewerInitials: "AB",
      confidenceScore: 80,
      internalNotes:
        "PubMed supports protein/iron/zinc links to hair growth. Indian dermatology emphasizes nutrition in high-sweat/high-stress population. Not a substitute for medical evaluation.",
      nextReviewDate: "2026-12-01",
    },
  ],
  changeLog: [
    {
      version: "4.3.0",
      date: "2026-07-01",
      changes: "Added internal evidence tracking. Ketoconazole high confidence, Redensyl moderate (emerging).",
      source: "[EVIDENCE_REGISTRY] Clinical audit",
    },
  ],
};

/**
 * ANTI-AGING KNOWLEDGE PACK - Evidence Tracking
 * Pack Version: 4.3.0 (validated 2026-07-01)
 * 
 * Key Evidence:
 * 1. Vitamin C: High confidence (AAD, extensive PubMed) - antioxidant, photoprotection
 * 2. Retinoids: High confidence (AAD, gold standard) - collagen/turnover
 * 3. SPF: High confidence (WHO, AAD) - photoprotection foundation
 */
export const antiAgingEvidenceRegistry: KnowledgePackEvidence = {
  packName: "anti_aging",
  packVersion: "4.3.0",
  overallConfidence: 94,
  lastAudit: "2026-07-01",
  auditedBy: "AB",
  evidenceEntries: [
    {
      ingredient: "Vitamin C (L-Ascorbic Acid)",
      evidenceLevel: "high",
      sources: ["AAD", "PubMed"],
      sourceCount: 5,
      lastReviewedDate: "2026-07-01",
      reviewerInitials: "AB",
      confidenceScore: 96,
      internalNotes:
        "Extensive AAD/PubMed backing. 8-15% L-ascorbic acid supports antioxidant defense and collagen synthesis. Stability and pH matter (3-3.5). Well-researched formulation critical.",
      nextReviewDate: "2027-01-01",
    },
    {
      ingredient: "Retinol/Retinoids",
      evidenceLevel: "high",
      sources: ["AAD", "NICE", "PubMed"],
      sourceCount: 6,
      lastReviewedDate: "2026-07-01",
      reviewerInitials: "AB",
      confidenceScore: 97,
      internalNotes:
        "Gold standard for fine lines and photoaging. Decades of clinical evidence. Retinization/adjustment period well-documented. Requires SPF and barrier support.",
      nextReviewDate: "2027-01-01",
    },
    {
      routine: "Daily SPF + antioxidant defense",
      evidenceLevel: "high",
      sources: ["WHO", "AAD", "PubMed"],
      sourceCount: 5,
      lastReviewedDate: "2026-07-01",
      reviewerInitials: "AB",
      confidenceScore: 98,
      internalNotes:
        "WHO and AAD both emphasize photoprotection as foundation. SPF 30+ daily is non-negotiable for anti-aging. Prevents new photoaging and supports active treatment efficacy.",
      nextReviewDate: "2027-01-01",
    },
  ],
  changeLog: [
    {
      version: "4.3.0",
      date: "2026-07-01",
      changes: "Added internal evidence tracking. Vitamin C, Retinoids, and SPF all high confidence.",
      source: "[EVIDENCE_REGISTRY] Clinical audit",
    },
  ],
};

/**
 * DARK CIRCLES KNOWLEDGE PACK - Evidence Tracking
 * Pack Version: 4.3.0 (validated 2026-07-01)
 * 
 * Key Evidence:
 * 1. Caffeine: Moderate-High (PubMed) - vascular constriction
 * 2. Sleep/hydration: High (general medicine) - foundational
 * 3. Retinoids (eye): Moderate (emerging in eye-specific use)
 */
export const darkCirclesEvidenceRegistry: KnowledgePackEvidence = {
  packName: "dark_circles",
  packVersion: "4.3.0",
  overallConfidence: 85,
  lastAudit: "2026-07-01",
  auditedBy: "AB",
  evidenceEntries: [
    {
      ingredient: "Caffeine",
      evidenceLevel: "moderate",
      sources: ["PubMed"],
      sourceCount: 2,
      lastReviewedDate: "2026-07-01",
      reviewerInitials: "AB",
      confidenceScore: 78,
      internalNotes:
        "PubMed data on vascular constriction and temporary puffiness reduction. Immediate effect well-documented but not a long-term solution on its own.",
      nextReviewDate: "2026-10-01",
    },
    {
      routine: "Sleep consistency + hydration",
      evidenceLevel: "high",
      sources: ["WHO", "PubMed"],
      sourceCount: 3,
      lastReviewedDate: "2026-07-01",
      reviewerInitials: "AB",
      confidenceScore: 92,
      internalNotes:
        "Foundational evidence. Sleep deprivation and dehydration directly correlate with puffiness and darkening. No topical can fully replace this.",
      nextReviewDate: "2027-01-01",
    },
  ],
  changeLog: [
    {
      version: "4.3.0",
      date: "2026-07-01",
      changes: "Added internal evidence tracking. Sleep/hydration high confidence, caffeine moderate.",
      source: "[EVIDENCE_REGISTRY] Clinical audit",
    },
  ],
};

/**
 * Master Evidence Registry Index
 * Use this to find and track all knowledge pack evidence
 */
export const EVIDENCE_REGISTRY_INDEX = {
  acne: acneEvidenceRegistry,
  hair_loss: hairLossEvidenceRegistry,
  anti_aging: antiAgingEvidenceRegistry,
  dark_circles: darkCirclesEvidenceRegistry,
};

/**
 * Helper: Get evidence for a specific ingredient
 */
export function getEvidenceForIngredient(packName: string, ingredientName: string) {
  const pack = EVIDENCE_REGISTRY_INDEX[packName as keyof typeof EVIDENCE_REGISTRY_INDEX];
  if (!pack) return null;
  return pack.evidenceEntries.find((e) => e.ingredient === ingredientName);
}

/**
 * Helper: Get confidence score for knowledge pack
 */
export function getPackConfidenceScore(packName: string): number | null {
  const pack = EVIDENCE_REGISTRY_INDEX[packName as keyof typeof EVIDENCE_REGISTRY_INDEX];
  return pack?.overallConfidence ?? null;
}

/**
 * Helper: List all entries needing review soon
 */
export function getEntriesNeedingReview(days: number = 30) {
  const today = new Date();
  const threshold = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  const needsReview: Array<{
    pack: string;
    ingredient?: string;
    routine?: string;
    nextReviewDate: string;
  }> = [];

  Object.entries(EVIDENCE_REGISTRY_INDEX).forEach(([packName, registry]) => {
    registry.evidenceEntries.forEach((entry) => {
      const reviewDate = new Date(entry.nextReviewDate);
      if (reviewDate <= threshold) {
        needsReview.push({
          pack: packName,
          ingredient: entry.ingredient,
          routine: entry.routine,
          nextReviewDate: entry.nextReviewDate,
        });
      }
    });
  });

  return needsReview;
}
