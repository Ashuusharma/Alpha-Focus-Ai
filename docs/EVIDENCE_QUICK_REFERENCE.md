# Evidence Tracking Quick Reference

## Evidence Level Definitions

| Level | Confidence | Sources | Use Case | Review Frequency |
|-------|-----------|---------|----------|------------------|
| **High** | 90-99% | 3+ (AAD, NICE, PubMed consensus) | Gold standard, well-researched | Annual |
| **Moderate** | 70-89% | 2+ sources, some emerging | Building consensus, brand-established | Quarterly |
| **Emerging** | <70% | 1 source or experimental | New ingredients, preliminary data | Monthly |

---

## Knowledge Pack Evidence Summary (as of 2026-07-01)

### Acne Pack v4.3.0
```
Overall Confidence: 92%
Last Reviewed: 2026-07-01
Reviewer: AB

HIGH:
  ✓ Niacinamide 2-4%        [AAD + PubMed] → 95% confidence
  ✓ Salicylic Acid 2% BHA   [AAD + NICE + PubMed] → 96% confidence
  ✓ Ceramides               [NICE + PubMed] → 94% confidence

MODERATE:
  → Barrier-first protocol  [PubMed + Internal] → 85% confidence (emerging→moderate shift)
```

### Hair Loss Pack v4.3.0
```
Overall Confidence: 88%
Last Reviewed: 2026-07-01
Reviewer: AB

HIGH:
  ✓ Ketoconazole 2%         [AAD + NICE + PubMed] → 94% confidence

MODERATE:
  → Redensyl/Peptides       [PubMed] → 72% confidence (emerging ingredient)
  → Protein + nutrition     [PubMed + Indian_Derm] → 80% confidence
```

### Anti-Aging Pack v4.3.0
```
Overall Confidence: 94%
Last Reviewed: 2026-07-01
Reviewer: AB

HIGH:
  ✓ Vitamin C (L-Ascorbic)  [AAD + PubMed] → 96% confidence
  ✓ Retinol/Retinoids       [AAD + NICE + PubMed] → 97% confidence
  ✓ Daily SPF + defense     [WHO + AAD + PubMed] → 98% confidence
```

### Dark Circles Pack v4.3.0
```
Overall Confidence: 85%
Last Reviewed: 2026-07-01
Reviewer: AB

MODERATE:
  → Caffeine                [PubMed] → 78% confidence (temporary effect)

HIGH:
  ✓ Sleep + hydration       [WHO + PubMed] → 92% confidence (foundational)
```

---

## Key Evidence Sources

### Trusted References
- **AAD** (American Academy of Dermatology)
  - Best for: Dermatology guidelines, product recommendations
  - URL: www.aad.org

- **NICE** (National Institute for Health and Care Excellence)
  - Best for: Evidence-based care pathways, barrier-first approaches
  - URL: www.nice.org.uk

- **WHO** (World Health Organization)
  - Best for: Photoprotection, global wellness, epidemiology
  - URL: www.who.int

- **PubMed** (Peer-Reviewed Literature)
  - Best for: Mechanistic studies, emerging evidence, population-specific research
  - URL: pubmed.ncbi.nlm.nih.gov
  - Preference: 2+ independent papers, recent (5 years)

---

## How to Use in Code

### Get confidence for a pack
```typescript
import { getPackConfidenceScore } from "@/docs/EVIDENCE_REGISTRY";

const confidence = getPackConfidenceScore("acne");
// Returns: 92
```

### Get evidence for specific ingredient
```typescript
import { getEvidenceForIngredient } from "@/docs/EVIDENCE_REGISTRY";

const aceEvidience = getEvidenceForIngredient("acne", "Niacinamide");
// Returns: { evidenceLevel: "high", confidenceScore: 95, sources: ["AAD", "PubMed"], ... }
```

### Find items needing review
```typescript
import { getEntriesNeedingReview } from "@/docs/EVIDENCE_REGISTRY";

// Find items due for review within 30 days
const needsReview = getEntriesNeedingReview(30);
// Returns: [{ pack: "acne", ingredient: "Redensyl", nextReviewDate: "2026-08-15" }]
```

---

## Version Bump Guide

| Change Type | Version Bump | Example |
|-------------|------------|---------|
| Evidence clarification, same sources | Patch | 4.2.0 → 4.2.1 |
| New ingredients, new sources, confidence shift | Minor | 4.2.0 → 4.3.0 |
| Fundamental protocol change | Major | 4.x.x → 5.0.0 |

---

## Maintenance Timeline

- **Daily**: Dev team monitors for new PubMed papers
- **Monthly**: Review due items, add emerging research
- **Quarterly**: Re-validate moderate/emerging entries
- **Annual**: Full pack audit, confidence score adjustment

---

## Example Confidence Display (for developers only)

Not shown to users, but useful for internal dashboards:

```
Acne Knowledge Pack v4.3.0
═══════════════════════════════════════
Confidence Score: 92/100 ████████████░░
Last Reviewed: 2026-07-01 (AB)
Next Audit: 2027-07-01

Ingredients:
  ✓ Niacinamide      [HIGH]     95% (AAD, PubMed)
  ✓ Salicylic Acid   [HIGH]     96% (AAD, NICE, PubMed)
  ✓ Ceramides        [HIGH]     94% (NICE, PubMed)
  → Barrier-first    [MODERATE] 85% (PubMed, Internal)

Items Due for Review: None
```

---

## Red Flags to Watch

🚩 **When to escalate**:
- Confidence score drops >10 points (evidence contradicted)
- Major guideline change from AAD/NICE (e.g., recommendation reversal)
- New safety concern in PubMed (e.g., unexpected adverse event)
- Ingredient becomes unavailable or reformulated
- User feedback contradicts evidence (investigate both)

⚠️ **Action**: Flag for clinical review, don't update unilaterally

---

## Notes for Developers

1. **This is for audit, not for users**
   - Evidence registry is 100% internal
   - Never expose confidence scores in API or UI
   - Never show sources/references to end users
   - GPT explanation layer remains independent

2. **Maintain objectivity**
   - Document contradictions honestly
   - Note uncertainty in `internalNotes`
   - Separate evidence from opinion
   - Use "we don't know yet" when appropriate

3. **Regional context matters**
   - Indian population-specific needs (heat, humidity, pollution)
   - Affordability and access considerations
   - Lifestyle and cultural factors
   - Reference Internal_Dermatology_Association for local insights

4. **Version backward compatibility**
   - Always maintain current pack versions in production
   - Older versions kept for reference
   - GPT receives current version context only

---

**Registry Location**: `docs/EVIDENCE_REGISTRY.ts`  
**Guide**: `docs/EVIDENCE_REVIEW_GUIDE.md`  
**Last Updated**: 2026-07-01
