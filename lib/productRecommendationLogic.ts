import { supabase } from "@/lib/supabaseClient";
import { CategoryId } from "@/lib/questions";
import { getClinicalDemoProducts } from "@/lib/clinicalProductCatalog";

export type ProductJustification = {
  product_id?: string;
  product_name: string;
  product_type: string;
  targets: string[];
  why_recommended: string;
  expected_timeline: string;
  usage_note: string;
  shopify_handle?: string;
  price_inr?: number;
  ingredient?: string;
  benefits?: string[];
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function acneProducts(severity: number): ProductJustification[] {
  const base: ProductJustification[] = [
    {
      product_name: "Niacinamide Serum",
      product_type: "serum",
      targets: ["oil imbalance", "redness", "visible pores"],
      why_recommended: "Helps regulate sebum and improves barrier tolerance for acne-prone skin.",
      expected_timeline: "4-8 weeks",
      usage_note: "Apply in morning after cleansing, before moisturizer.",
    },
    {
      product_name: "Salicylic Acid Treatment",
      product_type: "treatment",
      targets: ["clogged pores", "breakout recurrence"],
      why_recommended: "Penetrates pores and reduces comedonal buildup.",
      expected_timeline: "4-8 weeks",
      usage_note: "Use on alternate nights; pair with barrier moisturizer.",
    },
    {
      product_name: "Non-Comedogenic Sunscreen SPF 30+",
      product_type: "sunscreen",
      targets: ["post-acne marks", "inflammation aggravation"],
      why_recommended: "Reduces UV-triggered pigmentation and supports recovery.",
      expected_timeline: "Daily prevention; visible mark control in 6-12 weeks",
      usage_note: "Apply every morning and reapply outdoors.",
    },
  ];

  if (severity >= 70) {
    base.push({
      product_name: "Barrier Repair Moisturizer (Ceramide-rich)",
      product_type: "moisturizer",
      targets: ["treatment irritation", "barrier fragility"],
      why_recommended: "Improves tolerance to active therapies and reduces rebound inflammation.",
      expected_timeline: "1-3 weeks",
      usage_note: "Use morning and night as recovery support.",
    });
  }

  return base;
}

function hairLossProducts(): ProductJustification[] {
  return [
    {
      product_name: "Scalp Growth Serum (Minoxidil-compatible)",
      product_type: "serum",
      targets: ["follicle miniaturization", "density decline"],
      why_recommended: "Supports follicle stimulation and prolongs growth phase when used consistently.",
      expected_timeline: "12-24 weeks (often 6+ months for fuller response)",
      usage_note: "Apply daily to thinning zones; consistency is critical.",
    },
    {
      product_name: "Scalp Cleanse Shampoo",
      product_type: "cleanser",
      targets: ["scalp buildup", "inflammation triggers"],
      why_recommended: "Improves scalp environment and reduces blockage around follicles.",
      expected_timeline: "2-6 weeks",
      usage_note: "Use 2-4 times weekly based on scalp oil pattern.",
    },
    {
      product_name: "Rosemary Support Oil",
      product_type: "oil",
      targets: ["micro-circulation", "dry scalp stress"],
      why_recommended: "Adjunct support for scalp comfort and routine adherence.",
      expected_timeline: "6-12 weeks",
      usage_note: "Night application on non-active treatment sessions.",
    },
  ];
}

function scalpProducts(): ProductJustification[] {
  return [
    {
      product_name: "pH-Balanced Scalp Shampoo",
      product_type: "cleanser",
      targets: ["flake load", "oil imbalance"],
      why_recommended: "Stabilizes scalp microbiome stress and supports barrier recovery.",
      expected_timeline: "2-4 weeks",
      usage_note: "Use on scheduled wash days; avoid overly hot water.",
    },
    {
      product_name: "Scalp Soothing Tonic",
      product_type: "tonic",
      targets: ["redness", "itch/inflammation"],
      why_recommended: "Lowers inflammatory burden and itch cycle.",
      expected_timeline: "1-3 weeks",
      usage_note: "Apply nightly to affected areas.",
    },
  ];
}

function darkCircleProducts(): ProductJustification[] {
  return [
    {
      product_name: "Caffeine Eye Serum",
      product_type: "serum",
      targets: ["puffiness", "vascular dark tone"],
      why_recommended: "Supports de-puffing and improves under-eye appearance in morning routine.",
      expected_timeline: "2-6 weeks",
      usage_note: "Apply in AM with light tapping motion.",
    },
    {
      product_name: "Retinoid Eye Cream",
      product_type: "night cream",
      targets: ["texture", "fine line shadowing"],
      why_recommended: "Improves turnover and under-eye skin quality over sustained use.",
      expected_timeline: "8-12 weeks",
      usage_note: "Use on alternate nights initially.",
    },
  ];
}

function beardProducts(): ProductJustification[] {
  return [
    {
      product_name: "Beard Growth Serum",
      product_type: "serum",
      targets: ["patchiness", "density inconsistency"],
      why_recommended: "Supports follicle stimulation in sparse beard zones.",
      expected_timeline: "8-12 weeks",
      usage_note: "Apply nightly with gentle massage.",
    },
    {
      product_name: "Ingrown Control Exfoliant",
      product_type: "treatment",
      targets: ["ingrown risk", "post-shave bumps"],
      why_recommended: "Reduces follicular blockage and irritation.",
      expected_timeline: "2-4 weeks",
      usage_note: "Use 2-3 times weekly.",
    },
  ];
}

function bodyAcneProducts(): ProductJustification[] {
  return [
    {
      product_name: "Body Acne Cleanser (BHA)",
      product_type: "cleanser",
      targets: ["body breakouts", "congestion"],
      why_recommended: "Supports follicular unclogging in high-friction/sweat zones.",
      expected_timeline: "4-8 weeks",
      usage_note: "Post-workout shower use is ideal.",
    },
    {
      product_name: "Barrier Body Moisturizer",
      product_type: "moisturizer",
      targets: ["irritation", "barrier dryness"],
      why_recommended: "Prevents over-drying from active body washes.",
      expected_timeline: "1-3 weeks",
      usage_note: "Apply after cleansing.",
    },
  ];
}

function lipProducts(): ProductJustification[] {
  return [
    {
      product_name: "SPF Lip Balm",
      product_type: "lip care",
      targets: ["UV pigmentation", "daytime dryness"],
      why_recommended: "Prevents ongoing sun-triggered lip darkening and dryness cycles.",
      expected_timeline: "2-6 weeks",
      usage_note: "Reapply every 2-3 hours outdoors.",
    },
    {
      product_name: "Occlusive Lip Repair Ointment",
      product_type: "lip care",
      targets: ["night cracking", "barrier loss"],
      why_recommended: "Seals hydration overnight and supports barrier recovery.",
      expected_timeline: "3-14 days",
      usage_note: "Use nightly with thick layer.",
    },
  ];
}

function antiAgingProducts(): ProductJustification[] {
  return [
    {
      product_name: "Antioxidant Serum",
      product_type: "serum",
      targets: ["oxidative stress", "dullness"],
      why_recommended: "Supports defense against daily photo-aging stressors.",
      expected_timeline: "4-8 weeks",
      usage_note: "Use each morning before moisturizer.",
    },
    {
      product_name: "Retinoid Night Treatment",
      product_type: "night treatment",
      targets: ["fine lines", "texture decline"],
      why_recommended: "Improves cellular turnover and collagen-supportive remodeling over time.",
      expected_timeline: "8-16 weeks",
      usage_note: "Start 2-3 nights/week and escalate slowly.",
    },
    {
      product_name: "Broad Spectrum Sunscreen SPF 30+",
      product_type: "sunscreen",
      targets: ["UV-driven wrinkle acceleration", "pigmentation"],
      why_recommended: "Primary anti-aging protection layer and relapse prevention.",
      expected_timeline: "Daily prevention; cumulative visible benefit",
      usage_note: "Apply each morning and reapply outdoors.",
    },
  ];
}

function buildRecommendations(category: CategoryId, severity: number) {
  const demoProducts = getClinicalDemoProducts(category);
  if (demoProducts.length >= 2) {
    return demoProducts.slice(0, 2).map((product, index) => ({
      product_id: product.id,
      product_name: product.name,
      product_type: index === 0 ? "core" : "booster",
      targets: product.benefits,
      why_recommended: product.why,
      expected_timeline: index === 0 ? (severity >= 70 ? "2-6 weeks for visible control, longer for deeper recovery" : "2-4 weeks for early visible support") : "4-8 weeks with consistent use",
      usage_note: product.usage,
      shopify_handle: product.shopifyHandle,
      price_inr: product.priceInr,
      ingredient: product.ingredient,
      benefits: product.benefits,
    }));
  }

  switch (category) {
    case "acne":
      return acneProducts(severity);
    case "hair_loss":
      return hairLossProducts();
    case "scalp_health":
      return scalpProducts();
    case "dark_circles":
      return darkCircleProducts();
    case "beard_growth":
      return beardProducts();
    case "body_acne":
      return bodyAcneProducts();
    case "lip_care":
      return lipProducts();
    case "anti_aging":
      return antiAgingProducts();
    default:
      return [];
  }
}

export async function productRecommendationLogic(userId: string, category: CategoryId) {
  const { data: scoreRow } = await supabase
    .from("user_category_clinical_scores")
    .select("severity_score")
    .eq("user_id", userId)
    .eq("category", category)
    .maybeSingle();

  const severity = clamp(Number(scoreRow?.severity_score || 0));
  const recommendations = buildRecommendations(category, severity);

  const payload = recommendations.map((entry) => ({
    user_id: userId,
    category,
    product_name: entry.product_name,
    reason: entry.why_recommended,
    recommendation_payload: entry,
    created_at: new Date().toISOString(),
  }));

  if (payload.length > 0) {
    await supabase
      .from("product_recommendations")
      .delete()
      .eq("user_id", userId)
      .eq("category", category);

    await supabase.from("product_recommendations").insert(payload);
  }

  return recommendations;
}
