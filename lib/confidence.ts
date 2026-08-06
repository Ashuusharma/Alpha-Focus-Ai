export interface ConfidenceExplanation {
  stars: number;
  label: string;
  explanation: string;
}

/**
 * Presents a real confidence number (never altered here) as a star rating
 * plus a plain-English reason, instead of a bare percentage. Shared by the
 * image-analyzer done step and any AI Lab card showing a category's most
 * recent scan confidence — one tiering rule, not one per call site.
 */
export function getConfidenceExplanation(confidence: number): ConfidenceExplanation {
  if (confidence >= 85) {
    return {
      stars: 5,
      label: "High confidence",
      explanation: "High confidence because the uploaded photos had good lighting and a clear view of the target area.",
    };
  }
  if (confidence >= 65) {
    return {
      stars: 4,
      label: "Good confidence",
      explanation: "Good confidence — the photos were clear enough for a reliable read.",
    };
  }
  if (confidence >= 45) {
    return {
      stars: 3,
      label: "Moderate confidence",
      explanation: "Moderate confidence — lighting or angle made a few details harder to read.",
    };
  }
  return {
    stars: 2,
    label: "Lower confidence",
    explanation: "Lower confidence — clearer, brighter photos next time will improve accuracy.",
  };
}
