export type ClinicalCategoryId =
  | "scalp_health"
  | "acne"
  | "dark_circles"
  | "hair_loss"
  | "beard_growth"
  | "body_acne"
  | "body_odor"
  | "lip_care"
  | "anti_aging"
  | "skin_dullness"
  | "energy_fatigue"
  | "fitness_recovery";

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
    id: "body_odor",
    label: "Body Odor / Sweat",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1400&auto=format&fit=crop",
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
  {
    id: "skin_dullness",
    label: "Skin Dullness",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "energy_fatigue",
    label: "Energy / Fatigue",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "fitness_recovery",
    label: "Fitness / Recovery",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1400&auto=format&fit=crop",
  },
];

const clinicalCategoryDomains: Record<ClinicalCategoryId, string[]> = {
  scalp_health: ["inflammation", "sebum_balance", "barrier_integrity", "shedding_risk", "stress_impact", "sleep_impact", "hygiene_pattern"],
  acne: ["inflammatory_load", "pore_clogging", "hormonal_factor", "stress_trigger", "diet_trigger", "sun_damage", "post_acne_marking"],
  dark_circles: ["vascular_factor", "pigmentation", "sleep_deprivation", "dehydration", "stress_load"],
  hair_loss: ["follicle_density", "recession_pattern", "shedding_rate", "hormonal_risk", "nutritional_risk", "stress_factor"],
  beard_growth: ["patchiness", "density", "ingrown_risk", "irritation_level", "grooming_pattern"],
  body_acne: ["sweat_load", "friction_irritation", "bacterial_risk", "hygiene_pattern"],
  body_odor: ["sweat_volume", "odor_intensity", "fabric_retention", "hygiene_gap", "climate_trigger", "diet_trigger"],
  lip_care: ["dryness_index", "pigmentation", "sun_exposure", "hydration_level"],
  anti_aging: ["wrinkle_depth", "elasticity_loss", "sun_exposure", "collagen_decline", "stress_oxidation"],
  skin_dullness: ["tone_unevenness", "tan_buildup", "texture_roughness", "sleep_stress", "hydration_drop", "pollution_exposure"],
  energy_fatigue: ["sleep_debt", "midday_crash", "hydration_gap", "stress_burden", "meal_quality", "screen_overload"],
  fitness_recovery: ["soreness_load", "recovery_sleep", "protein_intake", "hydration_gap", "training_balance", "injury_risk"],
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
  body_odor: [
    { id: "bo_sweat_volume", text: "How quickly do underarms, chest, or groin become heavily sweaty in a normal Indian day?", domain: "sweat_volume", weight: 1.3, options: [S4, S3, S2, S1] },
    { id: "bo_odor_intensity", text: "How noticeable is body odor by midday even after bathing and deodorant?", domain: "odor_intensity", weight: 1.5, options: [S4, S3, S2, S1] },
    { id: "bo_fabric_retention", text: "How often do shirts or gym clothes hold smell even after one use?", domain: "fabric_retention", weight: 1.1, options: [S4, S3, S2, S1] },
    { id: "bo_hygiene_gap", text: "How often do long commute, workout, or work hours delay a bath or clothes change?", domain: "hygiene_gap", weight: 1.2, options: [S4, S3, S2, S1] },
    { id: "bo_climate_trigger", text: "How strongly do heat, humidity, or helmets/backpacks trigger sweating or odor?", domain: "climate_trigger", weight: 1.0, options: [S4, S3, S2, S1] },
    { id: "bo_diet_trigger", text: "How often do onion-garlic heavy meals, alcohol, or low water intake worsen body smell?", domain: "diet_trigger", weight: 0.9, options: [S4, S3, S2, S1] },
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
  skin_dullness: [
    { id: "sd_tone_unevenness", text: "How uneven or patchy does your face look across forehead, cheeks, and around the mouth?", domain: "tone_unevenness", weight: 1.4, options: [S4, S3, S2, S1] },
    { id: "sd_tan_buildup", text: "How stubborn is tanning from commute, cricket, biking, or outdoor work?", domain: "tan_buildup", weight: 1.2, options: [S4, S3, S2, S1] },
    { id: "sd_texture_roughness", text: "How rough or tired does skin texture feel by evening?", domain: "texture_roughness", weight: 1.1, options: [S4, S3, S2, S1] },
    { id: "sd_sleep_stress", text: "How often do poor sleep or stress make your face look tired or lifeless?", domain: "sleep_stress", weight: 1.0, options: [S4, S3, S2, S1] },
    { id: "sd_hydration_drop", text: "How often does your skin look flat or dehydrated despite using moisturizer?", domain: "hydration_drop", weight: 1.0, options: [S4, S3, S2, S1] },
    { id: "sd_pollution_exposure", text: "How much daily dust, smoke, sweat, or traffic pollution exposure does your skin take?", domain: "pollution_exposure", weight: 1.0, options: [S4, S3, S2, S1] },
  ],
  energy_fatigue: [
    { id: "ef_sleep_debt", text: "How many days each week do you wake up feeling under-recovered or sleepy?", domain: "sleep_debt", weight: 1.4, options: [S4, S3, S2, S1] },
    { id: "ef_midday_crash", text: "How strong is your post-lunch or mid-evening energy crash?", domain: "midday_crash", weight: 1.2, options: [S4, S3, S2, S1] },
    { id: "ef_hydration_gap", text: "How often do you stay below 2 to 2.5 litres of water in a normal day?", domain: "hydration_gap", weight: 1.0, options: [S4, S3, S2, S1] },
    { id: "ef_stress_burden", text: "How much mental load, work pressure, or family stress is draining your energy right now?", domain: "stress_burden", weight: 1.2, options: [S4, S3, S2, S1] },
    { id: "ef_meal_quality", text: "How often do skipped breakfasts, fried snacks, or late dinners leave you heavy or drained?", domain: "meal_quality", weight: 1.0, options: [S4, S3, S2, S1] },
    { id: "ef_screen_overload", text: "How often do late-night screen use and short sleep make the next day harder?", domain: "screen_overload", weight: 0.9, options: [S4, S3, S2, S1] },
  ],
  fitness_recovery: [
    { id: "fr_soreness_load", text: "How often does soreness stay so long that your next session or daily work feels compromised?", domain: "soreness_load", weight: 1.3, options: [S4, S3, S2, S1] },
    { id: "fr_recovery_sleep", text: "How often do poor sleep and late nights affect gym performance or recovery?", domain: "recovery_sleep", weight: 1.2, options: [S4, S3, S2, S1] },
    { id: "fr_protein_intake", text: "How inconsistent is your protein intake across breakfast, lunch, and dinner?", domain: "protein_intake", weight: 1.1, options: [S4, S3, S2, S1] },
    { id: "fr_hydration_gap", text: "How often do you train or play sport without planned water and electrolyte replacement?", domain: "hydration_gap", weight: 1.0, options: [S4, S3, S2, S1] },
    { id: "fr_training_balance", text: "How often do you push hard with no easy day, mobility, or warm-up work?", domain: "training_balance", weight: 1.1, options: [S4, S3, S2, S1] },
    { id: "fr_injury_risk", text: "How often do niggles in knees, shoulders, lower back, or ankles limit your consistency?", domain: "injury_risk", weight: 1.3, options: [S4, S3, S2, S1] },
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
