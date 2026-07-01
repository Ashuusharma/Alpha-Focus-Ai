# Clinical Evidence Review & Maintenance Guide

## Overview

This document describes how Alpha Focus maintains internal clinical confidence and evidence tracking **without creating runtime dependencies, copying text, or replacing Alpha Focus logic**.

**Key Principle**: The evidence registry is a **developer-only audit trail**. Users never see it. It strengthens deterministic quality through transparency and accountability.

---

## Structure

### 1. Evidence Registry Files

- **`types/evidenceTracking.ts`**: Type definitions for evidence tracking
  - `EvidenceLevel`: high | moderate | emerging
  - `ClinicalReference`: AAD, NICE, NHS, WHO, PubMed, etc.
  - `EvidenceEntry`: Single ingredient/routine evidence record
  - `KnowledgePackEvidence`: Full evidence audit for a knowledge pack

- **`docs/EVIDENCE_REGISTRY.ts`**: Master registry with all evidence entries
  - Indexed by knowledge pack (acne, hair_loss, etc.)
  - Each pack tracks all ingredients and routines
  - Helper functions for evidence lookup and review scheduling

### 2. Knowledge Pack Integration

Each `knowledge/[category].ts` now includes:
```typescript
export const [category]KnowledgePack: CategoryKnowledgePack = {
  category: "acne",
  version: "4.3.0",
  evidenceRegistry: "acne",           // Key to lookup in EVIDENCE_REGISTRY_INDEX
  lastEvidenceReview: "2026-07-01",  // ISO date of last clinical audit
  clinicalConfidenceScore: 92,       // 0-100 from evidence registry
  // ... rest of pack
};
```

---

## Evidence Entry Anatomy

Each ingredient/routine tracked includes:

```typescript
{
  ingredient?: string;              // e.g., "Niacinamide" (if ingredient-specific)
  routine?: string;                 // e.g., "Barrier-first protocol" (if routine-specific)
  
  evidenceLevel: "high" | "moderate" | "emerging";
  sources: ["AAD", "NICE", "PubMed"]; // Clinical references used
  sourceCount: 3;                   // How many independent sources agree
  
  lastReviewedDate: "2026-07-01";  // When evidence was last validated
  reviewerInitials: "AB";           // Developer who conducted review
  confidenceScore: 95;              // 0-100, reflects source consistency
  
  internalNotes: string;            // Developer narrative:
                                    // - What sources say
                                    // - Key contradictions or nuances
                                    // - Why we trust or question this
                                    // - Regional/population considerations
  
  nextReviewDate: "2027-01-01";    // Schedule for re-validation
}
```

### Evidence Levels

- **High**: Multiple peer-reviewed sources (AAD, NICE, PubMed). >90% confidence. Little debate.
  - Example: Niacinamide 2-4% for sebum control, Retinoids for photoaging
  
- **Moderate**: 2+ sources, some emerging research, or regional consensus building.
  - Example: Barrier-first approach (recent shift), Peptides/Redensyl (brand-established but not yet guideline)
  - Confidence: 70-89%
  
- **Emerging**: 1 source or experimental. Lower confidence, included for transparency.
  - Example: New ingredient clusters, preliminary PubMed data
  - Confidence: <70%

### Acceptable Clinical References

1. **AAD** - American Academy of Dermatology (www.aad.org)
   - Gold standard for dermatology guidance
   - Use: Guidelines, position statements, clinical evidence reviews

2. **NICE** - National Institute for Health and Care Excellence (www.nice.org.uk)
   - UK evidence-based guidance
   - Use: Condition management, barrier-first approaches

3. **NHS** - National Health Service (www.nhs.uk)
   - UK health guidance
   - Use: Consumer-grade validation, lifestyle context

4. **WHO** - World Health Organization (www.who.int)
   - Use: Photoprotection, general wellness, global epidemiology

5. **PubMed** - PubMed Central (pubmed.ncbi.nlm.nih.gov)
   - Peer-reviewed journal articles
   - Use: Mechanistic studies, emerging evidence, population-specific research
   - Prefer: 2+ independent papers confirming, recent (last 5 years)

6. **Indian Dermatology Association** - Regional expert consensus
   - Use: Climate/lifestyle adaptations, population-specific protocols
   - Context: High heat/humidity/pollution, commute patterns, affordability

7. **Internal Clinical Consensus** - Alpha Focus team review
   - Use: When sources agree but no single guideline exists
   - Requires: 2+ team members' clinical review

---

## How to Update Evidence Registry

### When Adding a New Ingredient/Routine

1. **Research Phase**
   - Read 2-3 sources (AAD, NICE, PubMed, etc.)
   - Document findings and contradictions
   - Note: Do NOT copy text. Summarize logic in own words.

2. **Create Evidence Entry**
   ```typescript
   {
     ingredient: "Salicylic Acid",
     evidenceLevel: "high",
     sources: ["AAD", "NICE", "PubMed"],
     sourceCount: 4,
     lastReviewedDate: "2026-07-01",
     reviewerInitials: "AB",  // Your initials
     confidenceScore: 96,
     internalNotes: "AAD endorses 2% BHA for comedone clearing. NICE emphasizes in routine protocols. PubMed confirms efficacy with proper concentration. Caution: requires barrier support and SPF.",
     nextReviewDate: "2027-01-01",  // 6 months for high, 3 months for moderate/emerging
   }
   ```

3. **Add to Knowledge Pack**
   - Push to `EVIDENCE_REGISTRY.ts`
   - Update pack version (e.g., 4.2.0 → 4.3.0 if major change, or 4.2.1 if minor)
   - Add changelog entry

### When Updating a Knowledge Pack Version

1. **Review existing entries**
   - Check `nextReviewDate` to see what's due
   - Use helper: `getEntriesNeedingReview(days=30)` to find items

2. **Re-validate entries**
   - Check if evidence still holds
   - Add new sources if available
   - Adjust `confidenceScore` if evidence has shifted
   - Update `lastReviewedDate`

3. **Update Pack Version**
   - Patch version (4.3.1): Minor evidence updates, same sources
   - Minor version (4.4.0): New ingredients, new sources, or confidence shifts
   - Major version (5.0.0): Fundamental protocol change (rare)

4. **Update Knowledge Pack File**
   ```typescript
   export const acneKnowledgePack: CategoryKnowledgePack = {
     category: "acne",
     version: "4.3.1",                          // Updated
     evidenceRegistry: "acne",
     lastEvidenceReview: "2026-07-15",          // Updated
     clinicalConfidenceScore: 93,               // May shift +/- 1-2 points
     // ... rest unchanged
   };
   ```

---

## Quarterly Audit Checklist

Run this every 3 months to maintain evidence quality:

```typescript
import { getEntriesNeedingReview } from "@/docs/EVIDENCE_REGISTRY";

// 1. Find items due for review
const needsReview = getEntriesNeedingReview(days: 90);

// 2. For each entry:
//    - Re-validate against latest sources
//    - Check if AAD/NICE have new guidelines
//    - Look for new PubMed papers
//    - Update confidence score if evidence shifted

// 3. Update EVIDENCE_REGISTRY.ts
//    - Extend nextReviewDate
//    - Add new findings to internalNotes
//    - Adjust sourceCount if sources added

// 4. Update affected knowledge pack version
//    - Version bump
//    - Update lastEvidenceReview date
//    - Update clinicalConfidenceScore if pack average shifted

// 5. Commit with message:
//    [EVIDENCE_AUDIT] acne pack: re-validated niacinamide, BHA sources (4.3.1)
```

---

## Examples

### Example 1: Adding Emerging Ingredient

Scenario: New peptide ingredient gaining brand traction, but limited PubMed data.

```typescript
{
  ingredient: "Redensyl",
  evidenceLevel: "moderate",  // Not enough papers for "high"
  sources: ["PubMed"],        // Only 2 papers found
  sourceCount: 2,
  lastReviewedDate: "2026-07-01",
  reviewerInitials: "AB",
  confidenceScore: 72,        // Below 80, reflects limited evidence
  internalNotes: "Found 2 PubMed studies on follicle signaling. Not yet in AAD/NICE guidelines. Brand safety well-established (no toxicity reports). Included due to anecdotal user reports in internal feedback and establishment in clinical products. Schedule for re-review in 6 months when more PubMed data expected.",
  nextReviewDate: "2027-01-01",
}
```

### Example 2: Shifting Evidence (Barrier-First Approach)

Scenario: Evidence moving from "emerging" to "moderate" as PubMed consensus builds.

**2025 Entry**:
```
evidenceLevel: "emerging"
confidenceScore: 60
```

**2026 Re-Audit**:
```
evidenceLevel: "moderate"  // Upgraded
sources: ["PubMed", "Internal_Clinical_Consensus"]
sourceCount: 2             // More studies
confidenceScore: 85        // Increased confidence
internalNotes: "Shift in recent 2 years away from harsh over-treatment. 5+ new PubMed papers support gentle barrier-first approach. Indian dermatology increasingly endorsing. Still not in formal AAD guidelines but gaining momentum."
```

### Example 3: High-Confidence Gold Standard

Scenario: Retinoids - decades of evidence, multiple sources, no debate.

```typescript
{
  ingredient: "Retinol/Retinoids",
  evidenceLevel: "high",
  sources: ["AAD", "NICE", "PubMed"],
  sourceCount: 6,  // Many papers, clear consensus
  lastReviewedDate: "2026-07-01",
  reviewerInitials: "AB",
  confidenceScore: 97,  // Very high confidence
  internalNotes: "Gold standard for anti-aging since 1980s. Decades of clinical trials, multiple formulations proven safe. AAD/NICE both endorse. Retinization/adjustment period well-documented. Only caution: requires SPF and barrier support during transition. No new concerns in recent literature.",
  nextReviewDate: "2027-01-01",  // Can extend further for high-confidence items
}
```

---

## Key Rules

1. **Do not copy text** from AAD/NICE/WHO/PubMed
   - Summarize findings in own words
   - Cite reference (e.g., "AAD 2024 guidelines state...")
   - Add developer interpretation

2. **Do not create runtime dependencies**
   - Evidence registry is TypeScript dev-only
   - Never call EVIDENCE_REGISTRY in production API
   - Never expose confidence scores to users

3. **Do not replace Alpha Focus logic**
   - Registry validates existing deterministic structure
   - Does not change product selection or routines
   - Only supports/questions/strengthens what's already there

4. **Maintain regional context**
   - Indian population-specific notes (heat, humidity, pollution, affordability)
   - Cross-reference Internal_Clinical_Consensus for local insights
   - Include lifestyle/cultural adaptation rationale

5. **Version carefully**
   - Patch version: Evidence tweaks, same sources
   - Minor version: New ingredients, sources added
   - Major version: Protocol fundamentally changes (rare)

---

## Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Review due items | Monthly | Dev team |
| Re-validate entries | Quarterly | Clinical reviewer |
| Add new emerging research | As available | Dev team |
| Full pack audit | Annual | Clinical lead + Dev |
| Version release | Per changes | Dev team |

---

## Helper Functions

```typescript
// Find entries needing review in next 30 days
getEntriesNeedingReview(30);

// Get confidence score for a pack
getPackConfidenceScore("acne");  // Returns 92

// Get evidence for specific ingredient
getEvidenceForIngredient("acne", "Niacinamide");

// List all high-confidence ingredients
Object.values(EVIDENCE_REGISTRY_INDEX)
  .flatMap(p => p.evidenceEntries)
  .filter(e => e.evidenceLevel === "high");
```

---

## File References

- **Type definitions**: `types/evidenceTracking.ts`
- **Registry data**: `docs/EVIDENCE_REGISTRY.ts`
- **Knowledge pack metadata**: `knowledge/types.ts` (includes `evidenceRegistry`, `lastEvidenceReview`, `clinicalConfidenceScore`)
- **Individual packs**: `knowledge/[acne|antiAging|etc].ts`

---

## Example Audit Commit Message

```
[EVIDENCE_AUDIT_Q3_2026] Clinical confidence review

- Acne (4.3.1): Re-validated niacinamide/BHA against AAD 2025, NICE, PubMed (6 sources). Confidence 92→93.
- Hair Loss (4.3.0): Ketoconazole high confidence confirmed. Redensyl moderate (2 PubMed papers).
- Anti-Aging (4.3.0): Vitamin C, Retinoids confirmed high confidence. SPF foundation endorsed by WHO.

All packs now tracked in EVIDENCE_REGISTRY_INDEX. Next scheduled audit: 2026-10-01.

Reviewed by: AB
```

---

**Last Updated**: 2026-07-01  
**Maintained By**: Alpha Focus Clinical Team
