/**
 * Internal clinical confidence and evidence tracking.
 * Not exposed to users. Used for knowledge maintenance and auditability.
 */

export type EvidenceLevel = "high" | "moderate" | "emerging";

export type ClinicalReference =
  | "AAD" // American Academy of Dermatology
  | "NICE" // National Institute for Health and Care Excellence
  | "NHS" // National Health Service
  | "WHO" // World Health Organization
  | "PubMed" // PubMed Central or peer-reviewed journals
  | "Indian_Dermatology_Association"
  | "Internal_Clinical_Consensus";

export type EvidenceEntry = {
  ingredient?: string; // If tracking specific ingredient
  routine?: string; // If tracking specific routine step
  evidenceLevel: EvidenceLevel;
  sources: ClinicalReference[];
  sourceCount: number;
  lastReviewedDate: string; // ISO 8601 format, e.g., "2026-07-01"
  reviewerInitials: string; // e.g., "AB", "CD" - developer who validated
  confidenceScore: number; // 0-100, reflects consistency across sources
  internalNotes: string; // Developer notes on findings, contradictions, or decisions
  nextReviewDate: string; // When to re-validate this evidence
};

export type KnowledgePackEvidence = {
  packName: string; // e.g., "acne", "hair_loss"
  packVersion: string; // e.g., "4.3.0"
  evidenceEntries: EvidenceEntry[];
  overallConfidence: number; // Average confidence across all entries
  lastAudit: string; // ISO date of last full pack audit
  auditedBy: string; // Reviewer initials
  changeLog: Array<{
    version: string;
    date: string;
    changes: string;
    source: string;
  }>;
};
