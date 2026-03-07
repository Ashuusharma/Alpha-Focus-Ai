export type ClinicalCategoryId =
  | "scalp_health"
  | "acne"
  | "dark_circles"
  | "hair_loss"
  | "beard_growth"
  | "body_acne"
  | "lip_care"
  | "anti_aging";

export type LegacyCategoryId =
  | "hairCare"
  | "skinCare"
  | "beardCare"
  | "bodyCare"
  | "healthCare"
  | "fitness"
  | "fragrance";

export type CategoryId = ClinicalCategoryId | LegacyCategoryId;

export interface Category {
  id: CategoryId;
  label: string;
  imageUrl: string;
}

export interface QuestionOption {
  label: string;
  score: number;
}

export interface Question {
  id: string;
  text: string;
  domain: string;
  weight: number;
  options: QuestionOption[];
  imageUrl?: string;
  context?: string;
}

export const categories: Category[] = [
  {
    id: "scalp_health",
    label: "Scalp Health",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "acne",
    label: "Acne",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "dark_circles",
    label: "Dark Circles",
    imageUrl: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "hair_loss",
    label: "Hair Loss",
    imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "beard_growth",
    label: "Beard Growth",
    imageUrl: "https://images.unsplash.com/photo-1621607512214-68297480165e?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "body_acne",
    label: "Body Acne",
    imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "lip_care",
    label: "Lip Care",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "anti_aging",
    label: "Anti-Aging",
    imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=1400&auto=format&fit=crop",
  },
];

const clinicalCategoryDomains: Record<ClinicalCategoryId, string[]> = {
  scalp_health: ["inflammation", "sebum_balance", "barrier_integrity", "shedding_risk", "stress_impact", "sleep_impact", "hygiene_pattern"],
  acne: ["inflammatory_load", "pore_clogging", "hormonal_factor", "stress_trigger", "diet_trigger", "sun_damage", "post_acne_marking"],
  dark_circles: ["vascular_factor", "pigmentation", "sleep_deprivation", "dehydration", "stress_load"],
  hair_loss: ["follicle_density", "recession_pattern", "shedding_rate", "hormonal_risk", "nutritional_risk", "stress_factor"],
  beard_growth: ["patchiness", "density", "ingrown_risk", "irritation_level", "grooming_pattern"],
  body_acne: ["sweat_load", "friction_irritation", "bacterial_risk", "hygiene_pattern"],
  lip_care: ["dryness_index", "pigmentation", "sun_exposure", "hydration_level"],
  anti_aging: ["wrinkle_depth", "elasticity_loss", "sun_exposure", "collagen_decline", "stress_oxidation"],
};

export const categoryDomains: Record<CategoryId, string[]> = {
  ...clinicalCategoryDomains,
  hairCare: clinicalCategoryDomains.hair_loss,
  skinCare: clinicalCategoryDomains.acne,
  beardCare: clinicalCategoryDomains.beard_growth,
  bodyCare: clinicalCategoryDomains.body_acne,
  healthCare: clinicalCategoryDomains.dark_circles,
  fitness: clinicalCategoryDomains.anti_aging,
  fragrance: clinicalCategoryDomains.lip_care,
};

const S4 = { label: "Severe / Very high", score: 4 };
const S3 = { label: "Moderate", score: 3 };
const S2 = { label: "Mild", score: 2 };
const S1 = { label: "Minimal / Rare", score: 1 };

const clinicalQuestions: Record<ClinicalCategoryId, Question[]> = {
  scalp_health: [
    { id: "scalp_inflammation_symptoms", text: "How often do you notice scalp redness, itching, or burning?", domain: "inflammation", weight: 1.4, options: [S4, S3, S2, S1] },
    { id: "scalp_oil_pattern", text: "How oily does your scalp become within 24 hours after washing?", domain: "sebum_balance", weight: 1.2, options: [{ label: "Very oily", score: 4 }, { label: "Oily by evening", score: 3 }, { label: "Balanced", score: 2 }, { label: "Dry/tight", score: 1 }] },
    { id: "scalp_barrier_reactivity", text: "How reactive is your scalp to new products or weather change?", domain: "barrier_integrity", weight: 1.3, options: [S4, S3, S2, S1] },
    { id: "scalp_shedding_frequency", text: "Compared with your baseline, how much shedding do you notice daily?", domain: "shedding_risk", weight: 1.4, options: [{ label: "Significantly increased", score: 4 }, { label: "Moderately increased", score: 3 }, { label: "Slightly increased", score: 2 }, { label: "Near baseline", score: 1 }] },
    { id: "scalp_stress_correlation", text: "Do flares increase during high-stress periods?", domain: "stress_impact", weight: 1.1, options: [S4, S3, S2, S1] },
    { id: "scalp_sleep_quality", text: "How often does poor sleep precede scalp irritation or shedding?", domain: "sleep_impact", weight: 1.0, options: [S4, S3, S2, S1] },
    { id: "scalp_hygiene_frequency", text: "How would you classify scalp cleansing consistency for your oil/sweat level?", domain: "hygiene_pattern", weight: 1.0, options: [{ label: "Clearly inadequate", score: 4 }, { label: "Somewhat inconsistent", score: 3 }, { label: "Generally adequate", score: 2 }, { label: "Consistently optimized", score: 1 }] },
  ],
  acne: [
    { id: "acne_inflammatory_activity", text: "How many painful red or swollen lesions are active most weeks?", domain: "inflammatory_load", weight: 1.5, options: [S4, S3, S2, S1] },
    { id: "acne_pore_congestion", text: "How frequent are clogged pores/comedones in oily zones?", domain: "pore_clogging", weight: 1.2, options: [S4, S3, S2, S1] },
    { id: "acne_hormonal_pattern", text: "Do breakouts cluster around hormonal phases or jawline/chin pattern?", domain: "hormonal_factor", weight: 1.3, options: [S4, S3, S2, S1] },
    { id: "acne_stress_trigger", text: "How strongly does stress trigger acne flares for you?", domain: "stress_trigger", weight: 1.0, options: [S4, S3, S2, S1] },
    { id: "acne_diet_trigger", text: "How often do high glycemic/dairy-heavy meals precede breakouts?", domain: "diet_trigger", weight: 1.0, options: [S4, S3, S2, S1] },
    { id: "acne_uv_exposure", text: "How high is your unprotected UV exposure?", domain: "sun_damage", weight: 0.9, options: [S4, S3, S2, S1] },
    { id: "acne_post_marks", text: "How prominent are persistent post-acne marks or pigmentation?", domain: "post_acne_marking", weight: 1.1, options: [S4, S3, S2, S1] },
  ],
  dark_circles: [
    { id: "dc_vascular_visibility", text: "How visible are bluish/purple under-eye vessels?", domain: "vascular_factor", weight: 1.3, options: [S4, S3, S2, S1] },
    { id: "dc_pigmentation_depth", text: "How dark is under-eye pigmentation compared to surrounding skin?", domain: "pigmentation", weight: 1.4, options: [S4, S3, S2, S1] },
    { id: "dc_sleep_deprivation", text: "How often are you sleep deprived (<7h restorative sleep)?", domain: "sleep_deprivation", weight: 1.2, options: [S4, S3, S2, S1] },
    { id: "dc_dehydration_status", text: "How often does under-eye area appear dry or crepey by day-end?", domain: "dehydration", weight: 1.0, options: [S4, S3, S2, S1] },
    { id: "dc_stress_load", text: "How high is ongoing psychological stress this month?", domain: "stress_load", weight: 1.0, options: [S4, S3, S2, S1] },
  ],
  hair_loss: [
    { id: "hl_follicle_density", text: "How reduced is overall scalp density from your known baseline?", domain: "follicle_density", weight: 1.5, options: [S4, S3, S2, S1] },
    { id: "hl_recession_pattern", text: "How clear is frontal/temporal recession progression?", domain: "recession_pattern", weight: 1.3, options: [S4, S3, S2, S1] },
    { id: "hl_shedding_rate", text: "How elevated is daily shedding during wash/comb?", domain: "shedding_rate", weight: 1.3, options: [S4, S3, S2, S1] },
    { id: "hl_hormonal_risk", text: "Is there family history or pattern suggesting androgen-related loss?", domain: "hormonal_risk", weight: 1.2, options: [S4, S3, S2, S1] },
    { id: "hl_nutritional_risk", text: "How likely are nutritional gaps affecting recovery (protein/iron/micronutrients)?", domain: "nutritional_risk", weight: 1.0, options: [S4, S3, S2, S1] },
    { id: "hl_stress_factor", text: "How strongly does stress correlate with increased shedding?", domain: "stress_factor", weight: 1.0, options: [S4, S3, S2, S1] },
  ],
  beard_growth: [
    { id: "bg_patchiness_level", text: "How patchy is beard growth distribution?", domain: "patchiness", weight: 1.4, options: [S4, S3, S2, S1] },
    { id: "bg_density_level", text: "How dense is terminal beard growth in target areas?", domain: "density", weight: 1.3, options: [S4, S3, S2, S1] },
    { id: "bg_ingrown_tendency", text: "How often do ingrown hair lesions occur?", domain: "ingrown_risk", weight: 1.1, options: [S4, S3, S2, S1] },
    { id: "bg_irritation_pattern", text: "How frequent is shaving/grooming-related irritation?", domain: "irritation_level", weight: 1.1, options: [S4, S3, S2, S1] },
    { id: "bg_grooming_hygiene", text: "How consistent is beard cleansing, exfoliation, and moisturizer use?", domain: "grooming_pattern", weight: 1.0, options: [S4, S3, S2, S1] },
  ],
  body_acne: [
    { id: "ba_sweat_load", text: "How high is sweat exposure without immediate post-exercise cleansing?", domain: "sweat_load", weight: 1.3, options: [S4, S3, S2, S1] },
    { id: "ba_friction_irritation", text: "How often does tight clothing/backpack friction worsen lesions?", domain: "friction_irritation", weight: 1.1, options: [S4, S3, S2, S1] },
    { id: "ba_bacterial_risk", text: "How frequently do inflamed pustules recur in same zones?", domain: "bacterial_risk", weight: 1.4, options: [S4, S3, S2, S1] },
    { id: "ba_hygiene_pattern", text: "How consistent is shower/laundry routine after sweating?", domain: "hygiene_pattern", weight: 1.0, options: [S4, S3, S2, S1] },
  ],
  lip_care: [
    { id: "lip_dryness_index", text: "How severe is persistent lip dryness, peeling, or cracking?", domain: "dryness_index", weight: 1.4, options: [S4, S3, S2, S1] },
    { id: "lip_pigmentation_depth", text: "How marked is lip pigmentation versus natural baseline?", domain: "pigmentation", weight: 1.2, options: [S4, S3, S2, S1] },
    { id: "lip_uv_exposure", text: "How frequent is unprotected direct sun exposure to lips?", domain: "sun_exposure", weight: 1.0, options: [S4, S3, S2, S1] },
    { id: "lip_hydration_level", text: "How well hydrated do your lips remain through the day?", domain: "hydration_level", weight: 1.0, options: [{ label: "Very poor hydration", score: 4 }, { label: "Inconsistent hydration", score: 3 }, { label: "Mostly stable", score: 2 }, { label: "Well maintained", score: 1 }] },
  ],
  anti_aging: [
    { id: "age_wrinkle_depth", text: "How visible are static fine lines/wrinkles at rest?", domain: "wrinkle_depth", weight: 1.4, options: [S4, S3, S2, S1] },
    { id: "age_elasticity_loss", text: "How much firmness/elastic rebound loss do you notice?", domain: "elasticity_loss", weight: 1.3, options: [S4, S3, S2, S1] },
    { id: "age_uv_burden", text: "How high is cumulative UV burden without strict SPF adherence?", domain: "sun_exposure", weight: 1.1, options: [S4, S3, S2, S1] },
    { id: "age_collagen_decline", text: "How quickly do creases persist after expression changes?", domain: "collagen_decline", weight: 1.2, options: [S4, S3, S2, S1] },
    { id: "age_stress_oxidation", text: "How elevated are stress/lifestyle oxidation contributors currently?", domain: "stress_oxidation", weight: 1.0, options: [S4, S3, S2, S1] },
  ],
};

export const questions: Record<CategoryId, Question[]> = {
  ...clinicalQuestions,
  hairCare: clinicalQuestions.hair_loss,
  skinCare: clinicalQuestions.acne,
  beardCare: clinicalQuestions.beard_growth,
  bodyCare: clinicalQuestions.body_acne,
  healthCare: clinicalQuestions.dark_circles,
  fitness: clinicalQuestions.anti_aging,
  fragrance: clinicalQuestions.lip_care,
};
