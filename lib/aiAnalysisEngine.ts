// AI Analysis Engine
// Combines photo analysis with questionnaire answers for intelligent recommendations

import { AnalysisResult, DetectedIssue } from "@/lib/analyzeImage";
import {
  recommendationRules,
  Recommendation,
} from "@/lib/recommendationRules";

export interface CombinedAnalysis {
  photoAnalysis: AnalysisResult | null;
  questionnaireAnswers: Record<string, string>;
  analyzedCategories: string[];
  confidence: number; // 0-100, weighted average
  detectedIssues: EnrichedIssue[];
  recommendations: ScoredRecommendation[];
  insights: AnalysisInsight[];
  urgencyLevel: "low" | "moderate" | "high";
}

export interface EnrichedIssue {
  name: string;
  source: "photo" | "questionnaire" | "both"; // Where it was detected
  photoConfidence?: number;
  questionnaireMatch?: number; // How well it matches answers
  combinedConfidence: number;
  description: string;
  impact: "minor" | "moderate" | "significant";
  suggestedActions: string[];
}

export interface ScoredRecommendation extends Recommendation {
  score: number; // 0-100, based on combined analysis
  matchSources: ("photo" | "questionnaire")[]; // Which data sources validated it
  confidence: number; // How confident the engine is
  urgency: "low" | "medium" | "high";
}

export interface AnalysisInsight {
  type: "strength" | "warning" | "opportunity" | "validation";
  title: string;
  description: string;
  actionable: boolean;
}

/**
 * Main AI Analysis Engine
 * Intelligently combines photo analysis with questionnaire data
 */
export function analyzeWithAI(
  photoAnalysis: AnalysisResult | null,
  questionnaireAnswers: Record<string, string>
): CombinedAnalysis {
  // Get analyzed categories from questionnaire
  const analyzedCategories = extractAnalyzedCategories(questionnaireAnswers);

  // Extract issues from both sources
  const photoIssues = photoAnalysis?.detectedIssues || [];
  const questionnaireIssues = extractIssuesFromAnswers(questionnaireAnswers);

  // Enrich issues by combining both sources
  const enrichedIssues = enrichIssues(
    photoIssues,
    questionnaireIssues,
    photoAnalysis?.type || null
  );

  // Generate recommendations based on combined data
  const recommendations = generateCombinedRecommendations(
    enrichedIssues,
    questionnaireAnswers,
    analyzedCategories,
    photoAnalysis
  );

  // Generate insights
  const insights = generateInsights(
    photoAnalysis,
    questionnaireAnswers,
    enrichedIssues,
    recommendations
  );

  // Calculate overall confidence
  const confidence = calculateCombinedConfidence(
    photoAnalysis,
    questionnaireAnswers
  );

  // Determine urgency level
  const urgencyLevel = determineUrgency(enrichedIssues);

  return {
    photoAnalysis,
    questionnaireAnswers,
    analyzedCategories,
    confidence,
    detectedIssues: enrichedIssues,
    recommendations: recommendations.sort((a, b) => b.score - a.score),
    insights,
    urgencyLevel,
  };
}

/**
 * Extract which categories the user answered questions for
 */
function extractAnalyzedCategories(answers: Record<string, string>): string[] {
  const categories = new Set<string>();

  Object.keys(answers).forEach((key) => {
    if (key.startsWith("hair_")) categories.add("Hair Care");
    if (key.startsWith("skin_")) categories.add("Skin Care");
    if (key.startsWith("beard_")) categories.add("Beard Care");
    if (key.startsWith("body_")) categories.add("Body Care");
    if (key.startsWith("health_")) categories.add("Health Care");
    if (key.startsWith("fitness_")) categories.add("Fitness");
    if (key.startsWith("fragrance_")) categories.add("Fragrance");
  });

  return Array.from(categories);
}

/**
 * Extract potential issues from questionnaire answers
 */
function extractIssuesFromAnswers(
  answers: Record<string, string>
): { category: string; issues: string[] }[] {
  const issueMap: Record<string, string[]> = {
    "hair_concern": [
      "Hair fall",
      "Dandruff",
      "Dry hair",
      "Hair thinning",
      "Loss of volume",
    ],
    "skin_concern": ["Acne", "Dark spots", "Dullness", "Sensitivity"],
    "skin_type": ["Oily", "Dry", "Combination"],
    "body_issue": ["Body acne", "Odor", "Dryness"],
    "beard_issue": ["Itching", "Dryness", "Ingrown hair"],
  };

  const extracted: { category: string; issues: string[] }[] = [];

  Object.entries(answers).forEach(([key, value]) => {
    if (issueMap[key]) {
      const matchedIssues = issueMap[key].filter((issue) =>
        value.toLowerCase().includes(issue.toLowerCase())
      );
      if (matchedIssues.length > 0) {
        extracted.push({
          category: key.split("_")[0],
          issues: matchedIssues,
        });
      }
    }
  });

  return extracted;
}

/**
 * Enrich issues by combining photo and questionnaire detection
 */
function enrichIssues(
  photoIssues: DetectedIssue[],
  questionnaireIssues: { category: string; issues: string[] }[],
  photoType: string | null
): EnrichedIssue[] {
  const enriched: EnrichedIssue[] = [];
  const processed = new Set<string>();

  // Process photo-detected issues
  photoIssues.forEach((photoIssue) => {
    // Check if questionnaire confirms this issue
    const matchingQuestion = questionnaireIssues.find((q) =>
      photoIssue.name.toLowerCase().includes(q.issues[0]?.toLowerCase() || "")
    );

    const combinedConfidence = matchingQuestion
      ? Math.round((photoIssue.confidence + 85) / 2) // Both sources confirm
      : photoIssue.confidence;

    enriched.push({
      name: photoIssue.name,
      source: matchingQuestion ? "both" : "photo",
      photoConfidence: photoIssue.confidence,
      questionnaireMatch: matchingQuestion ? 85 : undefined,
      combinedConfidence,
      description: photoIssue.description,
      impact: photoIssue.impact,
      suggestedActions: generateActions(photoIssue.name),
    });

    processed.add(photoIssue.name);
  });

  // Process questionnaire-only issues
  questionnaireIssues.forEach((q) => {
    q.issues.forEach((issue) => {
      if (!processed.has(issue)) {
        enriched.push({
          name: issue,
          source: "questionnaire",
          questionnaireMatch: 85,
          combinedConfidence: 75, // Lower confidence for questionnaire-only
          description: `User reported: "${issue}". Suggested by questionnaire analysis.`,
          impact: "moderate",
          suggestedActions: generateActions(issue),
        });

        processed.add(issue);
      }
    });
  });

  return enriched;
}

/**
 * Generate actionable steps for issues
 */
function generateActions(issueName: string): string[] {
  const actionMap: Record<string, string[]> = {
    "Acne-Prone Areas": [
      "Use salicylic acid cleanser",
      "Apply spot treatment",
      "Maintain strict hygiene",
    ],
    "Hair fall": [
      "Use growth-stimulating tonic",
      "Take biotin supplements",
      "Reduce stress",
    ],
    "Dry hair": [
      "Use hydrating shampoo",
      "Apply hair mask",
      "Reduce heat styling",
    ],
    "Oily skin": [
      "Use oil-control cleanser",
      "Apply mattifying moisturizer",
      "Exfoliate 2-3x weekly",
    ],
    "Dark spots": ["Use brightening serum", "Apply SPF daily", "Use retinol"],
    "Beard patchy": [
      "Apply beard growth oil",
      "Take supplements",
      "Avoid trimming",
    ],
  };

  const key = Object.keys(actionMap).find((k) =>
    issueName.toLowerCase().includes(k.toLowerCase())
  );

  return actionMap[key!] || [
    "Start with gentle care routine",
    "Use recommended products",
    "Monitor progress",
  ];
}

/**
 * Generate combined recommendations based on all data
 */
function generateCombinedRecommendations(
  enrichedIssues: EnrichedIssue[],
  questionnaireAnswers: Record<string, string>,
  analyzedCategories: string[],
  photoAnalysis: AnalysisResult | null
): ScoredRecommendation[] {
  const scored: ScoredRecommendation[] = [];

  // Get all relevant recommendations
  recommendationRules.forEach((rec) => {
    // Check if this recommendation matches analyzed categories
    const categoryMatch = analyzedCategories.some((cat) =>
      rec.category.toLowerCase().includes(cat.toLowerCase())
    );

    if (!categoryMatch && !photoAnalysis) {
      return; // Skip if not in analyzed categories
    }

    // Score based on issue matches
    let issueScore = 0;
    const matchingSources: ("photo" | "questionnaire")[] = [];

    enrichedIssues.forEach((issue) => {
      // Check if recommendation addresses this issue
      if (
        rec.title.toLowerCase().includes(issue.name.toLowerCase()) ||
        rec.cause.toLowerCase().includes(issue.name.toLowerCase())
      ) {
        issueScore += issue.combinedConfidence;

        if (issue.source === "photo" || issue.source === "both") {
          matchingSources.push("photo");
        }
        if (issue.source === "questionnaire" || issue.source === "both") {
          matchingSources.push("questionnaire");
        }
      }
    });

    // Score based on questionnaire answers
    let answerScore = 0;
    Object.values(questionnaireAnswers).forEach((answer) => {
      if (
        rec.title.toLowerCase().includes(answer.toLowerCase()) ||
        rec.solution.toLowerCase().includes(answer.toLowerCase())
      ) {
        answerScore += 10;
        if (!matchingSources.includes("questionnaire")) {
          matchingSources.push("questionnaire");
        }
      }
    });

    const totalScore = Math.min(100, issueScore + answerScore);

    // Only include if it has meaningful relevance
    if (totalScore > 20) {
      scored.push({
        ...rec,
        score: totalScore,
        matchSources: Array.from(new Set(matchingSources)),
        confidence: Math.round(
          (totalScore + (photoAnalysis ? 85 : 70)) / (photoAnalysis ? 2 : 1)
        ),
        urgency: totalScore > 70 ? "high" : totalScore > 40 ? "medium" : "low",
      });
    }
  });

  return scored;
}

/**
 * Generate insights from the analysis
 */
function generateInsights(
  photoAnalysis: AnalysisResult | null,
  questionnaireAnswers: Record<string, string>,
  enrichedIssues: EnrichedIssue[],
  recommendations: ScoredRecommendation[]
): AnalysisInsight[] {
  const insights: AnalysisInsight[] = [];

  // Insight 1: Photo + Questionnaire validation
  if (photoAnalysis) {
    const confirmationCount = enrichedIssues.filter(
      (i) => i.source === "both"
    ).length;
    if (confirmationCount > 0) {
      insights.push({
        type: "validation",
        title: `${confirmationCount} issue(s) confirmed by both photo and answers`,
        description: `Your photo analysis and questionnaire answers align perfectly, giving us high confidence in our recommendations.`,
        actionable: false,
      });
    }
  }

  // Insight 2: High urgency warning
  const highUrgencyIssues = enrichedIssues.filter(
    (i) => i.impact === "significant"
  );
  if (highUrgencyIssues.length > 0) {
    insights.push({
      type: "warning",
      title: `${highUrgencyIssues.length} significant issue(s) detected`,
      description: `We've identified issues that require prompt attention. Follow the recommended routine consistently for best results.`,
      actionable: true,
    });
  }

  // Insight 3: Multiple categories
  const uniqueCategories = new Set(
    enrichedIssues
      .flatMap((i) => i.name)
      .filter((n) => n.length > 0)
  ).size;
  if (uniqueCategories >= 3) {
    insights.push({
      type: "strength",
      title: "Comprehensive assessment across multiple areas",
      description:
        "Your analysis covers multiple grooming and wellness categories. We've created a holistic routine addressing all areas.",
      actionable: false,
    });
  }

  // Insight 4: Opportunity for improvement
  const photoOnlyIssues = enrichedIssues.filter((i) => i.source === "photo");
  if (photoOnlyIssues.length > 0 && photoAnalysis) {
    insights.push({
      type: "opportunity",
      title: "Photo analysis revealed hidden issues",
      description: `Your image analysis detected ${photoOnlyIssues.length} issue(s) that complement your questionnaire answers, giving us a more complete picture.`,
      actionable: true,
    });
  }

  // Insight 5: Strength identification
  const lowImpactIssues = enrichedIssues.filter((i) => i.impact === "minor");
  if (lowImpactIssues.length > 0 && enrichedIssues.length > lowImpactIssues.length) {
    insights.push({
      type: "strength",
      title: "Mostly manageable concerns",
      description:
        "Most detected issues are minor and highly treatable with consistent care. You should see improvements in 2-4 weeks.",
      actionable: false,
    });
  }

  return insights;
}

/**
 * Calculate overall confidence score (0-100)
 */
function calculateCombinedConfidence(
  photoAnalysis: AnalysisResult | null,
  questionnaireAnswers: Record<string, string>
): number {
  let confidence = 50; // Base confidence

  // Add for photo analysis (increases confidence significantly)
  if (photoAnalysis) {
    confidence += 25;
    confidence += photoAnalysis.confidence / 4;
  }

  // Add for questionnaire completeness
  const questionCount = Object.keys(questionnaireAnswers).length;
  if (questionCount >= 5) confidence += 15;
  else if (questionCount >= 3) confidence += 10;
  else confidence += 5;

  return Math.min(100, Math.round(confidence));
}

/**
 * Determine urgency level
 */
function determineUrgency(
  enrichedIssues: EnrichedIssue[]
): "low" | "moderate" | "high" {
  const significantCount = enrichedIssues.filter(
    (i) => i.impact === "significant"
  ).length;
  const moderateCount = enrichedIssues.filter(
    (i) => i.impact === "moderate"
  ).length;

  if (significantCount >= 2) return "high";
  if (significantCount === 1 && moderateCount >= 2) return "high";
  if (significantCount === 1 || moderateCount >= 2) return "moderate";
  return "low";
}
