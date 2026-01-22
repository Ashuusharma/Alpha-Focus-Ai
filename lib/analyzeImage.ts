// Mock AI Analysis Engine
// In production, this would connect to actual AI vision API (Google Vision, AWS Rekognition, etc.)

export type AnalyzerType = "skin" | "hair" | "beard";

export interface AnalysisResult {
  type: AnalyzerType;
  confidence: number; // 0-100
  detectedIssues: DetectedIssue[];
  severity: "low" | "moderate" | "high";
  recommendations: string[];
  tips: string[];
}

export interface DetectedIssue {
  name: string;
  confidence: number; // 0-100
  impact: "minor" | "moderate" | "significant";
  description: string;
}

// Mock AI Analysis - In production, replace with real API calls
export async function analyzeImage(
  imageData: string,
  analyzerType: AnalyzerType
): Promise<AnalysisResult> {
  // Simulate API delay
  await new Promise((res) => setTimeout(res, 2000));

  // Mock results based on analyzer type
  if (analyzerType === "skin") {
    return {
      type: "skin",
      confidence: 87,
      severity: "moderate",
      detectedIssues: [
        {
          name: "Acne-Prone Areas",
          confidence: 92,
          impact: "significant",
          description:
            "Active breakouts detected on T-zone (forehead, nose, chin). Suggests excess sebum production.",
        },
        {
          name: "Post-Acne Scarring",
          confidence: 78,
          impact: "moderate",
          description:
            "Minor scarring visible from previous breakouts. Texture irregularities present.",
        },
        {
          name: "Uneven Skin Tone",
          confidence: 65,
          impact: "moderate",
          description:
            "Dark spots and discoloration noted. Possible hyperpigmentation.",
        },
      ],
      recommendations: [
        "Use oil-free face wash 2x daily",
        "Apply salicylic acid treatment to affected areas",
        "Use lightweight, non-comedogenic moisturizer",
        "Apply SPF 50+ sunscreen daily",
        "Consider microdermabrasion for scarring (professional)",
      ],
      tips: [
        "Results visible in 4 weeks with consistent skincare",
        "Avoid touching face throughout the day",
        "Change pillowcase every 2-3 days",
        "Stay hydrated (3L+ water daily)",
        "Reduce sugar intake",
      ],
    };
  }

  if (analyzerType === "hair") {
    return {
      type: "hair",
      confidence: 84,
      severity: "high",
      detectedIssues: [
        {
          name: "Significant Hair Loss",
          confidence: 94,
          impact: "significant",
          description:
            "High density reduction detected. Approximately 30% hair density loss compared to typical. Early-stage androgenetic alopecia indicators.",
        },
        {
          name: "Weak Hair Follicles",
          confidence: 81,
          impact: "significant",
          description:
            "Individual hair strands appear thinner and more brittle. Follicle miniaturization signs.",
        },
        {
          name: "Scalp Inflammation",
          confidence: 72,
          impact: "moderate",
          description:
            "Slight redness and inflammation visible on scalp. Possible dandruff or seborrheic dermatitis.",
        },
      ],
      recommendations: [
        "Use minoxidil (Rogaine) 2% minoxidil solution daily",
        "Apply growth-stimulating tonic with biotin and caffeine",
        "Use anti-dandruff shampoo 3x weekly",
        "Take hair vitamins (biotin, zinc, iron)",
        "Consult dermatologist for stronger treatments if needed",
      ],
      tips: [
        "Results typically visible after 3-4 months of consistent use",
        "Hair growth cycle is 3-6 months, be patient",
        "Avoid tight hairstyles that pull hair",
        "Reduce stress (major hair loss trigger)",
        "Get 7-8 hours sleep for optimal hair health",
      ],
    };
  }

  // Beard analysis
  return {
    type: "beard",
    confidence: 89,
    severity: "moderate",
    detectedIssues: [
      {
        name: "Patchy Beard Growth",
        confidence: 91,
        impact: "significant",
        description:
          "Significant gaps in beard density. Thinner growth on cheeks and lower jaw. Uneven distribution pattern.",
      },
      {
        name: "Beard Texture Issues",
        confidence: 76,
        impact: "moderate",
        description:
          "Coarse and wiry texture detected. High dryness visible. Possible ingrown hairs in neck area.",
      },
      {
        name: "Slow Growth Rate",
        confidence: 68,
        impact: "moderate",
        description:
          "Estimated growth rate below average. May take 4-6 months to achieve full beard coverage.",
      },
    ],
    recommendations: [
      "Apply beard growth oil with argan and jojoba oil daily",
      "Use beard conditioner 3x weekly to soften texture",
      "Take supplements: biotin, zinc, vitamin D3",
      "Keep beard clean with gentle beard wash",
      "Trim regularly every 2-3 weeks to encourage growth",
    ],
    tips: [
      "Full beard transformation takes 3-6 months minimum",
      "Consistency is key - use products daily",
      "Beard growth depends on genetics and testosterone",
      "Exercise and good diet accelerate growth",
      "Avoid scratching or plucking stray hairs",
    ],
  };
}
