"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Trophy,
    Calendar,
    ShoppingCart,
    FileText,
    ChevronRight,
    CheckCircle2,
} from "lucide-react";

import { AnalysisResult } from "@/lib/analyzeImage";
import { useCartStore } from "@/lib/cartStore";
import { useRewardsStore } from "@/lib/rewardsStore";
import { resolveProductMeta as resolveCatalogProductMeta } from "@/lib/productCatalog";
import { getActiveUserName, getScopedSessionItem } from "@/lib/userScopedStorage";

// ===================== TYPE DEFINITIONS =====================
interface IssueDetails {
  id: string;
  title: string;
  description: string;
  causes: string[];
    homeRemedies?: { title: string; method: string; caution: string }[];
  ingredients: { name: string; benefit: string }[];
    products: { name: string; type: string; price: string; imageUrl?: string; buyUrl?: string }[];
  routine: string[];
  imageUrl: string;
}

interface GalaxyHotspotView {
    x: number;
    y: number;
    label: string;
    severity?: string;
}

interface GalaxyAnalysisView {
    provider?: string;
    originalImages: string[];
    annotatedImageUrl?: string;
    hotspots: GalaxyHotspotView[];
    selectedCategories?: string[];
    issues?: Array<{ name?: string; confidence?: number; impact?: "minor" | "moderate" | "significant" }>;
}

type IssueKey = "acne" | "wrinkles" | "dark_circles" | "aging" | "hair_loss" | "dandruff" | "beard_patchy";

interface IssueSignal {
    score: number;
    severityScore: number;
    signals: number;
    evidence: string[];
}

const ISSUE_DATABASE: Record<string, IssueDetails> = {
  acne: {
    id: "acne",
    title: "Active Acne & Congestion",
    description: "Inflammation of hair follicles causing pimples, blackheads, and potential scarring.",
    imageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=2070&auto=format&fit=crop",
    causes: [
        "Excess oil (sebum) production clogging pores",
        "Bacteria (C. acnes) accumulation",
        "Hormonal fluctuations (androgens)",
        "Dietary triggers or high glycemic intake"
    ],
    homeRemedies: [
        { title: "Green tea compress", method: "Apply a cool green-tea compress for 5-7 minutes on inflamed areas once daily.", caution: "Avoid if tea extracts irritate your skin." },
        { title: "Aloe vera gel", method: "Use a thin layer of pure aloe vera after cleansing at night.", caution: "Patch test first; stop if stinging persists." }
    ],
    ingredients: [
        { name: "Salicylic Acid", benefit: "Unclogs pores & reduces oil" },
        { name: "Benzoyl Peroxide", benefit: "Kills acne-causing bacteria" },
        { name: "Niacinamide", benefit: "Reduces inflammation & regulates oil" }
    ],
    products: [
        { name: "CeraVe Foaming Cleanser", type: "Cleanser", price: "$14" },
        { name: "Paul's Choice BHA Liquid", type: "Exfoliant", price: "$32" },
        { name: "La Roche-Posay Effaclar Duo", type: "Treatment", price: "$22" }
    ],
    routine: [
        "Morning: Gentle Foaming Cleanser",
        "Morning: Niacinamide Serum + SPF 30+",
        "Evening: Double Cleanse (Oil + Foam)",
        "Evening: BHA Exfoliant (3x/week)",
        "Evening: Light Gel Moisturizer"
    ]
  },
  wrinkles: {
    id: "wrinkles",
    title: "Fine Lines & Signs of Aging",
    description: "Natural loss of collagen and elastin leading to creases, particularly around eyes and forehead.",
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1887&auto=format&fit=crop",
    causes: [
        "UV sun damage (Photoaging)",
        "Reduced collagen production over time",
        "Dehydration reducing skin plumpness",
        "Repetitive facial expressions"
    ],
    ingredients: [
        { name: "Retinol (Vitamin A)", benefit: "Stimulates collagen production" },
        { name: "Peptides", benefit: "Restores skin firmness" },
        { name: "Hyaluronic Acid", benefit: "Deep hydration to plump lines" }
    ],
    products: [
        { name: "The Ordinary Retinol 0.5%", type: "Serum", price: "$10" },
        { name: "Neutrogena Hydro Boost", type: "Moisturizer", price: "$18" },
        { name: "EltaMD UV Clear SPF 46", type: "Sunscreen", price: "$37" }
    ],
    routine: [
        "Morning: Vitamin C Serum (Brightening)",
        "Morning: Peptide Moisturizer",
        "Morning: Broad Spectrum SPF 50 (Crucial)",
        "Evening: Hydrating Cleanser",
        "Evening: Retinol Serum (Start 2x/week)",
        "Evening: Thick Night Cream"
    ]
  },
  dark_circles: {
      id: "dark_circles",
      title: "Dark Under-Eye Circles",
      description: "Pigmentation or thinning skin under the eyes creating a shadowed appearance.",
    imageUrl: "https://images.unsplash.com/photo-1615396899719-14a9387e3d23?q=80&w=2076&auto=format&fit=crop",
      causes: [
          "Lack of sleep or fatigue",
          "Thinner skin showing blood vessels",
          "Hyperpigmentation (Melanin)",
          "Genetic bone structure shadows"
      ],
      homeRemedies: [
          { title: "Cold compress", method: "Use a chilled compress under eyes for 2-3 minutes in the morning.", caution: "Do not apply ice directly to skin." },
          { title: "Sleep posture reset", method: "Elevate your head slightly while sleeping to reduce morning puffiness.", caution: "If swelling is persistent or painful, seek medical care." }
      ],
      ingredients: [
          { name: "Caffeine", benefit: "Constricts vessels to reduce puffiness" },
          { name: "Vitamin C", benefit: "Brightens pigmentation" },
          { name: "Vitamin K", benefit: "Improves circulation & clotting" }
      ],
      products: [
          { name: "The Inkey List Caffeine Eye Cream", type: "Eye Cream", price: "$10" },
          { name: "Ole Henriksen Banana Bright", type: "Eye Cream", price: "$42" },
           { name: "Cold Compress Mask", type: "Tool", price: "$15" }
      ],
      routine: [
          "Morning: Cold water splash",
          "Morning: Caffeine Eye Serum",
          "Evening: Gentle Makeup/SPF Remover",
          "Evening: Rich Eye Cream (No rubbing)",
          "Lifestyle: 7-8 Hours Sleep & Extra Water"
      ]
  },
  // Mapping 'aging' type to 'wrinkles'
  aging: {
      id: "aging",
      title: "Aging & Fine Lines",
      description: "Visible signs of aging including fine lines, loss of elasticity, and uneven texture.",
      imageUrl: "https://images.unsplash.com/photo-1552693673-1bf958298935?q=80&w=2073&auto=format&fit=crop",
      causes: [
        "UV Damage (Photoaging)",
        "Collagen degradation",
        "Oxidative stress",
        "Moisture barrier loss"
      ],
      ingredients: [
          { name: "Retinol", benefit: "Accelerates cell turnover" },
          { name: "Vitamin C", benefit: "Protects against free radicals" },
          { name: "Peptides", benefit: "Signals collagen production" }
      ],
      products: [
          { name: "Retinol Correxion Serum", type: "Serum", price: "$25" },
          { name: "Triple Peptide Cream", type: "Moisturizer", price: "$48" },
          { name: "Daily Defense SPF 50", type: "Sunscreen", price: "$32" }
      ],
      routine: [
        "Morning: Vitamin C",
        "Morning: SPF 50",
        "Evening: Retinol (alternate nights)",
        "Evening: Peptide Cream"
      ]
    },
    hair_loss: {
            id: "hair_loss",
            title: "Hair Fall & Thinning",
            description: "Early signs of reduced hair density and shedding that can be improved with targeted scalp care.",
            imageUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1780&auto=format&fit=crop",
            causes: [
                "Scalp inflammation or buildup",
                "Nutrient and protein deficiency",
                "Stress and poor recovery",
                "Genetic sensitivity (DHT)"
            ],
            homeRemedies: [
                { title: "Warm scalp massage", method: "Massage scalp gently for 3-4 minutes with light pressure before wash days.", caution: "Avoid aggressive rubbing that can increase shedding." },
                { title: "Protein consistency", method: "Aim for balanced daily protein intake and hydration.", caution: "Severe or sudden hair loss should be evaluated clinically." }
            ],
            ingredients: [
                { name: "Caffeine", benefit: "Supports scalp circulation" },
                { name: "Ketoconazole", benefit: "Reduces scalp inflammation" },
                { name: "Biotin", benefit: "Supports keratin health" }
            ],
            products: [
                { name: "Caffeine Scalp Tonic", type: "Tonic", price: "$22" },
                { name: "Ketoconazole Shampoo", type: "Shampoo", price: "$18" },
                { name: "Hair Nutrition Complex", type: "Supplement", price: "$28" }
            ],
            routine: [
                "Morning: Gentle scalp massage (2 minutes)",
                "Morning: Apply scalp tonic",
                "Evening: Protein-rich dinner + hydration",
                "Alternate days: Anti-dandruff shampoo",
                "Weekly: Progress photo under same lighting"
            ]
    },
    dandruff: {
            id: "dandruff",
            title: "Dandruff & Scalp Irritation",
            description: "Flaking and scalp itchiness indicating barrier disruption and possible fungal overgrowth.",
            imageUrl: "https://images.unsplash.com/photo-1582098059882-799d3d3325c2?q=80&w=2070&auto=format&fit=crop",
            causes: [
                "Malassezia yeast overgrowth",
                "Product buildup",
                "Infrequent scalp cleansing",
                "Hard water and pollution exposure"
            ],
            homeRemedies: [
                { title: "Diluted tea tree rinse", method: "Use a diluted tea-tree scalp rinse 1-2 times weekly.", caution: "Never use concentrated essential oils directly on scalp." },
                { title: "Pillow hygiene", method: "Change pillow covers every 2-3 nights to reduce residue exposure.", caution: "If scalp is cracked or bleeding, consult a doctor." }
            ],
            ingredients: [
                { name: "Zinc Pyrithione", benefit: "Controls dandruff-causing microbes" },
                { name: "Salicylic Acid", benefit: "Lifts flakes and buildup" },
                { name: "Tea Tree Oil", benefit: "Calms scalp irritation" }
            ],
            products: [
                { name: "Anti-Dandruff Control Shampoo", type: "Shampoo", price: "$16" },
                { name: "Scalp Exfoliating Serum", type: "Serum", price: "$21" },
                { name: "Soothing Scalp Mist", type: "Mist", price: "$14" }
            ],
            routine: [
                "Wash scalp every 2-3 days",
                "Use anti-dandruff shampoo and leave for 3 minutes",
                "Avoid hot water on scalp",
                "Use scalp serum at night",
                "Change pillow cover twice weekly"
            ]
    },
    beard_patchy: {
            id: "beard_patchy",
            title: "Patchy Beard Growth",
            description: "Uneven beard density with sparse zones that need circulation support and consistent conditioning.",
            imageUrl: "https://images.unsplash.com/photo-1621607512214-68297480165e?q=80&w=2070&auto=format&fit=crop",

            causes: [
                "Uneven follicle density",
                "Poor skin hydration under beard",
                "Irritation from aggressive trimming",
                "Nutritional and sleep quality gaps"
            ],
            homeRemedies: [
                { title: "Warm towel prep", method: "Apply a warm towel for 1 minute before beard cleansing.", caution: "Avoid very hot temperatures that increase irritation." },
                { title: "Under-beard exfoliation", method: "Use gentle under-beard exfoliation once weekly.", caution: "Do not exfoliate over active cuts or inflamed ingrowns." }
            ],
            ingredients: [
                { name: "Castor Oil", benefit: "Supports beard conditioning" },
                { name: "Niacinamide", benefit: "Improves skin barrier under beard" },
                { name: "Peptides", benefit: "Supports follicle environment" }
            ],
            products: [
                { name: "Beard Growth Serum", type: "Serum", price: "$24" },
                { name: "Nourishing Beard Oil", type: "Oil", price: "$19" },
                { name: "Soft Beard Wash", type: "Cleanser", price: "$14" }
            ],
            routine: [
                "Morning: Clean beard with mild wash",
                "Morning: Apply beard growth serum",
                "Evening: Beard oil + skin moisturizer",
                "2x/week: Exfoliate under-beard skin",
                "Trim only neckline until density improves"
            ]
  }
};

const PHOTO_TYPE_TO_ISSUE: Record<string, IssueKey> = {
    skin: "acne",
    acne: "acne",
    aging: "wrinkles",
    dark_circles: "dark_circles",
    hair: "hair_loss",
    scalp: "dandruff",
    beard: "beard_patchy",
    body_acne: "acne",
};

const CATEGORY_TO_ISSUE: Record<string, IssueKey> = {
    skinCare: "acne",
    hairCare: "hair_loss",
    beardCare: "beard_patchy",
    bodyCare: "acne",
    healthCare: "dark_circles",
    fitness: "aging",
    fragrance: "dark_circles",
};

const SEVERITY_MULTIPLIER: Record<string, number> = {
    mild: 1,
    moderate: 1.35,
    severe: 1.75,
};

function parseProductPrice(price: string): number {
    const parsed = Number((price || "").replace(/[^\d.]/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.round(parsed);
}

function parseJson<T>(value: string | null): T | null {
    if (!value) return null;
    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}

function normalize(value: string): string {
    return value.trim().toLowerCase();
}

function mapTextToIssue(text: string): IssueKey[] {
    const value = normalize(text);
    const issues = new Set<IssueKey>();

    if (/(acne|pimple|blackhead|whitehead|spot|bacne)/.test(value)) issues.add("acne");
    if (/(dark circle|under.?eye|puffy eye|eye bag|fatigue|sleep deprivation)/.test(value)) issues.add("dark_circles");
    if (/(wrinkle|fine line|aging|elasticity|photoaging|uv damage)/.test(value)) issues.add("wrinkles");
    if (/(hair fall|thinning|receding|hair loss|reduced density|temple|crown)/.test(value)) issues.add("hair_loss");
    if (/(dandruff|flaky scalp|itchy scalp|scalp flakes|greasy scalp|dry scalp)/.test(value)) issues.add("dandruff");
    if (/(patchy beard|ingrown|beard dryness|uneven beard|beard dandruff|beard itch)/.test(value)) issues.add("beard_patchy");

    return Array.from(issues);
}

function scoreAnswer(questionId: string, answer: string): Array<{ issue: IssueKey; score: number; severity: number; evidence: string }> {
    const id = normalize(questionId);
    const value = normalize(answer);
    const out: Array<{ issue: IssueKey; score: number; severity: number; evidence: string }> = [];

    if (id === "skin_type" && (value.includes("oily") || value.includes("shiny"))) {
        out.push({ issue: "acne", score: 1.8, severity: 1.2, evidence: "Skin type indicates oil-prone pattern" });
    }
    if (id === "skin_type" && (value.includes("dry") || value.includes("tight"))) {
        out.push({ issue: "wrinkles", score: 1.4, severity: 1.1, evidence: "Skin type indicates dehydration tendency" });
    }
    if (id === "skin_concern" && value.includes("acne")) out.push({ issue: "acne", score: 4.2, severity: 2.1, evidence: "Skin concern selected: acne/pimples" });
    if (id === "skin_concern" && (value.includes("dark") || value.includes("mark") || value.includes("spot"))) out.push({ issue: "dark_circles", score: 2.7, severity: 1.6, evidence: "Skin concern selected: pigmentation/marks" });
    if (id === "skin_concern" && (value.includes("fine line") || value.includes("early"))) out.push({ issue: "wrinkles", score: 3.1, severity: 1.8, evidence: "Skin concern selected: early fine lines" });
    if (id === "breakouts" && value.includes("frequent")) out.push({ issue: "acne", score: 3.8, severity: 2.3, evidence: "Frequent weekly breakouts" });
    if (id === "breakouts" && value.includes("monthly")) out.push({ issue: "acne", score: 2.2, severity: 1.5, evidence: "Monthly breakouts" });
    if (id === "sun_exposure" && value.includes("high")) out.push({ issue: "wrinkles", score: 2.8, severity: 2, evidence: "High direct UV exposure" });
    if (id === "sun_exposure" && value.includes("moderate")) out.push({ issue: "wrinkles", score: 1.6, severity: 1.3, evidence: "Moderate direct UV exposure" });

    if (id === "hair_concern" && (value.includes("hair fall") || value.includes("thinning") || value.includes("density"))) out.push({ issue: "hair_loss", score: 4.1, severity: 2.2, evidence: "Hair concern indicates thinning/fall" });
    if (id === "hair_concern" && value.includes("dandruff")) out.push({ issue: "dandruff", score: 4.1, severity: 2.1, evidence: "Hair concern indicates dandruff/flakes" });
    if (id === "hair_type" && value.includes("reduced")) out.push({ issue: "hair_loss", score: 2.8, severity: 1.8, evidence: "Reduced hair density selected" });
    if (id === "scalp_type" && (value.includes("oily") || value.includes("greasy"))) out.push({ issue: "dandruff", score: 2, severity: 1.4, evidence: "Greasy scalp tendency" });
    if (id === "scalp_type" && (value.includes("dry") || value.includes("itchy"))) out.push({ issue: "dandruff", score: 1.8, severity: 1.3, evidence: "Dry or itchy scalp tendency" });
    if (id === "hair_damage" && (value.includes("3+ times") || value.includes("frequently"))) out.push({ issue: "hair_loss", score: 1.7, severity: 1.3, evidence: "Frequent heat/chemical styling load" });

    if (id === "beard_growth" && (value.includes("patchy") || value.includes("uneven"))) out.push({ issue: "beard_patchy", score: 3.9, severity: 2.1, evidence: "Patchy/uneven beard growth" });
    if (id === "beard_issue" && (value.includes("ingrown") || value.includes("dry") || value.includes("itch"))) out.push({ issue: "beard_patchy", score: 2.8, severity: 1.7, evidence: "Beard issue indicates irritation or dryness" });
    if (id === "beard_care" && value.includes("rarely")) out.push({ issue: "beard_patchy", score: 1.6, severity: 1.2, evidence: "Low beard-care consistency" });

    if (id === "body_issue" && value.includes("body acne")) out.push({ issue: "acne", score: 3.6, severity: 2, evidence: "Body acne selected" });
    if (id === "body_issue" && value.includes("dry")) out.push({ issue: "wrinkles", score: 1.2, severity: 1, evidence: "Body dryness suggests barrier strain" });
    if (id === "sleep" && (value.includes("poor") || value.includes("broken") || value.includes("<6h"))) out.push({ issue: "dark_circles", score: 3, severity: 1.9, evidence: "Poor sleep quality and recovery" });
    if (id === "stress" && value.includes("high")) out.push({ issue: "acne", score: 2, severity: 1.4, evidence: "High stress can amplify inflammation" });
    if (id === "energy" && value.includes("low")) out.push({ issue: "dark_circles", score: 1.4, severity: 1.1, evidence: "Low energy aligns with recovery fatigue" });
    if (id === "diet" && (value.includes("processed") || value.includes("high sugar"))) out.push({ issue: "acne", score: 1.6, severity: 1.2, evidence: "Diet pattern may worsen breakouts" });

    if (id === "skin_goal" && value.includes("clear")) out.push({ issue: "acne", score: 1.3, severity: 1, evidence: "Clear-skin goal emphasis" });
    if (id === "skin_goal" && (value.includes("barrier") || value.includes("hydration"))) out.push({ issue: "wrinkles", score: 1.2, severity: 1, evidence: "Barrier-repair goal emphasis" });
    if (id === "hair_goal" && value.includes("reduce hair fall")) out.push({ issue: "hair_loss", score: 1.6, severity: 1.1, evidence: "Hair-fall reduction goal" });
    if (id === "beard_goal" && value.includes("thicker")) out.push({ issue: "beard_patchy", score: 1.4, severity: 1.1, evidence: "Beard-thickness goal" });

    if (out.length === 0) {
        const inferred = mapTextToIssue(value);
        inferred.forEach((issue) => out.push({ issue, score: 1.1, severity: 1, evidence: `Answer keyword matched for ${issue.replace("_", " ")}` }));
    }

    return out;
}

function resolveIssuesFromSignals(params: {
    assessmentAnswers: Record<string, string>;
    analyzerAnswers: Record<string, string>;
    analyzerSeverities: Record<string, string>;
    photoAnalysis: AnalysisResult | null;
    galaxyAnalysis: GalaxyAnalysisView | null;
}): { issueKeys: IssueKey[]; insightByIssue: Record<IssueKey, IssueSignal>; sourceSignals: number } {
    const insightByIssue: Record<IssueKey, IssueSignal> = {
        acne: { score: 0, severityScore: 0, signals: 0, evidence: [] },
        wrinkles: { score: 0, severityScore: 0, signals: 0, evidence: [] },
        dark_circles: { score: 0, severityScore: 0, signals: 0, evidence: [] },
        aging: { score: 0, severityScore: 0, signals: 0, evidence: [] },
        hair_loss: { score: 0, severityScore: 0, signals: 0, evidence: [] },
        dandruff: { score: 0, severityScore: 0, signals: 0, evidence: [] },
        beard_patchy: { score: 0, severityScore: 0, signals: 0, evidence: [] },
    };

    let sourceSignals = 0;

    const bump = (issue: IssueKey, score: number, severity: number, evidence: string) => {
        const target = insightByIssue[issue];
        target.score += score;
        target.severityScore += severity;
        target.signals += 1;
        if (target.evidence.length < 5) target.evidence.push(evidence);
    };

    const scoreAnswerSet = (
        answers: Record<string, string>,
        severities?: Record<string, string>,
        baseMultiplier = 1
    ) => {
        Object.entries(answers).forEach(([questionId, value]) => {
            const events = scoreAnswer(questionId, value);
            const sev = normalize(severities?.[questionId] || "mild");
            const sevMul = SEVERITY_MULTIPLIER[sev] || 1;
            events.forEach((event) => {
                bump(
                    event.issue,
                    event.score * baseMultiplier * sevMul,
                    event.severity * sevMul,
                    event.evidence
                );
            });
        });
    };

    if (Object.keys(params.assessmentAnswers).length > 0) {
        sourceSignals += 1;
        scoreAnswerSet(params.assessmentAnswers, undefined, 1);
    }

    if (Object.keys(params.analyzerAnswers).length > 0) {
        sourceSignals += 1;
        scoreAnswerSet(params.analyzerAnswers, params.analyzerSeverities, 1.15);
    }

    if (params.photoAnalysis) {
        sourceSignals += 1;
        const mapped = PHOTO_TYPE_TO_ISSUE[params.photoAnalysis.type] || "acne";
        const severityMap = { low: 1.1, moderate: 1.6, high: 2.2 };
        bump(mapped, 2.8, severityMap[params.photoAnalysis.severity], "Primary photo analyzer type signal");

        if (params.photoAnalysis.confidence >= 75) {
            bump(mapped, 1.2, 1.1, `Photo confidence ${params.photoAnalysis.confidence}%`);
        }

        params.photoAnalysis.detectedIssues.forEach((issue) => {
            const impactWeight = issue.impact === "significant" ? 2.3 : issue.impact === "moderate" ? 1.6 : 1;
            const candidates = mapTextToIssue(issue.name);
            candidates.forEach((candidate) => {
                bump(
                    candidate,
                    impactWeight + issue.confidence / 100,
                    impactWeight,
                    `Detected issue: ${issue.name}`
                );
            });
        });
    }

    if (params.galaxyAnalysis) {
        sourceSignals += 1;

        (params.galaxyAnalysis.selectedCategories || []).forEach((categoryId) => {
            const issue = CATEGORY_TO_ISSUE[categoryId];
            if (issue) bump(issue, 0.9, 1, `Selected category: ${categoryId}`);
        });

        (params.galaxyAnalysis.hotspots || []).forEach((spot) => {
            const issues = mapTextToIssue(spot.label);
            const hotSeverity = normalize(spot.severity || "medium");
            const impact = hotSeverity === "high" ? 1.8 : hotSeverity === "low" ? 1 : 1.4;
            issues.forEach((issue) => bump(issue, 1.2 * impact, 1.1 * impact, `Hotspot: ${spot.label}`));
        });

        (params.galaxyAnalysis.issues || []).forEach((issue) => {
            const issues = mapTextToIssue(issue.name || "");
            const impact = issue.impact === "significant" ? 2.2 : issue.impact === "moderate" ? 1.5 : 1;
            issues.forEach((candidate) => {
                bump(candidate, impact + (issue.confidence || 70) / 120, impact, `Galaxy issue: ${issue.name || "visual signal"}`);
            });
        });
    }

    if (insightByIssue.aging.score > 0) {
        bump("wrinkles", insightByIssue.aging.score * 0.7, insightByIssue.aging.severityScore * 0.6, "Aging signal contributes to fine lines profile");
    }

    const ranked = (Object.entries(insightByIssue) as Array<[IssueKey, IssueSignal]>)
        .filter(([, signal]) => signal.score > 0)
        .sort((a, b) => b[1].score - a[1].score);

    const topScore = ranked[0]?.[1].score ?? 0;
    const picked = ranked
        .filter(([, signal], index) => signal.score >= 2 || (index < 3 && signal.score >= topScore * 0.65))
        .slice(0, 3)
        .map(([key]) => key as IssueKey);

    const issueKeys: IssueKey[] = picked.length > 0 ? picked : ["acne", "dark_circles"];
    return { issueKeys, insightByIssue, sourceSignals };
}

const ResultPageContent = () => {
    const router = useRouter();
    const addCartItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.openCart);
    const cartSubtotal = useCartStore((s) => s.totalPrice());
    const credits = useRewardsStore((s) => s.credits);
    const xp = useRewardsStore((s) => s.xp);
    const level = useRewardsStore((s) => s.level);
    const levelTitle = useRewardsStore((s) => s.levelTitle);
    const activeDiscount = useRewardsStore((s) => s.activeDiscount);
    const tiers = useRewardsStore((s) => s.tiers);
    const addCredits = useRewardsStore((s) => s.addCredits);
    const clearExpiredDiscount = useRewardsStore((s) => s.clearExpiredDiscount);
    const getDiscountAmount = useRewardsStore((s) => s.getDiscountAmount);
    const getPayableTotal = useRewardsStore((s) => s.getPayableTotal);

    const [scannedIssues, setScannedIssues] = useState<IssueDetails[]>([]);
    const [issueSignals, setIssueSignals] = useState<Record<IssueKey, IssueSignal> | null>(null);
    const [sourceSignals, setSourceSignals] = useState(0);
    const [aiSummary, setAiSummary] = useState<string>("");
    const [aiActions, setAiActions] = useState<string[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [rewardMessage, setRewardMessage] = useState<string>("");
    const [productMessage, setProductMessage] = useState<string>("");
    const [catalogOverrideJson, setCatalogOverrideJson] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const activeSignalScores = scannedIssues
        .map((issue) => issueSignals?.[issue.id as IssueKey]?.score || 0)
        .filter((score) => score > 0);
    const evidenceBreadth = scannedIssues
        .map((issue) => issueSignals?.[issue.id as IssueKey]?.signals || 0)
        .reduce((acc, value) => acc + value, 0);
    const averageSignalScore = activeSignalScores.length > 0
        ? activeSignalScores.reduce((acc, score) => acc + score, 0) / activeSignalScores.length
        : 0;
    const reportConfidence = Math.min(97, Math.max(70, Math.round(64 + sourceSignals * 6 + averageSignalScore * 1.6 + Math.min(10, evidenceBreadth * 0.5))));
    const patientName = getActiveUserName() || "Ashu";
    const reportDate = new Date();
    const patientId = normalize(patientName).replace(/\s+/g, "").toUpperCase() || "USER";
    const reportId = `AF-${patientId}-${Date.now()}`;
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 30);

    const clinicalBreakdownRows = scannedIssues.map((issue) => {
        const signal = issueSignals?.[issue.id as IssueKey];
        const severity = getIssueSeverityLabel(issue.id);
        const confidence = Math.min(
            96,
            Math.max(
                65,
                Math.round(reportConfidence - 6 + (signal?.score || 0) * 3 + Math.min(6, (signal?.signals || 0) * 1.5))
            )
        );

        return {
            category: issue.title,
            severity,
            confidence,
            evidence: signal?.evidence?.slice(0, 2).join("; ") || "Assessment and visual indicators",
        };
    });

    const rootCauses = Array.from(new Set(scannedIssues.flatMap((issue) => issue.causes))).slice(0, 8);
    const prescribedIngredients = Array.from(
        new Map(
            scannedIssues
                .flatMap((issue) => issue.ingredients)
                .map((ingredient) => [ingredient.name, ingredient])
        ).values()
    );
    const recommendedProducts = scannedIssues.flatMap((issue) =>
        issue.products.map((product) => ({
            ...product,
            issueId: issue.id,
            issueTitle: issue.title,
        }))
    );
    const getSafeProductImageSrc = (src?: string) => {
        if (!src) return "/images/report-fallback.svg";
        return src;
    };
    const executiveConcerns = scannedIssues.slice(0, 2).map((issue) => ({
        title: issue.title,
        severity: getIssueSeverityLabel(issue.id),
    }));
    const contributingFactors = ["Low sleep", "High stress", "Irregular routine"];
    const sortedTiers = [...tiers].sort((a, b) => a.creditsCost - b.creditsCost);
    const nextTier = sortedTiers.find((tier) => tier.creditsCost > credits) || null;
    const creditsToNextTier = nextTier ? Math.max(0, nextTier.creditsCost - credits) : 0;

    const getIngredientUsage = (name: string) => {
        const normalizedName = normalize(name);
        if (normalizedName.includes("ketoconazole")) return "2x weekly";
        if (normalizedName.includes("biotin")) return "Daily supplement";
        if (normalizedName.includes("caffeine")) return "Daily topical";
        if (normalizedName.includes("retinol")) return "2-3x weekly night use";
        if (normalizedName.includes("salicylic")) return "3x weekly";
        return "As directed by protocol";
    };

    function getIssueSeverityLabel(issueId: string) {
        const signal = issueSignals?.[issueId as IssueKey];
        if (!signal || signal.signals === 0) return "Moderate";
        const normalized = signal.severityScore / signal.signals;
        if (normalized >= 2.2) return "Severe";
        if (normalized >= 1.5) return "Moderate";
        return "Mild";
    }

    useEffect(() => {
        clearExpiredDiscount();
    }, [clearExpiredDiscount]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const rewardedKey = "result_report_rewarded_v1";
        if (sessionStorage.getItem(rewardedKey)) return;
        addCredits(25, "result_report_generated");
        sessionStorage.setItem(rewardedKey, "1");
    }, [addCredits]);

    const handleSaveActionPlan = () => {
        addCredits(30, "save_action_plan");
        setRewardMessage("Saved action plan · +30 credits");
        setTimeout(() => setRewardMessage(""), 2200);
    };

    const handleAddToWebsiteCart = (issueId: string, product: { name: string; type: string; price: string }) => {
        addCartItem({
            id: `${issueId}-${normalize(product.name).replace(/\s+/g, "-")}`,
            name: product.name,
            price: parseProductPrice(product.price),
            quantity: 1,
        });
        openCart();
        addCredits(5, "result_product_added");
        setProductMessage(`${product.name} added to website cart · +5 credits`);
        setTimeout(() => setProductMessage(""), 2200);
    };

    const handleShopOfficial = (product: { name: string; type: string; imageUrl?: string; buyUrl?: string }) => {
        const link = resolveCatalogProductMeta(
            product.name,
            product.type,
            { imageUrl: product.imageUrl, buyUrl: product.buyUrl },
            catalogOverrideJson
        ).buyUrl;
        if (typeof window !== "undefined") {
            window.open(link, "_blank", "noopener,noreferrer");
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const activeUser = getActiveUserName();
            const catalogOverride = localStorage.getItem("product_catalog_override_json_v1");
            if (catalogOverride) setCatalogOverrideJson(catalogOverride);

            const savedAnalysis = parseJson<AnalysisResult>(sessionStorage.getItem("photoAnalysis"));
            const savedAssessment =
                parseJson<Record<string, string>>(getScopedSessionItem("assessment_answers_v1", activeUser, true)) || {};
            const savedAnalyzerAnswers = parseJson<Record<string, string>>(sessionStorage.getItem("analyzerAnswers")) || {};
            const savedAnalyzerSeverities = parseJson<Record<string, string>>(sessionStorage.getItem("analyzerSeverities")) || {};
            const savedGalaxy = parseJson<GalaxyAnalysisView>(sessionStorage.getItem("galaxyAnalysis"));

            const resolvedSignals = resolveIssuesFromSignals({
                assessmentAnswers: savedAssessment,
                analyzerAnswers: savedAnalyzerAnswers,
                analyzerSeverities: savedAnalyzerSeverities,
                photoAnalysis: savedAnalysis,
                galaxyAnalysis: savedGalaxy,
            });

            setIssueSignals(resolvedSignals.insightByIssue);
            setSourceSignals(resolvedSignals.sourceSignals);

            const resolved = resolvedSignals.issueKeys
                .map((key) => ISSUE_DATABASE[key])
                .filter(Boolean);
            setScannedIssues(resolved.length > 0 ? resolved : [ISSUE_DATABASE["acne"], ISSUE_DATABASE["dark_circles"]]);

            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (scannedIssues.length === 0) return;

        const fetchAdvice = async () => {
            setAiLoading(true);
            try {
                const savedAnswersRaw =
                    typeof window !== "undefined"
                        ? getScopedSessionItem("assessment_answers_v1", getActiveUserName(), true)
                        : null;
                const savedAnalyzerRaw =
                    typeof window !== "undefined"
                        ? sessionStorage.getItem("analyzerAnswers")
                        : null;
                const answers = {
                    ...(savedAnswersRaw ? JSON.parse(savedAnswersRaw) : {}),
                    ...(savedAnalyzerRaw ? JSON.parse(savedAnalyzerRaw) : {}),
                };

                const res = await fetch("/api/ai/advice", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        issues: scannedIssues.map((issue) => issue.title),
                        answers,
                        locale: "en",
                    }),
                });

                if (!res.ok) throw new Error("AI advice failed");
                const data = await res.json();

                setAiSummary(data.summary || "");
                setAiActions(Array.isArray(data.actions) ? data.actions : []);
            } catch {
                setAiSummary("Stay consistent with your routine for the next 7 days and focus on barrier-safe, low-irritation care.");
                setAiActions([
                    "Use cleanser + moisturizer + SPF daily",
                    "Introduce one active at a time",
                    "Track progress weekly in similar lighting",
                    "Review and adjust after 7 days",
                ]);
            } finally {
                setAiLoading(false);
            }
        };

        fetchAdvice();
    }, [scannedIssues]);

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Generatng Comprehensive Report...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30">
            {/* --- HEADER --- */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-white/5">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5 rotate-180" />
                        <span>Dashboard</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h1 className="font-bold text-lg">Analysis Report</h1>
                    </div>
                    <div className="w-20" /> {/* Spacer */}
                </div>
            </header>

            <main className="pt-28 pb-20 px-6 max-w-5xl mx-auto space-y-20">
                <section className="bg-surface border border-white/10 rounded-2xl p-8 shadow-[0_10px_30px_rgba(2,6,23,0.22)]">
                    <div className="pb-5 border-b border-white/10">
                        <h1 className="text-[2rem] md:text-[2.25rem] leading-tight font-semibold text-white">AI Dermatology Analysis Report</h1>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-6">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-gray-400">Report ID</p>
                            <p className="text-white font-semibold mt-1">{reportId}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-gray-400">Patient</p>
                            <p className="text-white font-semibold mt-1">{patientName}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-gray-400">Date</p>
                            <p className="text-white font-semibold mt-1">{reportDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-gray-400">Confidence Level</p>
                            <p className="text-white font-semibold mt-1">{reportConfidence}%</p>
                        </div>
                    </div>
                </section>

                <section className="bg-surface border border-white/10 rounded-2xl p-8 shadow-[0_10px_30px_rgba(2,6,23,0.22)]">
                    <h2 className="text-2xl font-semibold text-white">Clinical Summary</h2>
                    <p className="mt-4 text-base leading-7 text-gray-200">
                        AI-driven dermatological analysis indicates two primary concerns requiring structured intervention.
                    </p>
                    <ul className="mt-5 space-y-2">
                        {(executiveConcerns.length > 0
                            ? executiveConcerns
                            : [{ title: "Hair thinning", severity: "Moderate" }, { title: "Scalp inflammation", severity: "Mild" }]
                        ).map((concern, index) => (
                            <li key={`${concern.title}-${index}`} className="text-gray-200">• {concern.title} ({concern.severity})</li>
                        ))}
                    </ul>
                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h3 className="text-lg font-semibold text-white mb-2">AI Guidance</h3>
                        <p className="text-sm text-gray-300">
                            {aiLoading
                                ? "Generating professional guidance based on current findings..."
                                : aiSummary || "Maintain consistency and reassess after the recommended protocol window."}
                        </p>
                        {aiActions.length > 0 && (
                            <ul className="mt-3 space-y-1 text-sm text-gray-300">
                                {aiActions.slice(0, 3).map((action) => (
                                    <li key={action}>• {action}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <section className="bg-surface border border-white/10 rounded-2xl p-8 shadow-[0_10px_30px_rgba(2,6,23,0.22)]" id="clinical-breakdown">
                    <h2 className="text-2xl font-semibold text-white mb-4">Clinical Metrics</h2>
                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                        <table className="min-w-full text-sm">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-gray-300 font-semibold">Category</th>
                                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-gray-300 font-semibold">Severity</th>
                                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-gray-300 font-semibold">Confidence</th>
                                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-gray-300 font-semibold">Evidence Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clinicalBreakdownRows.map((row, index) => (
                                    <tr key={`${row.category}-${index}`} className="border-t border-white/10">
                                        <td className="px-4 py-3 text-white">{row.category}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold border ${
                                                row.severity === "Severe"
                                                    ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                                                    : row.severity === "Moderate"
                                                        ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                                                        : "border-blue-400/30 bg-blue-500/10 text-blue-200"
                                            }`}>
                                                {row.severity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-200">{row.confidence}%</td>
                                        <td className="px-4 py-3 text-gray-300">{row.evidence}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="bg-surface border border-white/10 rounded-2xl p-8 shadow-[0_10px_30px_rgba(2,6,23,0.22)]">
                    <h2 className="text-2xl font-semibold text-white mb-5">Root Cause Analysis</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                            <h3 className="text-lg font-semibold text-white">Root Causes</h3>
                            <ul className="mt-3 space-y-2 text-sm text-gray-300">
                                {(rootCauses.length > 0 ? rootCauses : ["Scalp buildup", "Protein deficiency", "DHT sensitivity"]).slice(0, 6).map((cause, index) => (
                                    <li key={`${cause}-${index}`}>• {cause}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                            <h3 className="text-lg font-semibold text-white">Contributing Factors</h3>
                            <ul className="mt-3 space-y-2 text-sm text-gray-300">
                                {contributingFactors.map((factor) => (
                                    <li key={factor}>• {factor}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="bg-surface border border-white/10 rounded-2xl p-8 shadow-[0_10px_30px_rgba(2,6,23,0.22)]">
                    <h2 className="text-2xl font-semibold text-white">Prescribed Treatment Protocol</h2>
                    <div className="mt-5 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
                        <div className="p-5">
                            <h3 className="text-lg font-semibold text-white">Phase 1 – Stabilization (Week 1–2)</h3>
                            <ul className="mt-3 space-y-1 text-sm text-gray-300">
                                <li>• Gentle scalp massage</li>
                                <li>• Anti-inflammatory shampoo</li>
                            </ul>
                        </div>
                        <div className="p-5">
                            <h3 className="text-lg font-semibold text-white">Phase 2 – Active Repair (Week 3–6)</h3>
                            <ul className="mt-3 space-y-1 text-sm text-gray-300">
                                <li>• Ketoconazole shampoo</li>
                                <li>• Biotin supplementation</li>
                            </ul>
                        </div>
                        <div className="p-5">
                            <h3 className="text-lg font-semibold text-white">Phase 3 – Maintenance</h3>
                            <ul className="mt-3 space-y-1 text-sm text-gray-300">
                                <li>• Alternate day scalp routine</li>
                                <li>• Maintain consistency and weekly review</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="bg-surface border border-white/10 rounded-2xl p-8 shadow-[0_10px_30px_rgba(2,6,23,0.22)]">
                    <h2 className="text-2xl font-semibold text-white mb-4">Ingredient Prescription</h2>
                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                        <table className="min-w-full text-sm">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-gray-300 font-semibold">Ingredient</th>
                                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-gray-300 font-semibold">Function</th>
                                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-gray-300 font-semibold">Recommended Usage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(prescribedIngredients.length > 0 ? prescribedIngredients : [{ name: "Caffeine", benefit: "Stimulates follicles" }, { name: "Biotin", benefit: "Keratin support" }, { name: "Ketoconazole", benefit: "Reduce inflammation" }]).slice(0, 6).map((ingredient, index) => (
                                    <tr key={`${ingredient.name}-${index}`} className="border-t border-white/10">
                                        <td className="px-4 py-3 text-white">{ingredient.name}</td>
                                        <td className="px-4 py-3 text-gray-300">{ingredient.benefit}</td>
                                        <td className="px-4 py-3 text-gray-300">{getIngredientUsage(ingredient.name)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="bg-surface border border-white/10 rounded-2xl p-8 shadow-[0_10px_30px_rgba(2,6,23,0.22)]">
                    <h2 className="text-2xl font-semibold text-white">Product Matching</h2>
                    {productMessage && <p className="mt-3 text-sm text-primary">{productMessage}</p>}
                    <div className="mt-5 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendedProducts.slice(0, 6).map((product, i) => {
                            const productMeta = resolveCatalogProductMeta(
                                product.name,
                                product.type,
                                { imageUrl: product.imageUrl, buyUrl: product.buyUrl },
                                catalogOverrideJson
                            );
                            const matchScore = Math.min(96, Math.max(80, reportConfidence + 6 - i));

                            return (
                                <div key={`${product.name}-${i}`} className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs px-2 py-1 rounded-lg border border-blue-400/30 bg-blue-500/10 text-blue-200">Match Score: {matchScore}%</span>
                                            <span className="text-white font-semibold">{product.price}</span>
                                        </div>
                                        <div className="relative h-28 mb-3 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                            <Image
                                                loader={({ src }) => src}
                                                unoptimized
                                                src={getSafeProductImageSrc(productMeta.imageUrl)}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 1024px) 100vw, 33vw"
                                                onError={(e) => {
                                                    const target = e.currentTarget;
                                                    if (target.src.includes("report-fallback.svg")) return;
                                                    target.src = "/images/report-fallback.svg";
                                                }}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <p className="text-white font-semibold text-sm">{product.name}</p>
                                        <p className="text-xs text-gray-400 mt-1">Why recommended: matched for {product.issueTitle.toLowerCase()} profile</p>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <button
                                            onClick={() => handleAddToWebsiteCart(product.issueId, product)}
                                            className="w-full py-2.5 rounded-xl bg-primary text-black border border-primary hover:brightness-110 transition-all text-sm font-bold flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            Add to Cart
                                        </button>
                                        <button
                                            onClick={() => handleShopOfficial(product)}
                                            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold flex items-center justify-center gap-2 text-gray-100"
                                        >
                                            Visit Official Site
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-surface border border-white/10 rounded-2xl p-8 shadow-[0_10px_30px_rgba(2,6,23,0.22)]">
                    <h2 className="text-2xl font-semibold text-white">Lifestyle Prescription</h2>
                    <div className="mt-4 space-y-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-gray-200 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-300" />Sleep 7–8 hours nightly.</div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-gray-200 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-300" />Hydration baseline: 3L/day.</div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-gray-200 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-300" />Reduce high-sugar intake and maintain stable meal timing.</div>
                    </div>
                </section>

                <section className="bg-surface border border-white/10 rounded-2xl p-8 shadow-[0_10px_30px_rgba(2,6,23,0.22)]">
                    <div className="flex items-center gap-3 mb-5">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h2 className="text-2xl font-semibold text-white">Follow-up & Reassessment</h2>
                    </div>
                    <p className="text-sm text-gray-400">Recommended Reassessment Date</p>
                    <p className="text-lg font-semibold text-white mt-1">{followUpDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <button onClick={handleSaveActionPlan} className="px-5 py-2.5 rounded-xl border border-white/20 bg-white/5 text-sm font-semibold text-white hover:bg-white/10">Schedule Reminder</button>
                        <button
                            onClick={() => {
                                if (typeof window !== "undefined") {
                                    window.print();
                                }
                            }}
                            className="px-5 py-2.5 rounded-xl border border-white/20 bg-white/5 text-sm font-semibold text-white hover:bg-white/10"
                        >
                            Download PDF Report
                        </button>
                    </div>
                </section>

                <section className="bg-surface border border-white/10 rounded-2xl p-8 shadow-[0_10px_30px_rgba(2,6,23,0.22)]">
                    <div className="flex items-center gap-3 mb-4">
                        <Trophy className="w-5 h-5 text-blue-300" />
                        <h2 className="text-2xl font-semibold text-white">XP & Reward Summary</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-wider text-gray-400">Coins Earned</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{credits}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-wider text-gray-400">Current Level</p>
                            <p className="mt-2 text-lg font-semibold text-white">Level {level} – {levelTitle}</p>
                            <p className="text-xs text-gray-400 mt-1">XP: {xp}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-wider text-gray-400">Next Tier Progress</p>
                            <p className="mt-2 text-lg font-semibold text-white">{nextTier ? `${nextTier.label} (${nextTier.discountPercent}% OFF)` : "Top tier unlocked"}</p>
                            <p className="text-xs text-gray-400 mt-1">{nextTier ? `${creditsToNextTier} coins to unlock` : "No pending tier"}</p>
                        </div>
                    </div>
                    {activeDiscount && (
                        <p className="mt-4 text-sm text-blue-200">Active discount: {activeDiscount.discountPercent}% • Estimated savings: ₹{getDiscountAmount(cartSubtotal)} • Payable: ₹{getPayableTotal(cartSubtotal)}</p>
                    )}
                    {rewardMessage && <p className="mt-3 text-sm text-primary">{rewardMessage}</p>}
                </section>

                <section className="pb-8">
                    <p className="text-sm text-gray-500">
                        This AI-generated report is intended for educational purposes and does not substitute licensed medical diagnosis.
                    </p>
                </section>

            </main>
        </div>
    );
}

export default function ResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <ResultPageContent />
        </Suspense>
    );
}
