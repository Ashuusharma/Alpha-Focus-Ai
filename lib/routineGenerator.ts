// AI Routine Generator
// Creates personalized daily routines based on detected issues

import { EnrichedIssue } from "@/lib/aiAnalysisEngine";
import { Recommendation } from "@/lib/recommendationRules";

export interface RoutineStep {
  order: number;
  time: string; // "7:00 AM", "12:00 PM", "8:00 PM"
  action: string; // What to do
  product?: string; // Which product to use
  duration: number; // Minutes
  notes?: string; // Why/tips
  frequency: "daily" | "weekly" | "as-needed";
}

export interface DailyRoutine {
  name: string;
  duration: number; // Total minutes per day
  timezone: string;
  morning: RoutineStep[];
  afternoon: RoutineStep[];
  evening: RoutineStep[];
  notes: string;
  focusAreas: string[];
  expectedResults: {
    timeframe: number; // days
    improvements: string[];
  };
}

export interface RoutineProgram {
  week: number;
  name: string;
  routine: DailyRoutine;
  adjustments: string[]; // What changes from previous week
}

/**
 * Generate personalized routine based on issues
 */
export function generateRoutine(
  issues: EnrichedIssue[],
  recommendations: Recommendation[],
  userAnswers: Record<string, string>
): DailyRoutine {
  // Determine routine focus areas
  const focusAreas = extractFocusAreas(issues);

  // Generate steps
  const morning = generateMorningRoutine(issues, recommendations);
  const afternoon = generateAfternoonRoutine(issues, recommendations);
  const evening = generateEveningRoutine(issues, recommendations);

  // Calculate total duration
  const duration = calculateDuration([...morning, ...afternoon, ...evening]);

  // Determine expected results
  const expectedResults = determineExpectedResults(issues);

  return {
    name: generateRoutineName(focusAreas),
    duration,
    timezone: "UTC",
    morning,
    afternoon,
    evening,
    notes: generateRoutineNotes(issues, focusAreas),
    focusAreas,
    expectedResults,
  };
}

/**
 * Generate 4-week progressive program
 */
export function generateRoutineProgram(
  issues: EnrichedIssue[],
  recommendations: Recommendation[],
  userAnswers: Record<string, string>
): RoutineProgram[] {
  const baseRoutine = generateRoutine(issues, recommendations, userAnswers);

  return [
    {
      week: 1,
      name: "Foundation Week - Gentle Introduction",
      routine: {
        ...baseRoutine,
        morning: baseRoutine.morning.slice(0, 2),
        afternoon: baseRoutine.afternoon.slice(0, 1),
        evening: baseRoutine.evening.slice(0, 2),
        notes:
          "Start gently. Focus on consistency over complexity. Your skin is adapting.",
      },
      adjustments: [
        "Simplified routine (fewer products)",
        "Shorter duration (10-15 mins total)",
        "Core products only",
        "Daily consistency builds habit",
      ],
    },
    {
      week: 2,
      name: "Expansion Week - Build Routine",
      routine: {
        ...baseRoutine,
        morning: baseRoutine.morning.slice(0, 3),
        afternoon: baseRoutine.afternoon,
        evening: baseRoutine.evening.slice(0, 3),
        notes:
          "Add more steps. You're seeing first improvements. Results accelerate.",
      },
      adjustments: [
        "Add treatment products",
        "Include targeted solutions",
        "Increase duration (20-25 mins)",
        "Watch for early improvements",
      ],
    },
    {
      week: 3,
      name: "Optimization Week - Full Routine",
      routine: baseRoutine,
      adjustments: [
        "Complete routine activated",
        "All products integrated",
        "Enhanced benefits starting",
        "Visible results expected",
      ],
    },
    {
      week: 4,
      name: "Maintenance Week - Lock Results",
      routine: {
        ...baseRoutine,
        notes:
          "You should see significant improvements. Lock them in with consistency!",
      },
      adjustments: [
        "Full routine maintained",
        "Results consolidating",
        "Compare with week 1 photos",
        "Ready for maintenance plan",
      ],
    },
  ];
}

/**
 * Generate morning routine
 */
function generateMorningRoutine(
  issues: EnrichedIssue[],
  recommendations: Recommendation[]
): RoutineStep[] {
  const steps: RoutineStep[] = [];

  // Step 1: Cleanse
  steps.push({
    order: 1,
    time: "7:00 AM",
    action: "Gentle face wash",
    product: getProductForIssue(
      issues,
      recommendations,
      "cleanser"
    ),
    duration: 2,
    notes: "Remove overnight oils and impurities. Use lukewarm water.",
    frequency: "daily",
  });

  // Step 2: Tone (if oily/acne)
  const isOily = issues.some((i) => i.name.toLowerCase().includes("oily"));
  if (isOily) {
    steps.push({
      order: 2,
      time: "7:05 AM",
      action: "Apply toner",
      product: getProductForIssue(issues, recommendations, "toner"),
      duration: 1,
      notes: "Balance pH. Control excess oil.",
      frequency: "daily",
    });
  }

  // Step 3: Treatment (target specific issue)
  const targetIssue = issues[0]; // Primary issue
  steps.push({
    order: 3,
    time: "7:07 AM",
    action: `Apply ${targetIssue.name.toLowerCase()} treatment`,
    product: getProductForIssue(
      issues,
      recommendations,
      targetIssue.name.toLowerCase()
    ),
    duration: 2,
    notes: `Focus on ${targetIssue.name}. Let it absorb for 1-2 minutes.`,
    frequency: "daily",
  });

  // Step 4: Moisturize
  steps.push({
    order: 4,
    time: "7:10 AM",
    action: "Apply moisturizer",
    product: getProductForIssue(issues, recommendations, "moisturizer"),
    duration: 2,
    notes: "Lock in hydration. Essential even for oily skin.",
    frequency: "daily",
  });

  // Step 5: SPF
  steps.push({
    order: 5,
    time: "7:13 AM",
    action: "Apply sunscreen SPF 30+",
    product: "Sunscreen SPF 30+",
    duration: 2,
    notes: "Essential for photo protection and preventing dark spots.",
    frequency: "daily",
  });

  return steps;
}

/**
 * Generate afternoon routine
 */
function generateAfternoonRoutine(
  issues: EnrichedIssue[],
  recommendations: Recommendation[]
): RoutineStep[] {
  const steps: RoutineStep[] = [];

  // Midday refresh for oily skin
  const isOily = issues.some((i) => i.name.toLowerCase().includes("oily"));
  if (isOily) {
    steps.push({
      order: 1,
      time: "1:00 PM",
      action: "Oil control blotting",
      product: "Oil blotting sheets",
      duration: 1,
      notes: "Blot excess oil without disrupting makeup.",
      frequency: "as-needed",
    });
  }

  // Hydration boost
  steps.push({
    order: 2,
    time: "3:00 PM",
    action: "Face mist or hydrating spray",
    product: "Hydrating face mist",
    duration: 1,
    notes: "Refresh skin mid-day. Boost hydration.",
    frequency: "as-needed",
  });

  return steps;
}

/**
 * Generate evening routine
 */
function generateEveningRoutine(
  issues: EnrichedIssue[],
  recommendations: Recommendation[]
): RoutineStep[] {
  const steps: RoutineStep[] = [];

  // Step 1: Cleanse (remove makeup/SPF)
  steps.push({
    order: 1,
    time: "8:00 PM",
    action: "Makeup removal / Cleanse",
    product: "Makeup remover or oil cleanser",
    duration: 3,
    notes: "Remove all makeup and sunscreen. Double cleanse if needed.",
    frequency: "daily",
  });

  // Step 2: Second cleanse
  steps.push({
    order: 2,
    time: "8:05 PM",
    action: "Water-based cleanse",
    product: getProductForIssue(issues, recommendations, "cleanser"),
    duration: 2,
    notes: "Remove cleanser residue. Prepare skin for treatments.",
    frequency: "daily",
  });

  // Step 3: Exfoliate (2-3x weekly)
  const hasAcne = issues.some(
    (i) => i.name.toLowerCase().includes("acne") || i.name.toLowerCase().includes("clogged")
  );
  if (hasAcne) {
    steps.push({
      order: 3,
      time: "8:10 PM",
      action: "Exfoliate (gentle)",
      product: getProductForIssue(
        issues,
        recommendations,
        "exfoliate"
      ),
      duration: 3,
      notes: "2-3x per week only. Promotes cell turnover. Do not over-exfoliate.",
      frequency: "weekly",
    });
  }

  // Step 4: Treatment serum
  steps.push({
    order: 4,
    time: "8:15 PM",
    action: "Apply concentrated treatment serum",
    product: getProductForIssue(
      issues,
      recommendations,
      "serum"
    ),
    duration: 2,
    notes: "Night is when skin repairs. Use strongest treatment then.",
    frequency: "daily",
  });

  // Step 5: Night moisturizer
  steps.push({
    order: 5,
    time: "8:20 PM",
    action: "Apply night cream",
    product: getProductForIssue(
      issues,
      recommendations,
      "night cream"
    ),
    duration: 2,
    notes: "Richer than day moisturizer. Repair overnight.",
    frequency: "daily",
  });

  // Step 6: Targeted treatment
  steps.push({
    order: 6,
    time: "8:23 PM",
    action: "Apply overnight mask or treatment",
    product: getProductForIssue(
      issues,
      recommendations,
      "mask"
    ),
    duration: 1,
    notes: "Optional. Use 1-2x per week for intensive repair.",
    frequency: "as-needed",
  });

  return steps;
}

/**
 * Get product name for specific issue
 */
function getProductForIssue(
  issues: EnrichedIssue[],
  recommendations: Recommendation[],
  category: string
): string {
  // Find most relevant product for this category
  const relevant = recommendations
    .filter((r) => r.title.toLowerCase().includes(category.toLowerCase()))
    .sort((a, b) => b.products.length - a.products.length);

  if (relevant.length > 0 && relevant[0].products.length > 0) {
    return relevant[0].products[0].name;
  }

  // Fallback names
  const fallbacks: Record<string, string> = {
    cleanser: "Gentle Facial Cleanser",
    toner: "Balancing Toner",
    treatment: "Targeted Treatment Serum",
    moisturizer: "Lightweight Moisturizer",
    serum: "Concentrated Serum",
    "night cream": "Nourishing Night Cream",
    mask: "Deep Repair Mask",
    exfoliate: "Gentle Exfoliating Scrub",
  };

  return fallbacks[category] || "Product";
}

/**
 * Extract focus areas from issues
 */
function extractFocusAreas(issues: EnrichedIssue[]): string[] {
  return issues.slice(0, 3).map((i) => i.name);
}

/**
 * Generate routine name
 */
function generateRoutineName(focusAreas: string[]): string {
  if (focusAreas.length === 0) return "Daily Skincare Routine";
  return `${focusAreas[0]} Care Routine`;
}

/**
 * Generate routine notes/description
 */
function generateRoutineNotes(
  issues: EnrichedIssue[],
  focusAreas: string[]
): string {
  const urgency =
    issues.length >= 3
      ? "This is a comprehensive routine to address multiple concerns."
      : issues.length === 2
        ? "This routine targets your two main concerns."
        : "This routine is focused on your primary concern.";

  return `${urgency} Follow consistently for best results. Results visible in 2-4 weeks. Adjust products if any irritation occurs.`;
}

/**
 * Calculate total routine duration
 */
function calculateDuration(steps: RoutineStep[]): number {
  return steps.reduce((total, step) => total + step.duration, 0);
}

/**
 * Determine expected results timeline
 */
function determineExpectedResults(
  issues: EnrichedIssue[]
): {
  timeframe: number;
  improvements: string[];
} {
  const avgSeverity =
    issues.reduce((sum, i) => sum + (i.impact === "significant" ? 3 : i.impact === "moderate" ? 2 : 1), 0) /
    issues.length;

  const timeframe =
    avgSeverity >= 2.5 ? 28 : avgSeverity >= 2 ? 21 : 14;

  const improvements: string[] = [];

  issues.forEach((issue) => {
    if (issue.name.toLowerCase().includes("acne")) {
      improvements.push("Reduced acne breakouts and inflammation");
    }
    if (issue.name.toLowerCase().includes("dry")) {
      improvements.push("Improved hydration and skin texture");
    }
    if (issue.name.toLowerCase().includes("oily")) {
      improvements.push("Balanced oil production");
    }
    if (issue.name.toLowerCase().includes("dark spot")) {
      improvements.push("Fading dark spots and marks");
    }
    if (issue.name.toLowerCase().includes("sensit")) {
      improvements.push("Reduced redness and sensitivity");
    }
  });

  if (improvements.length === 0) {
    improvements.push("Noticeably improved skin health");
    improvements.push("Clearer complexion");
  }

  improvements.push(`Visible results by day ${timeframe}`);

  return {
    timeframe,
    improvements,
  };
}

/**
 * Get routine tips based on issues
 */
export function getRoutineTips(issues: EnrichedIssue[]): string[] {
  const tips: string[] = [];

  // General tips
  tips.push("Consistency is key - follow the routine every day");
  tips.push("Take before/after photos to track progress");
  tips.push("Drink at least 3L water daily");
  tips.push("Sleep 7-8 hours for optimal skin repair");

  // Issue-specific tips
  const hasAcne = issues.some((i) =>
    i.name.toLowerCase().includes("acne")
  );
  if (hasAcne) {
    tips.push("Avoid touching your face throughout the day");
    tips.push("Change pillowcase every 2-3 days");
    tips.push("Don't pick or squeeze - let products work");
  }

  const hasDryness = issues.some((i) =>
    i.name.toLowerCase().includes("dry")
  );
  if (hasDryness) {
    tips.push("Use a humidifier at night");
    tips.push("Avoid hot showers - use lukewarm water");
    tips.push("Layer moisturizers while skin is damp");
  }

  const hasSensitivity = issues.some((i) =>
    i.name.toLowerCase().includes("sensit")
  );
  if (hasSensitivity) {
    tips.push("Patch test new products on small area first");
    tips.push("Avoid fragrance and alcohol-based products");
    tips.push("Introduce new products one at a time");
  }

  return tips.slice(0, 8); // Return top 8 tips
}
