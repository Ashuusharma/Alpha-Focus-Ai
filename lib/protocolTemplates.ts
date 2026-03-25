import { CategoryId } from "@/lib/questions";
import { pickClinicalDemoProduct } from "@/lib/clinicalProductCatalog";

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

export type ProtocolTask = {
  id: string;
  title?: string;
  label: string;
  slot: "morning" | "night" | "weekly" | "lifestyle";
  frequency: "daily" | "alternate_days" | "weekly";
  howTo?: string;
  why?: string;
  whyItHelps?: string;
  ingredient?: string;
  goal?: string;
  expectedImprovement?: string;
  recommendedProduct?: string;
  reward?: number;
  caution?: string;
  durationMin?: number;
  timeWindow?: { start: string; end: string };
  howToSteps?: string[];
  product?: {
    id: string;
    name: string;
    ingredient: string;
    required: boolean;
  };
  userHasProduct?: boolean;
  fallbackHomeRemedy?: string[];
  unlockCondition?: {
    type: "time" | "dependency";
    value: string;
  };
};

export type ProtocolPhase = {
  name: "Reset" | "Repair" | "Stabilize" | "Stabilization" | "Correction" | "Optimization";
  duration_days: number;
  tasks: ProtocolTask[];
};

export type ProtocolTemplate = {
  category: ClinicalCategoryId;
  phases: ProtocolPhase[];
};

export type ProtocolToleranceMode = "beginner" | "intermediate" | "advanced";

export type ProtocolContraindications = {
  sensitiveSkin?: boolean;
  activeIrritation?: boolean;
  shavedToday?: boolean;
  severeDandruff?: boolean;
};

export type ProtocolGuidanceLanguage = "en" | "hi" | "hinglish";

export type DailyProtocolOptions = {
  toleranceMode?: ProtocolToleranceMode;
  contraindications?: ProtocolContraindications;
  missedYesterday?: boolean;
  guidanceLanguage?: ProtocolGuidanceLanguage;
  completedDaysThisWeek?: number;
  weeklyPhotoDone?: boolean;
};

type GuidedAction = {
  label: string;
  howTo: string;
  whyItHelps: string;
  ingredient?: string;
  goal?: string;
  expectedImprovement?: string;
  product: string;
  durationMin?: number;
  caution?: string;
};

export type DailyProtocolMeta = {
  phaseName: "Reset" | "Repair" | "Stabilize";
  dailyGoal: string;
  expectedResult: string;
};

export type DailyExecutionTask = {
  id: string;
  title: string;
  timeWindow: { start: string; end: string };
  durationMin: number;
  goal: string;
  whyItHelps: string;
  howToSteps: string[];
  product: {
    id: string;
    name: string;
    ingredient: string;
    required: boolean;
  };
  userHasProduct: boolean;
  fallbackHomeRemedy: string[];
  reward: number;
  caution: string;
  unlockCondition: {
    type: "time" | "dependency";
    value: string;
  };
};

export type DailyExecutionPayload = {
  day: number;
  phase: "Reset" | "Repair" | "Stabilize";
  dailyGoal: string;
  expectedOutcome: string;
  tasks: {
    morning: DailyExecutionTask[];
    afternoon: DailyExecutionTask[];
    night: DailyExecutionTask[];
  };
  completionStatus: {
    total: number;
    completed: number;
    pending: number;
  };
  adherenceScore: number;
};

type CategoryGuidance = {
  morning: GuidedAction[];
  night: GuidedAction[];
  lifestyle: GuidedAction[];
  weekly: GuidedAction[];
};

type DailyWindow = { start: string; end: string };

type IndianMealRotation = {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  fruits: string[];
};

type CategoryRecoveryProfile = {
  issueSummary: string;
  commonReasons: string[];
  homeCarePrinciples: string[];
  foodsToPrefer: string[];
  foodsToLimit: string[];
  indianMeals: IndianMealRotation;
  benefitSummary: string;
  whenToEscalate: string[];
};

const LEVEL_DISPLAY: Record<ProtocolToleranceMode, { label: string; description: string }> = {
  beginner: {
    label: "Beginner",
    description: "Lower-friction consistency mode with fewer steps and easier recovery windows.",
  },
  intermediate: {
    label: "Intermediate",
    description: "Balanced 30-day structure with full morning, daytime, and night guidance.",
  },
  advanced: {
    label: "Advanced",
    description: "Higher-accountability mode with tighter timing and stronger adherence checks.",
  },
};

const LEVEL_SLOT_WINDOWS: Record<ProtocolToleranceMode, Record<"morning" | "lifestyle" | "night" | "weekly", DailyWindow>> = {
  beginner: {
    morning: { start: "06:45", end: "09:15" },
    lifestyle: { start: "12:45", end: "15:30" },
    night: { start: "20:15", end: "22:15" },
    weekly: { start: "10:00", end: "20:30" },
  },
  intermediate: {
    morning: { start: "06:15", end: "08:45" },
    lifestyle: { start: "12:30", end: "16:00" },
    night: { start: "20:00", end: "22:30" },
    weekly: { start: "09:00", end: "20:30" },
  },
  advanced: {
    morning: { start: "05:45", end: "08:30" },
    lifestyle: { start: "12:15", end: "16:30" },
    night: { start: "19:45", end: "22:45" },
    weekly: { start: "08:30", end: "20:30" },
  },
};

const CATEGORY_RECOVERY_PROFILES: Record<ClinicalCategoryId, CategoryRecoveryProfile> = {
  acne: {
    issueSummary: "Acne recovery usually improves when excess oil, clogged pores, picking, and irritation are controlled consistently for several weeks.",
    commonReasons: [
      "Excess sebum and clogged follicles create repeated breakouts.",
      "Stress can worsen flare intensity even when it does not directly cause acne.",
      "Picking, harsh scrubbing, and inconsistent sunscreen deepen marks and prolong healing.",
    ],
    homeCarePrinciples: [
      "Keep cleansing gentle and avoid over-washing.",
      "Use non-comedogenic moisturizer and sunscreen daily.",
      "Do not squeeze lesions or layer too many strong actives together.",
    ],
    foodsToPrefer: [
      "Low-glycemic meals built around dal, chana, rajma, oats, or eggs.",
      "Vitamin C fruits like amla, orange, guava, or kiwi.",
      "High-fiber vegetables such as lauki, tinda, bhindi, spinach, and cucumber.",
    ],
    foodsToLimit: [
      "Repeated sugary drinks and dessert-heavy snacking.",
      "Late-night fried fast food if it repeatedly matches flare days.",
      "Any self-identified trigger foods tracked in the app.",
    ],
    indianMeals: {
      breakfast: ["Oats with chia and fruit", "Moong chilla with curd if tolerated", "Egg bhurji with roti and cucumber"],
      lunch: ["Dal, brown rice, salad, and sabzi", "Rajma with mixed salad", "Grilled paneer or chicken with roti and vegetables"],
      dinner: ["Khichdi with veg and curd if tolerated", "Millet roti with palak dal", "Light chicken stew with sauteed vegetables"],
      fruits: ["Guava", "Orange", "Papaya", "Apple"],
    },
    benefitSummary: "This plan aims to reduce new breakouts, calm inflammation, and lower the chance of post-acne marks through consistency rather than over-treatment.",
    whenToEscalate: [
      "Painful nodules, cysts, or scarring are increasing.",
      "No improvement after 8 to 12 weeks of consistent care.",
      "Irritation becomes severe after starting active treatments.",
    ],
  },
  hair_loss: {
    issueSummary: "Hair loss guidance should separate stress-linked shedding from progressive pattern loss and then support scalp health, nutrition, and early treatment review.",
    commonReasons: [
      "Genetic pattern hair loss can progress without early intervention.",
      "Stress, illness, low protein intake, and poor nutrition can increase shedding.",
      "Tight styles, harsh products, and heat damage can worsen breakage and visible thinning.",
    ],
    homeCarePrinciples: [
      "Be consistent with any dermatologist-approved topical rather than changing products too quickly.",
      "Use gentle scalp cleansing and avoid aggressive rubbing.",
      "Track shedding, sleep, protein intake, and stress together.",
    ],
    foodsToPrefer: [
      "Protein-rich meals with eggs, paneer, fish, chicken, tofu, or dal.",
      "Iron-supporting foods such as spinach, lentils, beans, and sesame with citrus.",
      "Nuts and seeds like almonds, walnuts, pumpkin seeds, and flax.",
    ],
    foodsToLimit: [
      "Crash dieting and low-protein meal patterns.",
      "Smoking and frequent dehydration.",
      "Repeated heat styling and tight hairstyles.",
    ],
    indianMeals: {
      breakfast: ["Eggs with multigrain toast", "Besan chilla with paneer", "Greek yogurt bowl with seeds"],
      lunch: ["Palak dal with roti and salad", "Chicken curry with rice and veg", "Rajma chawal with cucumber salad"],
      dinner: ["Paneer bhurji with millet roti", "Fish curry with rice and beans", "Soy or dal khichdi with vegetables"],
      fruits: ["Guava", "Pomegranate", "Orange", "Banana"],
    },
    benefitSummary: "This plan focuses on protecting existing follicles, reducing shedding triggers, and improving adherence to supportive scalp and nutrition habits.",
    whenToEscalate: [
      "Rapid thinning, bald patches, or scalp pain appears.",
      "You suspect a drug, illness, or thyroid issue is involved.",
      "Shedding remains high for several months.",
    ],
  },
  scalp_health: {
    issueSummary: "Scalp recovery usually improves when dandruff, oil, irritation, and scratching are controlled with regular targeted cleansing and barrier-friendly habits.",
    commonReasons: [
      "Dandruff and seborrheic scalp patterns can flare with yeast, oil, and irritation.",
      "Stress and cold weather can worsen flaking and itch.",
      "Heavy styling buildup and scratching weaken scalp comfort and barrier quality.",
    ],
    homeCarePrinciples: [
      "Wash with the correct anti-dandruff active on a steady schedule.",
      "Keep scalp dry after sweating and avoid very hot water.",
      "Do not scratch or pick flakes aggressively.",
    ],
    foodsToPrefer: [
      "Hydrating meals with vegetables, dal, and whole grains.",
      "Omega-support foods like walnuts, flax, and fatty fish when used.",
      "Fruit and fluid intake spread through the day.",
    ],
    foodsToLimit: [
      "Heavy fragranced styling products and thick scalp oils if they worsen flakes.",
      "Very hot showers on flare days.",
      "Skipping wash days after heavy sweating.",
    ],
    indianMeals: {
      breakfast: ["Poha with peanuts and fruit", "Idli with sambar", "Oats upma with seeds"],
      lunch: ["Dal with sabzi and roti", "Curd rice if tolerated and not greasy", "Fish with rice and greens"],
      dinner: ["Vegetable khichdi", "Roti with lauki and dal", "Light chicken and veg soup"],
      fruits: ["Apple", "Papaya", "Orange", "Pear"],
    },
    benefitSummary: "The goal is to reduce flakes, itch, and redness while building a scalp routine that stays comfortable enough to continue.",
    whenToEscalate: [
      "Scalp is very red, swollen, painful, or oozing.",
      "Symptoms persist after one month of anti-dandruff care.",
      "You develop patchy hair loss or rash beyond the scalp.",
    ],
  },
  dark_circles: {
    issueSummary: "Under-eye darkness usually needs sleep quality, hydration, pigmentation control, and rubbing or puffiness triggers managed together.",
    commonReasons: [
      "Sleep loss and screen-heavy nights worsen puffiness and dullness.",
      "Pigmentation, allergies, rubbing, and dehydration can all contribute.",
      "High-salt late dinners can increase morning under-eye puffiness.",
    ],
    homeCarePrinciples: [
      "Protect the under-eye area with sunscreen and gentle products.",
      "Keep bedtime and wake time stable.",
      "Reduce rubbing and track allergy-related symptoms.",
    ],
    foodsToPrefer: [
      "Hydration-focused intake with water, coconut water, and soups if suitable.",
      "Iron and B12-supporting foods like eggs, spinach, beans, and lean meats.",
      "Water-rich fruit such as watermelon, orange, mosambi, and cucumber.",
    ],
    foodsToLimit: [
      "Very salty packaged snacks at night.",
      "Late caffeine close to bedtime.",
      "Nighttime phone use that delays sleep.",
    ],
    indianMeals: {
      breakfast: ["Vegetable omelette with toast", "Moong sprouts chaat", "Daliya with nuts and fruit"],
      lunch: ["Palak dal with rice", "Chicken or paneer with roti and salad", "Chole with salad and curd if tolerated"],
      dinner: ["Light dal soup with roti", "Vegetable pulao with raita if tolerated", "Grilled fish or paneer with vegetables"],
      fruits: ["Mosambi", "Orange", "Watermelon", "Pomegranate"],
    },
    benefitSummary: "The routine is built to improve puffiness control, sleep-linked recovery, and long-term under-eye brightness support.",
    whenToEscalate: [
      "Dark circles are worsening with swelling, pain, or sudden asymmetry.",
      "Chronic allergy symptoms or severe sleep issues remain uncontrolled.",
      "Home care brings no visible change after several weeks.",
    ],
  },
  beard_growth: {
    issueSummary: "Beard progress depends heavily on genetics, but better cleansing, lower irritation, good trimming habits, and steady growth-support routines improve visible density and comfort.",
    commonReasons: [
      "Patchiness can be genetic and slow to change.",
      "Ingrown hairs, close shaving, and dirty tools disrupt healthy growth appearance.",
      "Sleep, protein intake, and hydration affect skin and hair quality under the beard.",
    ],
    homeCarePrinciples: [
      "Keep the beard zone clean and avoid repeated aggressive trimming.",
      "Shave with the grain and reduce friction on ingrown-prone areas.",
      "Treat the skin under the beard, not just the beard hair.",
    ],
    foodsToPrefer: [
      "Protein in each main meal.",
      "Zinc and selenium sources such as seeds, eggs, dal, fish, and nuts.",
      "Hydrating fruits and vegetables for skin quality support.",
    ],
    foodsToLimit: [
      "Against-the-grain shaving when irritation is active.",
      "Dirty trimmers, picking ingrowns, or strong aftershaves.",
      "Skipping moisturizer under a coarse beard.",
    ],
    indianMeals: {
      breakfast: ["Egg bhurji with roti", "Besan chilla with mint chutney", "Sprouts bowl with fruit"],
      lunch: ["Dal, roti, salad, and sabzi", "Chicken with rice and veg", "Paneer tikka bowl with salad"],
      dinner: ["Light khichdi with curd if tolerated", "Fish with vegetables", "Soya chunks with roti and greens"],
      fruits: ["Banana", "Guava", "Apple", "Papaya"],
    },
    benefitSummary: "The aim is to make beard growth look denser, reduce ingrowns, and keep the skin under the beard calm enough for consistent progress.",
    whenToEscalate: [
      "Painful ingrowns, pustules, or dark marks keep recurring.",
      "Severe patchiness is associated with sudden loss elsewhere.",
      "Inflammation persists despite gentler shaving technique.",
    ],
  },
  body_acne: {
    issueSummary: "Body acne recovery improves when sweat, friction, clogged pores, and delayed cleansing after workouts are managed consistently.",
    commonReasons: [
      "Sweat and occlusive clothing trap heat and bacteria on the body.",
      "Tight gym wear, backpacks, and repeated friction worsen inflamed follicles.",
      "Delayed showers and reusing gear increase flare risk.",
    ],
    homeCarePrinciples: [
      "Shower soon after sweating.",
      "Use breathable fabrics and clean workout gear.",
      "Avoid squeezing body lesions to reduce marks.",
    ],
    foodsToPrefer: [
      "Whole-food meals with fiber, vegetables, and steady hydration.",
      "Balanced protein intake across the day.",
      "Fruit-based snacks instead of sugary packaged snacks.",
    ],
    foodsToLimit: [
      "Lingering in sweaty clothes after training.",
      "Heavy oily body products on acne-prone zones.",
      "Repeated high-sugar snacking if it aligns with flares.",
    ],
    indianMeals: {
      breakfast: ["Upma with vegetables", "Egg wrap with salad", "Daliya with seeds"],
      lunch: ["Rajma chawal with salad", "Grilled chicken with roti and veg", "Dal with rice and cucumber"],
      dinner: ["Vegetable soup with paneer", "Roti with mixed veg and dal", "Fish with rice and sauteed beans"],
      fruits: ["Apple", "Orange", "Papaya", "Pear"],
    },
    benefitSummary: "The routine aims to reduce body breakouts, lower friction-related flares, and build a repeatable gym-to-shower recovery habit.",
    whenToEscalate: [
      "Painful boils, fever, or rapidly worsening lesions appear.",
      "Large dark marks or scarring are increasing.",
      "Truncal acne remains uncontrolled despite consistent wash and clothing changes.",
    ],
  },
  body_odor: {
    issueSummary: "Body odor recovery improves when sweat control, fast cleanup, breathable fabrics, and diet-linked trigger awareness are handled together.",
    commonReasons: [
      "Heavy sweating, delayed showers, and repeat wear of damp clothes intensify odor.",
      "Indian heat, commute, helmets, and backpacks trap sweat in friction-heavy zones.",
      "Low hydration, spicy-heavy meals, and poor underarm care can worsen smell intensity for some users.",
    ],
    homeCarePrinciples: [
      "Clean and dry sweat-prone zones quickly after commute, gym, or outdoor time.",
      "Use breathable fabrics and rotate shirts, socks, towels, and innerwear aggressively.",
      "Keep underarms fully dry before applying anti-perspirant or deodorant.",
    ],
    foodsToPrefer: [
      "Hydrating foods and steady water intake across the day.",
      "Simple meals with curd if tolerated, fruit, dal, and lighter lunch portions on hot days.",
      "Fresh herbs, cucumber, citrus, and less processed snacks when odor flares are strong.",
    ],
    foodsToLimit: [
      "Repeated dehydration during work, travel, or sport.",
      "Reusing sweaty gym or commute clothes.",
      "Any recurring meal pattern that clearly worsens smell for the user.",
    ],
    indianMeals: {
      breakfast: ["Curd + fruit bowl if tolerated", "Vegetable poha with lemon", "Eggs with cucumber and roti"],
      lunch: ["Dal, rice, cucumber salad", "Grilled paneer bowl with vegetables", "Roti with lauki and curd if tolerated"],
      dinner: ["Light khichdi with salad", "Chicken and veg soup", "Moong dal chilla with mint chutney"],
      fruits: ["Mosambi", "Watermelon", "Apple", "Pear"],
    },
    benefitSummary: "The goal is to reduce odor rebound, feel fresher through the day, and build a low-friction routine that survives Indian heat and busy schedules.",
    whenToEscalate: [
      "Body odor changes suddenly, feels medically unusual, or comes with rash or pain.",
      "Sweating is excessive enough to disrupt work or confidence despite routine control.",
      "There is persistent underarm irritation from all deodorant or antiperspirant options.",
    ],
  },
  lip_care: {
    issueSummary: "Lip recovery depends on repairing the barrier, stopping lip licking, protecting from sun, and removing irritant products and habits.",
    commonReasons: [
      "Lip licking drives repeated drying and cracking.",
      "Sun exposure and irritating flavors or toothpaste can worsen symptoms.",
      "Low fluid intake and very spicy or acidic foods may sting cracked lips.",
    ],
    homeCarePrinciples: [
      "Use bland fragrance-free balm frequently and a thicker layer at night.",
      "Protect with SPF lip balm outdoors.",
      "Do not peel flakes manually.",
    ],
    foodsToPrefer: [
      "Steady hydration throughout the day.",
      "Soft fruit and water-rich foods such as cucumber, melon, orange, and pear.",
      "Balanced meals that reduce dehydration from long gaps without water.",
    ],
    foodsToLimit: [
      "Lip licking or chewing.",
      "Strong mint, cinnamon, or fragranced lip products.",
      "Very spicy or acidic foods when lips are cracked and sore.",
    ],
    indianMeals: {
      breakfast: ["Fruit and oats bowl", "Idli and coconut chutney", "Poha with fruit"],
      lunch: ["Dal with rice and cucumber", "Curd rice if tolerated", "Veg khichdi with ghee"],
      dinner: ["Soft roti with dal", "Light vegetable soup", "Paneer and rice bowl"],
      fruits: ["Pear", "Papaya", "Watermelon", "Mosambi"],
    },
    benefitSummary: "The plan supports softer lips, fewer cracks, and lower pigmentation stress from sun and irritation.",
    whenToEscalate: [
      "Cracks bleed often or involve the mouth corners repeatedly.",
      "Pain, swelling, or rash continues despite bland barrier care.",
      "Pigmentation change is new and persistent.",
    ],
  },
  anti_aging: {
    issueSummary: "Healthy aging support relies on sun protection, gentle cleansing, steady hydration, adequate sleep, and gradual evidence-based active use.",
    commonReasons: [
      "Sun exposure is one of the biggest visible aging drivers.",
      "Smoking and poor sleep worsen wrinkles and dullness.",
      "Dryness and inconsistent care make texture and lines look worse.",
    ],
    homeCarePrinciples: [
      "Protect from sun every day and avoid tanning habits.",
      "Introduce retinoids gradually instead of chasing fast results.",
      "Support recovery with moisturizer, sleep, and low-friction habits.",
    ],
    foodsToPrefer: [
      "Protein plus colorful vegetables in major meals.",
      "Vitamin C fruit and omega-rich foods.",
      "Adequate daily fluids and lower alcohol exposure.",
    ],
    foodsToLimit: [
      "Smoking and regular tanning.",
      "Frequent dehydration and very poor sleep.",
      "Over-exfoliation and too many new actives at once.",
    ],
    indianMeals: {
      breakfast: ["Oats with fruit and nuts", "Eggs with toast and salad", "Moong chilla with veg"],
      lunch: ["Dal, sabzi, roti, and salad", "Fish curry with rice", "Paneer bowl with vegetables"],
      dinner: ["Light soup with protein", "Khichdi with vegetables", "Chicken or paneer with greens"],
      fruits: ["Orange", "Kiwi", "Papaya", "Pomegranate"],
    },
    benefitSummary: "This program is built to protect current skin quality, improve texture gradually, and reduce rebound irritation from overdoing treatments.",
    whenToEscalate: [
      "Persistent irritation follows active products even after slower use.",
      "Pigmented lesions or non-healing spots are changing in appearance.",
      "You want prescription-strength anti-aging treatment planning.",
    ],
  },
  skin_dullness: {
    issueSummary: "Skin dullness usually improves when sun exposure, pollution load, dehydration, rough texture, and poor sleep are corrected together instead of with harsh scrubbing.",
    commonReasons: [
      "Daily commute, dust, and UV exposure increase tan and dull tone.",
      "Late nights, dehydration, and low-protein or low-fruit diets make skin look flat and tired.",
      "Over-exfoliation can make skin look worse by weakening barrier comfort.",
    ],
    homeCarePrinciples: [
      "Prioritize sunscreen and brightening before adding stronger exfoliation.",
      "Keep skin hydrated and avoid rough scrubbing tools.",
      "Track sleep, water intake, and outdoor exposure with the routine.",
    ],
    foodsToPrefer: [
      "Vitamin C fruit like orange, guava, kiwi, or amla.",
      "Colorful vegetables, dal, eggs, paneer, and lighter home meals.",
      "Water, coconut water, and fruit-based snacks over fried tea-time snacks.",
    ],
    foodsToLimit: [
      "Repeated tanning without sunscreen or cap use.",
      "Very sugary or greasy late-night meals if skin looks puffy or flat the next day.",
      "Harsh DIY scrubs on already tired skin.",
    ],
    indianMeals: {
      breakfast: ["Oats with fruit and seeds", "Moong chilla with coriander chutney", "Egg bhurji with salad"],
      lunch: ["Dal, roti, sabzi, and salad", "Paneer bowl with rice and vegetables", "Chicken with roti and cucumber"],
      dinner: ["Light khichdi with vegetables", "Grilled fish or paneer with greens", "Soup plus millet roti"],
      fruits: ["Orange", "Guava", "Papaya", "Kiwi"],
    },
    benefitSummary: "This plan is designed to bring back visible freshness, reduce tan load, and improve texture without pushing users into irritation-heavy routines.",
    whenToEscalate: [
      "Sudden dark patches, persistent pigmentation, or irritation are increasing.",
      "No visible change after consistent sunscreen and brightening care for 8 weeks.",
      "The user wants dermatology-level pigmentation planning.",
    ],
  },
  energy_fatigue: {
    issueSummary: "Energy recovery improves most when sleep debt, hydration gaps, poor meal timing, and screen-heavy nights are corrected with simple daily anchors.",
    commonReasons: [
      "Late nights, poor sleep quality, and irregular wake times drain next-day energy.",
      "Long work blocks, low hydration, and skipped breakfasts create repeated crashes.",
      "Stress load and poor recovery habits can show up as fatigue and tired-looking face signals.",
    ],
    homeCarePrinciples: [
      "Anchor wake-up time, water intake, and breakfast quality first.",
      "Reduce late-night screens and heavy dinners.",
      "Keep the plan realistic enough for office, commute, and family schedules.",
    ],
    foodsToPrefer: [
      "Protein-first breakfasts like eggs, paneer, sprouts, or dal chilla.",
      "Balanced lunches with dal, roti, sabzi, and salad instead of only refined carbs.",
      "Hydration with water, lemon water, buttermilk if tolerated, or coconut water on hot days.",
    ],
    foodsToLimit: [
      "Skipping breakfast and then overeating fried snacks later.",
      "High-sugar tea, cold drinks, or energy drinks as the main fix for crashes.",
      "Heavy late-night dinners right before sleep.",
    ],
    indianMeals: {
      breakfast: ["Eggs with toast and fruit", "Sprouts chaat with nimbu", "Besan chilla with paneer"],
      lunch: ["Dal, roti, sabzi, and curd if tolerated", "Chicken rice bowl with cucumber", "Rajma chawal with salad"],
      dinner: ["Light dal soup with roti", "Khichdi with vegetables", "Paneer and veg bowl"],
      fruits: ["Banana", "Orange", "Apple", "Pomegranate"],
    },
    benefitSummary: "The routine aims to reduce tiredness, improve steadier energy, and make daily discipline feel easier rather than heavier.",
    whenToEscalate: [
      "Fatigue is persistent, unexplained, or affecting normal function despite good sleep.",
      "The user has breathlessness, palpitations, or other concerning symptoms.",
      "Energy remains very poor after several weeks of sleep and hydration correction.",
    ],
  },
  fitness_recovery: {
    issueSummary: "Fitness recovery improves when protein timing, hydration, sleep, mobility, and training balance are handled as a system instead of random effort.",
    commonReasons: [
      "Hard training with poor sleep and low protein slows recovery.",
      "Indian summer heat and sweat loss increase electrolyte and hydration gaps.",
      "Skipping warm-ups, cooldowns, and easy days raises soreness and injury risk.",
    ],
    homeCarePrinciples: [
      "Protect sleep and post-workout nutrition before buying more supplements.",
      "Warm up before sessions and cool down after.",
      "Use mobility and lower-intensity days to keep long-term consistency high.",
    ],
    foodsToPrefer: [
      "Protein at each major meal from eggs, paneer, chicken, fish, soy, or dal.",
      "Electrolyte-aware hydration around workouts.",
      "Rice, roti, fruit, curd if tolerated, and dal around training for better recovery support.",
    ],
    foodsToLimit: [
      "Training hard on empty stomach plus poor hydration.",
      "Very low-protein days repeated across the week.",
      "Ignoring niggles until they become full setbacks.",
    ],
    indianMeals: {
      breakfast: ["Egg and toast combo", "Paneer wrap", "Oats with whey or curd if tolerated"],
      lunch: ["Chicken and rice with vegetables", "Dal, rice, and paneer", "Fish curry with rice and salad"],
      dinner: ["Paneer bhurji with roti", "Dal khichdi with eggs", "Chicken soup with rice"],
      fruits: ["Banana", "Orange", "Watermelon", "Pomegranate"],
    },
    benefitSummary: "The plan is built to reduce soreness spillover, improve gym consistency, and protect users from avoidable recovery mistakes.",
    whenToEscalate: [
      "Pain is sharp, localized, or worsening instead of improving.",
      "The user has repeated injury flare-ups or cannot recover between sessions.",
      "Fatigue and soreness stay severe despite reducing load and improving recovery habits.",
    ],
  },
};

const protocolTemplates: Record<ClinicalCategoryId, ProtocolTemplate> = {
  acne: {
    category: "acne",
    phases: [
      { name: "Reset", duration_days: 7, tasks: [] },
      { name: "Repair", duration_days: 7, tasks: [] },
      { name: "Stabilize", duration_days: 16, tasks: [] },
    ],
  },
  hair_loss: {
    category: "hair_loss",
    phases: [
      { name: "Reset", duration_days: 7, tasks: [] },
      { name: "Repair", duration_days: 7, tasks: [] },
      { name: "Stabilize", duration_days: 16, tasks: [] },
    ],
  },
  scalp_health: {
    category: "scalp_health",
    phases: [
      { name: "Reset", duration_days: 7, tasks: [] },
      { name: "Repair", duration_days: 7, tasks: [] },
      { name: "Stabilize", duration_days: 16, tasks: [] },
    ],
  },
  dark_circles: {
    category: "dark_circles",
    phases: [
      { name: "Reset", duration_days: 7, tasks: [] },
      { name: "Repair", duration_days: 7, tasks: [] },
      { name: "Stabilize", duration_days: 16, tasks: [] },
    ],
  },
  beard_growth: {
    category: "beard_growth",
    phases: [
      { name: "Reset", duration_days: 7, tasks: [] },
      { name: "Repair", duration_days: 7, tasks: [] },
      { name: "Stabilize", duration_days: 16, tasks: [] },
    ],
  },
  body_acne: {
    category: "body_acne",
    phases: [
      { name: "Reset", duration_days: 7, tasks: [] },
      { name: "Repair", duration_days: 7, tasks: [] },
      { name: "Stabilize", duration_days: 16, tasks: [] },
    ],
  },
  body_odor: {
    category: "body_odor",
    phases: [
      { name: "Reset", duration_days: 7, tasks: [] },
      { name: "Repair", duration_days: 7, tasks: [] },
      { name: "Stabilize", duration_days: 16, tasks: [] },
    ],
  },
  lip_care: {
    category: "lip_care",
    phases: [
      { name: "Reset", duration_days: 7, tasks: [] },
      { name: "Repair", duration_days: 7, tasks: [] },
      { name: "Stabilize", duration_days: 16, tasks: [] },
    ],
  },
  anti_aging: {
    category: "anti_aging",
    phases: [
      { name: "Reset", duration_days: 7, tasks: [] },
      { name: "Repair", duration_days: 7, tasks: [] },
      { name: "Stabilize", duration_days: 16, tasks: [] },
    ],
  },
  skin_dullness: {
    category: "skin_dullness",
    phases: [
      { name: "Reset", duration_days: 7, tasks: [] },
      { name: "Repair", duration_days: 7, tasks: [] },
      { name: "Stabilize", duration_days: 16, tasks: [] },
    ],
  },
  energy_fatigue: {
    category: "energy_fatigue",
    phases: [
      { name: "Reset", duration_days: 7, tasks: [] },
      { name: "Repair", duration_days: 7, tasks: [] },
      { name: "Stabilize", duration_days: 16, tasks: [] },
    ],
  },
  fitness_recovery: {
    category: "fitness_recovery",
    phases: [
      { name: "Reset", duration_days: 7, tasks: [] },
      { name: "Repair", duration_days: 7, tasks: [] },
      { name: "Stabilize", duration_days: 16, tasks: [] },
    ],
  },
};

const DAY_FOCUS: string[] = [
  "Build your baseline and stay consistent",
  "Protect barrier and reduce irritation triggers",
  "Hydration lock and inflammation control",
  "Gentle correction with zero over-exfoliation",
  "Daily rhythm reinforcement",
  "Sleep and stress alignment",
  "Weekly checkpoint and reset",
  "Start correction block with controlled actives",
  "Target stubborn symptom zones",
  "Texture and tone balancing",
  "Adherence over intensity",
  "Midweek anti-relapse habits",
  "Repair + protect pairing",
  "Weekly review with photo comparison",
  "Refine dosage and cadence safely",
  "Boost circulation and nutrient support",
  "Lower trigger exposure",
  "Precision application day",
  "Consistency audit and correction",
  "Barrier-first progression",
  "Weekly checkpoint and confidence build",
  "Optimization block kickoff",
  "Maintain gains with minimal routine",
  "Fine-tune weak points",
  "Lifestyle compounding day",
  "Prevent rebound and over-treatment",
  "Sustainability check",
  "Weekly reset and maintenance proof",
  "Prepare long-term routine",
  "Final review and next-30-day plan",
];

const DAY_EXPECTED_OUTCOME: string[] = [
  "Visible reduction in irritation triggers.",
  "Better hydration comfort by evening.",
  "Lower morning puffiness/redness intensity.",
  "Improved tolerance to routine steps.",
  "More stable AM-to-PM symptom pattern.",
  "Lower stress-linked flare tendency.",
  "Week 1 checkpoint with measurable shift.",
  "Correction starts with controlled active response.",
  "Targeted symptom zones show improvement.",
  "Texture/tone starts stabilizing.",
  "Fewer reactive symptom spikes.",
  "Higher adherence confidence.",
  "Barrier resilience improves.",
  "Week 2 trend becomes clearer.",
  "Better dosage/cadence balance.",
  "Circulation and recovery support improve.",
  "Lower day-to-day volatility.",
  "Sharper precision in execution.",
  "Better consistency under real schedule.",
  "Sustained correction with less irritation.",
  "Week 3 checkpoint confirms direction.",
  "Stabilization with lower effort.",
  "Reduced rebound risk.",
  "Weakest area receives focused support.",
  "Lifestyle compounding becomes visible.",
  "Maintenance-level control increases.",
  "Confidence improves through repeatable wins.",
  "Week 4 review secures consistency.",
  "Long-term routine readiness.",
  "30-day result ready for maintenance handoff.",
];

function inferIngredient(action: GuidedAction) {
  if (action.ingredient) return action.ingredient;
  const hay = `${action.label} ${action.product}`.toLowerCase();
  if (hay.includes("caffeine")) return "Caffeine";
  if (hay.includes("niacinamide")) return "Niacinamide";
  if (hay.includes("salicylic") || hay.includes("bha")) return "Salicylic Acid (BHA)";
  if (hay.includes("retinoid") || hay.includes("retinol")) return "Retinoid";
  if (hay.includes("ketoconazole")) return "Ketoconazole";
  if (hay.includes("ceramide")) return "Ceramides";
  if (hay.includes("peptide")) return "Peptides";
  if (hay.includes("spf")) return "UV Filters";
  if (hay.includes("castor")) return "Castor Oil";
  if (hay.includes("tea tree")) return "Tea Tree";
  return "Targeted active blend";
}

const CATEGORY_GUIDANCE: Record<ClinicalCategoryId, CategoryGuidance> = {
  acne: {
    morning: [
      { label: "Gentle cleanse + pat dry", howTo: "Use a mild gel cleanser for 30 seconds, rinse with lukewarm water, then pat dry with a clean towel.", whyItHelps: "Removes overnight oil without stripping barrier, reducing reactive breakouts.", product: "Low-foam pH-balanced gel cleanser", durationMin: 3 },
      { label: "Niacinamide balancing layer", howTo: "Apply 2-3 drops on dry skin, wait 60 seconds before next step.", whyItHelps: "Supports oil balance and reduces redness from inflammatory lesions.", product: "Niacinamide 5-10% serum", durationMin: 2 },
      { label: "Non-comedogenic SPF shield", howTo: "Use two-finger amount on face and neck, reapply at noon if outdoors.", whyItHelps: "Prevents post-acne marks from deepening and protects healing skin.", product: "Oil-free SPF 50 PA++++", durationMin: 2 },
      { label: "Spot-safe hydration", howTo: "Use a thin moisturizer layer only where skin feels tight.", whyItHelps: "Maintains barrier so active ingredients work with less irritation.", product: "Ceramide light moisturizer", durationMin: 2 },
    ],
    night: [
      { label: "Salicylic control night", howTo: "Apply a thin BHA layer on acne-prone zones on alternate nights.", whyItHelps: "Keeps pores clear and reduces new inflammatory bumps.", product: "Salicylic acid 1-2% leave-on", durationMin: 3, caution: "Skip on irritated or peeling skin." },
      { label: "Retinoid adaptation night", howTo: "Use pea-size retinoid over moisturized skin, avoid eye corners.", whyItHelps: "Improves cell turnover and helps prevent recurring clogged pores.", product: "Beginner retinoid 0.1-0.3%", durationMin: 4, caution: "Start 2-3 nights per week only." },
      { label: "Barrier repair seal", howTo: "Finish with a calming moisturizer after active step.", whyItHelps: "Reduces dryness-driven inflammation and supports overnight recovery.", product: "Ceramide + panthenol cream", durationMin: 2 },
      { label: "Hands-off healing", howTo: "Keep hands away from active lesions and use pimple patch if needed.", whyItHelps: "Prevents scar risk and bacterial spread from picking.", product: "Hydrocolloid patches", durationMin: 2 },
    ],
    lifestyle: [
      { label: "Trigger food log", howTo: "Note high-glycemic meals and dairy-heavy meals today in one line.", whyItHelps: "Helps identify diet triggers tied to breakouts.", product: "Phone notes tracker", durationMin: 4 },
      { label: "Pillowcase and phone hygiene", howTo: "Use fresh pillow side and clean phone screen before bed.", whyItHelps: "Lowers bacteria and oil transfer to acne-prone skin.", product: "Alcohol-free wipe", durationMin: 3 },
      { label: "Sweat-to-shower rule", howTo: "Shower within 20-30 minutes after sweating.", whyItHelps: "Prevents sweat, bacteria, and friction from worsening lesions.", product: "Mild body/face cleanser", durationMin: 5 },
      { label: "Sleep recovery target", howTo: "Aim lights-off by fixed time to hit 7-8 hour sleep.", whyItHelps: "Stable sleep reduces stress hormones linked with acne flares.", product: "Sleep reminder alarm", durationMin: 5 },
    ],
    weekly: [
      { label: "Acne progress photo", howTo: "Capture front/left/right photos in same light before routine.", whyItHelps: "Visual progress improves confidence and plan accuracy.", product: "Phone camera", durationMin: 8 },
      { label: "Product irritation audit", howTo: "List any stinging, redness, or scaling from this week.", whyItHelps: "Prevents over-treatment by adjusting cadence early.", product: "Routine tracker", durationMin: 8 },
    ],
  },
  dark_circles: {
    morning: [
      { label: "Cold compress wake-up", howTo: "Apply cool compress for 2-3 minutes under eyes.", whyItHelps: "Reduces morning puffiness and vascular pooling.", product: "Chilled eye pad", durationMin: 3 },
      { label: "Caffeine eye serum", howTo: "Tap a rice-grain amount from inner to outer under-eye.", whyItHelps: "Supports microcirculation and reduces dull under-eye appearance.", product: "Caffeine + peptide eye serum", durationMin: 2 },
      { label: "Orbital SPF protection", howTo: "Apply sunscreen around orbital bone gently, avoid lash line.", whyItHelps: "Prevents UV-driven pigmentation deepening.", product: "Mineral SPF 50", durationMin: 2 },
      { label: "Hydration top-up", howTo: "Drink 400-500 ml water before noon.", whyItHelps: "Hydration improves under-eye skin turgor and texture.", product: "Water bottle target", durationMin: 2 },
    ],
    night: [
      { label: "Retinoid eye support night", howTo: "Apply tiny amount around orbital bone on alternate nights.", whyItHelps: "Supports collagen and smoothness over time.", product: "Low-strength retinoid eye cream", durationMin: 3, caution: "Avoid if stinging persists." },
      { label: "Barrier eye repair", howTo: "Layer ceramide eye cream after active step.", whyItHelps: "Prevents dryness lines and irritation.", product: "Ceramide eye cream", durationMin: 2 },
      { label: "Blue-light cutoff", howTo: "Stop phone scrolling 45 minutes before sleep.", whyItHelps: "Improves sleep quality and reduces eye strain fatigue look.", product: "Screen-time limit", durationMin: 2 },
      { label: "Head-elevated sleep setup", howTo: "Use slight head elevation pillow setup tonight.", whyItHelps: "Helps fluid drainage, reducing morning puffiness.", product: "Support pillow", durationMin: 2 },
    ],
    lifestyle: [
      { label: "Sleep timing lock", howTo: "Keep sleep and wake times within 30-minute window.", whyItHelps: "Circadian stability visibly improves under-eye recovery.", product: "Sleep schedule", durationMin: 4 },
      { label: "Sodium moderation day", howTo: "Reduce salty dinner and packaged snacks today.", whyItHelps: "Lowers water retention-related puffiness.", product: "Low-sodium meal swap", durationMin: 4 },
      { label: "Allergy trigger check", howTo: "Track sneezing/rubbing episodes and avoid trigger exposure.", whyItHelps: "Reduces rubbing-induced pigmentation.", product: "Allergy-safe routine", durationMin: 4 },
      { label: "2-minute de-stress breath", howTo: "Do slow nasal breathing before sleep.", whyItHelps: "Lowers stress burden that worsens poor sleep quality.", product: "Breathing timer", durationMin: 3 },
    ],
    weekly: [
      { label: "Under-eye comparison photos", howTo: "Take same-angle photo under similar daylight.", whyItHelps: "Shows realistic improvement and builds adherence confidence.", product: "Phone camera", durationMin: 7 },
      { label: "Sleep quality review", howTo: "Review 7-day sleep consistency and adjust bedtime.", whyItHelps: "Sleep correction is a major driver for under-eye recovery.", product: "Sleep log", durationMin: 8 },
    ],
  },
  hair_loss: {
    morning: [
      { label: "Scalp stimulation massage", howTo: "Massage scalp with fingertips in circular motion for 4-5 minutes.", whyItHelps: "Supports blood flow and consistency around follicles.", product: "Clean fingertips or massager", durationMin: 5 },
      { label: "Primary growth topical", howTo: "Apply prescribed/selected growth topical to dry scalp partitions.", whyItHelps: "Consistent application drives cumulative follicle response.", product: "Clinically suitable growth topical", durationMin: 4 },
      { label: "Protein-rich breakfast anchor", howTo: "Add one high-protein component in breakfast.", whyItHelps: "Hair shaft quality depends on sustained nutrition support.", product: "Egg/paneer/dal option", durationMin: 3 },
      { label: "Sun and sweat scalp care", howTo: "Protect scalp from prolonged heat and cleanse post-heavy sweat.", whyItHelps: "Reduces inflammation and scalp stress.", product: "Breathable cap + mild shampoo", durationMin: 3 },
    ],
    night: [
      { label: "Anti-buildup cleanse cadence", howTo: "Use gentle scalp cleanse on scheduled nights and rinse thoroughly.", whyItHelps: "Removes buildup that can impair follicle environment.", product: "pH-balanced scalp shampoo", durationMin: 6 },
      { label: "Calming scalp serum", howTo: "Apply soothing serum on itchy/inflamed patches before sleep.", whyItHelps: "Less inflammation improves comfort and routine adherence.", product: "Scalp soothing serum", durationMin: 3 },
      { label: "Tension release routine", howTo: "Do neck and shoulder relaxation for 3 minutes.", whyItHelps: "Stress and tension management supports hair recovery behavior.", product: "Breath + stretch", durationMin: 3 },
      { label: "Silk-safe sleep setup", howTo: "Use low-friction pillow cover and avoid tight hairstyles.", whyItHelps: "Reduces mechanical breakage overnight.", product: "Low-friction pillow cover", durationMin: 2 },
    ],
    lifestyle: [
      { label: "Iron and protein check", howTo: "Include one iron-supporting and one protein source today.", whyItHelps: "Addresses common nutrition-linked shedding drivers.", product: "Balanced meal plan", durationMin: 5 },
      { label: "Stress score log", howTo: "Log stress score out of 10 and one reduction action.", whyItHelps: "Lower stress helps reduce stress-induced shedding cycles.", product: "Quick note template", durationMin: 3 },
      { label: "Hydration consistency", howTo: "Target 2.5-3L water spread through day.", whyItHelps: "Supports scalp barrier and overall recovery.", product: "Hydration tracker", durationMin: 3 },
      { label: "No harsh heat styling", howTo: "Skip high-heat tools or keep at lowest effective setting.", whyItHelps: "Prevents shaft damage while follicles recover.", product: "Low-heat setting", durationMin: 2 },
    ],
    weekly: [
      { label: "Part-line density photo", howTo: "Take crown, hairline, and side partition photos in same light.", whyItHelps: "Tracks true progress and sets realistic confidence milestones.", product: "Phone camera", durationMin: 10 },
      { label: "Routine adherence review", howTo: "Mark days missed and remove friction causing misses.", whyItHelps: "Adherence quality predicts long-term hair outcomes.", product: "Checklist sheet", durationMin: 8 },
    ],
  },
  scalp_health: {
    morning: [
      { label: "Targeted scalp cleanse", howTo: "Shampoo scalp (not hair lengths) with gentle massage for 60 seconds.", whyItHelps: "Controls oil and flakes while preserving scalp barrier.", product: "pH-balanced anti-dandruff cleanser", durationMin: 5 },
      { label: "Post-wash dry scalp care", howTo: "Air dry or cool-dry scalp fully before styling.", whyItHelps: "Reduces fungal-friendly damp scalp environment.", product: "Cool dryer mode", durationMin: 3 },
      { label: "Scalp comfort check", howTo: "Rate itch/flakes 0-10 each morning.", whyItHelps: "Daily tracking helps optimize wash cadence.", product: "Scalp score note", durationMin: 2 },
      { label: "Sun and sweat shield", howTo: "Use breathable cap in high sun and cleanse after heavy sweating.", whyItHelps: "Prevents irritation and micro-inflammation buildup.", product: "Breathable cap", durationMin: 2 },
    ],
    night: [
      { label: "Anti-inflammatory tonic", howTo: "Apply scalp tonic along partitions with gentle tapping.", whyItHelps: "Calms redness and improves overnight comfort.", product: "Scalp calming tonic", durationMin: 3 },
      { label: "No-scratch protocol", howTo: "Use fingertip pressure instead of scratching itchy spots.", whyItHelps: "Prevents barrier breaks and secondary irritation.", product: "Cold compress backup", durationMin: 2 },
      { label: "Buildup prevention night", howTo: "Avoid heavy oil and thick wax products on scalp.", whyItHelps: "Lowers congestion and flake recurrence.", product: "Lightweight styling alternative", durationMin: 2 },
      { label: "Pillow hygiene rotation", howTo: "Rotate to clean pillow side before sleep.", whyItHelps: "Reduces scalp irritation from residue transfer.", product: "Fresh pillowcase", durationMin: 2 },
    ],
    lifestyle: [
      { label: "Hot-water avoid day", howTo: "Use lukewarm water only for scalp wash.", whyItHelps: "Hot water strips scalp lipids and worsens sensitivity.", product: "Lukewarm rinse", durationMin: 2 },
      { label: "Trigger product audit", howTo: "Pause fragranced styling products for 24 hours.", whyItHelps: "Identifies irritation contributors quickly.", product: "Fragrance-free products", durationMin: 3 },
      { label: "Stress and sweat management", howTo: "Short walk plus immediate sweat cleanup.", whyItHelps: "Helps reduce flare-prone scalp inflammation.", product: "Post-workout rinse rule", durationMin: 5 },
      { label: "Hydration and omega support", howTo: "Add hydration and one omega-rich food today.", whyItHelps: "Supports skin barrier quality including scalp.", product: "Nuts/fatty fish/flax", durationMin: 3 },
    ],
    weekly: [
      { label: "Flake and itch review", howTo: "Compare scalp score trend from week start to today.", whyItHelps: "Objective trend tracking improves routine confidence.", product: "Scalp tracker", durationMin: 7 },
      { label: "Tool sanitization reset", howTo: "Clean combs/brushes and avoid sharing hair tools.", whyItHelps: "Lowers contamination and irritation load.", product: "Mild cleanser", durationMin: 8 },
    ],
  },
  beard_growth: {
    morning: [
      { label: "Beard zone cleanse", howTo: "Clean beard area with mild cleanser and pat dry.", whyItHelps: "Prevents follicle blockage and ingrown-prone buildup.", product: "Gentle face wash", durationMin: 3 },
      { label: "Follicle stimulation massage", howTo: "Massage patchy zones for 3-4 minutes.", whyItHelps: "Supports local circulation and grooming adherence.", product: "Clean fingers", durationMin: 4 },
      { label: "Growth support topical", howTo: "Apply growth-support product evenly to target areas.", whyItHelps: "Consistent topical routine improves visible density over time.", product: "Beard growth serum", durationMin: 3 },
      { label: "Patch direction grooming", howTo: "Brush along natural growth direction only.", whyItHelps: "Reduces breakage and trains beard shape cleanly.", product: "Soft beard brush", durationMin: 2 },
    ],
    night: [
      { label: "Nourishing beard oil", howTo: "Apply 2-3 drops and massage to skin below beard.", whyItHelps: "Supports skin health where follicles grow.", product: "Non-comedogenic beard oil", durationMin: 3 },
      { label: "Anti-ingrown care", howTo: "Use a gentle exfoliating wipe 2-3 nights/week.", whyItHelps: "Keeps follicle openings clear for healthier growth path.", product: "PHA/BHA mild pad", durationMin: 3 },
      { label: "Irritation calm-down", howTo: "Spot apply calming gel to red/itchy zones.", whyItHelps: "Reduces inflammation that slows consistency.", product: "Panthenol soothing gel", durationMin: 2 },
      { label: "No-overtrimming night", howTo: "Avoid daily aggressive trimming on patchy zones.", whyItHelps: "Allows visible fill pattern to develop.", product: "Weekly trim schedule", durationMin: 2 },
    ],
    lifestyle: [
      { label: "Protein and zinc meal", howTo: "Include one protein-rich and zinc-rich meal today.", whyItHelps: "Nutritional support improves hair shaft quality.", product: "Eggs, legumes, seeds", durationMin: 4 },
      { label: "Stress regulation", howTo: "Do 5-minute breathing or walk break.", whyItHelps: "Improves routine adherence and recovery behavior.", product: "5-min timer", durationMin: 5 },
      { label: "Hydration target", howTo: "Reach 2.5L fluids by evening.", whyItHelps: "Supports skin condition under beard follicles.", product: "Hydration reminder", durationMin: 2 },
      { label: "Hands-off patches", howTo: "Avoid touching or scratching sparse areas.", whyItHelps: "Prevents irritation and micro-damage.", product: "Awareness cue", durationMin: 2 },
    ],
    weekly: [
      { label: "Patch density photo check", howTo: "Take same-angle cheek/chin photos weekly.", whyItHelps: "Visible evidence of progress improves confidence.", product: "Phone camera", durationMin: 8 },
      { label: "Tool hygiene and trim reset", howTo: "Sanitize trimmer and set minimal trim plan.", whyItHelps: "Reduces follicle irritation and uneven grooming setbacks.", product: "Trimmer cleaner", durationMin: 7 },
    ],
  },
  body_acne: {
    morning: [
      { label: "Post-sweat cleanse rule", howTo: "Clean acne-prone body areas after sweat using mild wash.", whyItHelps: "Lowers sweat and bacteria buildup that trigger body breakouts.", product: "Body acne wash", durationMin: 4 },
      { label: "Breathable fabric start", howTo: "Wear loose, sweat-wicking cotton or performance fabric.", whyItHelps: "Reduces friction and trapped moisture flare-ups.", product: "Breathable clothing", durationMin: 2 },
      { label: "Targeted moisturizer", howTo: "Apply non-comedogenic moisturizer on dry acne-prone zones.", whyItHelps: "Keeps barrier calm and lowers rebound irritation.", product: "Lightweight body lotion", durationMin: 2 },
      { label: "Back/chest SPF coverage", howTo: "Apply sunscreen if body area is sun-exposed.", whyItHelps: "Prevents stubborn post-acne marks from darkening.", product: "Body SPF 30+", durationMin: 2 },
    ],
    night: [
      { label: "Salicylic treatment night", howTo: "Use BHA wash or spray on acne-prone body zones.", whyItHelps: "Helps clear pores and reduce inflammatory lesions.", product: "Salicylic spray/wash", durationMin: 4 },
      { label: "Benzoyl wash rotation", howTo: "Use benzoyl cleanser on planned nights, rinse fully.", whyItHelps: "Reduces acne-causing bacteria load.", product: "Benzoyl peroxide wash", durationMin: 4, caution: "Can bleach fabrics; rinse well." },
      { label: "Dryness recovery layer", howTo: "Apply calming moisturizer after treatment nights.", whyItHelps: "Prevents over-dryness and keeps routine sustainable.", product: "Barrier body moisturizer", durationMin: 2 },
      { label: "Clean sleepwear switch", howTo: "Use clean, breathable sleepwear tonight.", whyItHelps: "Reduces friction and residue contact.", product: "Fresh cotton t-shirt", durationMin: 2 },
    ],
    lifestyle: [
      { label: "Gym friction management", howTo: "Avoid staying in sweaty clothes after workout.", whyItHelps: "Cuts prolonged friction and occlusion.", product: "Workout change kit", durationMin: 3 },
      { label: "Laundry detergent sensitivity check", howTo: "Use mild, low-fragrance detergent for body-contact fabrics.", whyItHelps: "Reduces irritant dermatitis that mimics acne worsening.", product: "Sensitive detergent", durationMin: 3 },
      { label: "Hydration and sugar moderation", howTo: "Balance hydration and avoid sugary late snacks today.", whyItHelps: "Supports lower inflammation tendency.", product: "Water + whole-food snack", durationMin: 3 },
      { label: "Hands-off body lesions", howTo: "Avoid squeezing body acne and use spot patch where possible.", whyItHelps: "Prevents marks and prolonged healing.", product: "Body spot patch", durationMin: 2 },
    ],
    weekly: [
      { label: "Back/chest progress photos", howTo: "Capture same-distance photos weekly.", whyItHelps: "Objective progress improves motivation.", product: "Phone camera", durationMin: 8 },
      { label: "Workout gear sanitation", howTo: "Wash gym towel/bag and sanitize wearable gear.", whyItHelps: "Lowers bacterial re-exposure from gear.", product: "Mild disinfectant", durationMin: 8 },
    ],
  },
  body_odor: {
    morning: [
      { label: "Antibacterial body wash", howTo: "Wash underarms, chest, neck, feet, and groin-adjacent outer skin thoroughly, then dry completely.", whyItHelps: "Removes sweat film and lowers odor-causing bacterial buildup.", product: "Antibacterial body wash", durationMin: 5 },
      { label: "Dry-skin antiperspirant layer", howTo: "Apply antiperspirant on fully dry underarms only after bathing.", whyItHelps: "Lower sweat output means less odor retention in shirts through the day.", product: "Night or morning antiperspirant", durationMin: 2 },
      { label: "Fresh fabric rule", howTo: "Start in a fresh vest, shirt, and socks. Avoid reusing yesterday's damp items.", whyItHelps: "Fabric retention is a major reason odor returns quickly.", product: "Fresh cotton inner layer", durationMin: 2 },
      { label: "Carry a quick-reset kit", howTo: "Keep wipes, spare tee, and pocket deodorant for long commute or gym days.", whyItHelps: "Makes midday reset realistic for Indian heat and traffic-heavy schedules.", product: "Travel freshness kit", durationMin: 2 },
    ],
    night: [
      { label: "Post-commute rinse", howTo: "Rinse sweat-prone zones after commute or workout instead of staying in day-long sweat.", whyItHelps: "Cuts odor rebound before it sets into skin and clothes.", product: "Quick shower or wash", durationMin: 4 },
      { label: "Night sweat-control layer", howTo: "Apply underarm antiperspirant at night 3 to 5 times weekly on fully dry skin.", whyItHelps: "Night application gives better next-day sweat control for many users.", product: "Clinical antiperspirant roll-on", durationMin: 2, caution: "Do not apply on irritated or freshly shaved underarms." },
      { label: "Foot and shoe reset", howTo: "Air shoes, rotate socks, and dry feet fully before bed.", whyItHelps: "Footwear is a common hidden source of lingering body odor.", product: "Foot powder or drying spray", durationMin: 3 },
      { label: "Laundry separation", howTo: "Wash workout and commute clothes separately if they trap odor easily.", whyItHelps: "Prevents re-exposure from odor-loaded fabric.", product: "Odor-control detergent", durationMin: 3 },
    ],
    lifestyle: [
      { label: "Hydration checkpoint", howTo: "Cross 2.5L fluids on hot or sweat-heavy days unless medically restricted.", whyItHelps: "Better hydration helps reduce concentrated sweat and tired-body smell.", product: "Water bottle tracker", durationMin: 2 },
      { label: "Commute sweat strategy", howTo: "Prefer breathable layers, remove backpack as soon as possible, and ventilate after reaching destination.", whyItHelps: "Reduces heat-trap zones where odor spikes fastest.", product: "Breathable fabric switch", durationMin: 3 },
      { label: "Meal trigger review", howTo: "Track whether onion-heavy, garlic-heavy, alcohol, or low-water days worsen odor for you.", whyItHelps: "User-specific triggers matter more than generic rules.", product: "Quick notes tracker", durationMin: 3 },
      { label: "Fresh towel rule", howTo: "Rotate towels frequently and keep bath cloths dry between uses.", whyItHelps: "Damp towels quietly amplify body odor recurrence.", product: "Dry towel rotation", durationMin: 2 },
    ],
    weekly: [
      { label: "Wardrobe odor audit", howTo: "Audit shirts, gym wear, socks, and shoes that keep holding smell and deep clean them.", whyItHelps: "Cuts fabric-based odor recurrence that products alone cannot solve.", product: "Laundry reset", durationMin: 10 },
      { label: "Underarm irritation check", howTo: "Review if shaving, deodorant, or friction is causing redness and adjust the plan.", whyItHelps: "Lower irritation improves consistency with sweat-control products.", product: "Routine tracker", durationMin: 6 },
    ],
  },
  lip_care: {
    morning: [
      { label: "SPF lip shield", howTo: "Apply SPF lip balm generously and reapply every 3-4 hours outdoors.", whyItHelps: "Prevents UV-driven dryness and pigmentation.", product: "SPF 30+ lip balm", durationMin: 2 },
      { label: "Hydration sip start", howTo: "Drink one glass of water within 20 minutes of waking.", whyItHelps: "Supports lip moisture from inside out.", product: "Hydration cue", durationMin: 1 },
      { label: "Irritant-free day balm", howTo: "Use fragrance-free balm; avoid mint/cinnamon flavors.", whyItHelps: "Reduces contact irritation and cracking.", product: "Fragrance-free lip balm", durationMin: 1 },
      { label: "No licking cue", howTo: "Use a reminder cue to avoid lip licking habit.", whyItHelps: "Stops saliva-evaporation cycle that worsens chapping.", product: "Habit reminder note", durationMin: 1 },
    ],
    night: [
      { label: "Occlusive repair layer", howTo: "Apply thick occlusive balm before sleep.", whyItHelps: "Locks moisture overnight and softens cracks.", product: "Petrolatum/lanolin repair balm", durationMin: 2 },
      { label: "Ceramide lip support", howTo: "Apply ceramide-rich lip treatment below occlusive layer.", whyItHelps: "Rebuilds compromised lip barrier.", product: "Ceramide lip cream", durationMin: 2 },
      { label: "Gentle flake handling", howTo: "Do not peel lip flakes manually; soften with balm only.", whyItHelps: "Prevents micro-cuts and prolonged inflammation.", product: "Soft cloth compress", durationMin: 2 },
      { label: "Humidifier sleep setup", howTo: "Use room humidifier if air is dry.", whyItHelps: "Reduces transepidermal water loss overnight.", product: "Bedside humidifier", durationMin: 2 },
    ],
    lifestyle: [
      { label: "Spice/acid trigger check", howTo: "Reduce very spicy or acidic exposure if lips are cracked.", whyItHelps: "Minimizes stinging and irritation cycle.", product: "Gentle food swap", durationMin: 2 },
      { label: "Hydration target", howTo: "Target 2.5L daily fluids spread through day.", whyItHelps: "Improves lip hydration baseline.", product: "Hydration tracker", durationMin: 2 },
      { label: "Toothpaste irritant check", howTo: "Switch to low-irritant toothpaste if corner irritation persists.", whyItHelps: "Reduces recurrent lip-edge irritation.", product: "SLS-free toothpaste", durationMin: 2 },
      { label: "Outdoor protection routine", howTo: "Carry lip balm and reapply after meals.", whyItHelps: "Prevents daytime moisture drop.", product: "Pocket balm", durationMin: 2 },
    ],
    weekly: [
      { label: "Gentle lip softening session", howTo: "Use warm compress, then balm. Avoid abrasive scrubs.", whyItHelps: "Safely removes roughness without barrier trauma.", product: "Warm compress + balm", durationMin: 6 },
      { label: "Trigger recap", howTo: "Review week and note top 2 triggers for cracks.", whyItHelps: "Improves personalization and control.", product: "Quick journal", durationMin: 6 },
    ],
  },
  anti_aging: {
    morning: [
      { label: "Gentle cleanse", howTo: "Use low-foam cleanser; avoid harsh scrubbing.", whyItHelps: "Preserves barrier and limits inflammation-related aging.", product: "Cream/gel gentle cleanser", durationMin: 3 },
      { label: "Antioxidant defend step", howTo: "Apply antioxidant serum on dry skin before moisturizer.", whyItHelps: "Helps protect against oxidative stress and uneven tone.", product: "Vitamin C or antioxidant blend", durationMin: 2 },
      { label: "High-protection SPF", howTo: "Apply broad-spectrum SPF on face, neck, ears.", whyItHelps: "UV control is the highest-impact anti-aging habit.", product: "SPF 50 PA++++", durationMin: 2 },
      { label: "Neck and eye support", howTo: "Extend moisturizer/SPF to neck and orbital area.", whyItHelps: "Prevents mismatch aging in commonly ignored zones.", product: "Peptide moisturizer", durationMin: 2 },
    ],
    night: [
      { label: "Retinoid progression night", howTo: "Apply pea-size retinoid 2-4 nights weekly as tolerated.", whyItHelps: "Supports texture and fine-line improvement over time.", product: "Beginner retinoid", durationMin: 3, caution: "Increase slowly to prevent irritation." },
      { label: "Peptide recovery night", howTo: "Use peptide/ceramide layer on non-retinoid nights.", whyItHelps: "Supports repair while maintaining consistent routine.", product: "Peptide + ceramide cream", durationMin: 3 },
      { label: "Barrier repair finish", howTo: "Seal with moisturizer after active products.", whyItHelps: "Maintains comfort and long-term adherence.", product: "Barrier moisturizer", durationMin: 2 },
      { label: "Low-friction sleep skin", howTo: "Sleep on clean, low-friction pillow surface.", whyItHelps: "Reduces mechanical stress and irritation.", product: "Soft pillow cover", durationMin: 2 },
    ],
    lifestyle: [
      { label: "Protein + antioxidant meal", howTo: "Include protein and colorful vegetables in one major meal.", whyItHelps: "Nutrient support helps collagen maintenance behaviorally.", product: "Balanced meal plate", durationMin: 4 },
      { label: "UV exposure planning", howTo: "Plan outdoor tasks outside peak UV when possible.", whyItHelps: "Lower UV burden preserves gains from skincare.", product: "UV index check", durationMin: 2 },
      { label: "Sleep recovery", howTo: "Aim for 7-8 hours of consistent sleep.", whyItHelps: "Sleep quality supports visible skin repair.", product: "Sleep alarm", durationMin: 3 },
      { label: "Stress reset", howTo: "Perform 5-minute mindfulness or breath work.", whyItHelps: "Better stress management improves habit consistency.", product: "Guided breathing timer", durationMin: 5 },
    ],
    weekly: [
      { label: "Texture photo review", howTo: "Capture same-light close-ups of forehead/cheeks.", whyItHelps: "Visual evidence improves confidence and adherence.", product: "Phone camera", durationMin: 8 },
      { label: "Irritation tolerance check", howTo: "Adjust retinoid frequency based on redness/dryness score.", whyItHelps: "Smart pacing prevents setbacks.", product: "Routine scorecard", durationMin: 7 },
    ],
  },
  skin_dullness: {
    morning: [
      { label: "Gentle brightening cleanse", howTo: "Cleanse without harsh scrubbing, then pat dry completely before serum.", whyItHelps: "Protects barrier while prepping skin for glow-support steps.", product: "Gentle cleanser", durationMin: 3 },
      { label: "Vitamin C glow layer", howTo: "Apply 2 to 3 drops over face and neck, especially tan-prone zones.", whyItHelps: "Supports brighter tone and daily defense against UV and pollution stress.", product: "Vitamin C serum", durationMin: 2 },
      { label: "Hydration plus SPF", howTo: "Seal with light moisturizer and broad-spectrum sunscreen before leaving home.", whyItHelps: "Without sunscreen, dullness and tan keep returning.", product: "Hydrator + SPF 50", durationMin: 3 },
      { label: "Commute defense habit", howTo: "Use cap, helmet visor hygiene, and midday sunscreen reapplication when outdoors.", whyItHelps: "Indian commute exposure is a major dullness driver.", product: "Pocket sunscreen", durationMin: 2 },
    ],
    night: [
      { label: "Pollution reset cleanse", howTo: "Cleanse thoroughly after commute to remove dust, sweat, and sunscreen.", whyItHelps: "Night recovery starts with taking the day off your skin.", product: "Low-foam cleanser", durationMin: 3 },
      { label: "Texture renew serum", howTo: "Use low-strength lactic or mandelic serum 2 to 4 nights weekly only.", whyItHelps: "Smooths rough texture with less irritation than aggressive scrubs.", product: "Beginner exfoliating serum", durationMin: 2, caution: "Skip on irritated skin and never combine with too many strong actives." },
      { label: "Barrier support layer", howTo: "Finish with a calming moisturizer over the whole face and neck.", whyItHelps: "Hydrated skin reflects light better and tolerates brightening actives longer.", product: "Ceramide moisturizer", durationMin: 2 },
      { label: "Sleep-before-midnight rule", howTo: "Aim for a consistent sleep window instead of scrolling late.", whyItHelps: "Sleep debt shows up fast as tired, flat skin.", product: "Sleep reminder", durationMin: 2 },
    ],
    lifestyle: [
      { label: "Fruit and hydration block", howTo: "Add one vitamin C fruit plus one hydration checkpoint before lunch.", whyItHelps: "Supports brighter tone and lowers dehydration-driven flatness.", product: "Fruit + water cue", durationMin: 3 },
      { label: "No harsh scrub day", howTo: "Avoid walnut scrubs or rough towel rubbing even if skin feels rough.", whyItHelps: "Over-scrubbing often makes dullness linger longer.", product: "Soft towel", durationMin: 2 },
      { label: "Dust cleanup rule", howTo: "Wash face after cricket, biking, or dusty outdoor exposure.", whyItHelps: "Stops pollution film from sitting on skin for hours.", product: "Travel cleanser or rinse", durationMin: 3 },
      { label: "Late-sugar check", howTo: "Limit dessert or fried snack nights when skin looks puffy and tired next morning.", whyItHelps: "Helps lower next-day dullness spillover.", product: "Meal tracker", durationMin: 3 },
    ],
    weekly: [
      { label: "Glow comparison photo", howTo: "Take same-light front and side photos weekly before skincare.", whyItHelps: "Makes subtle brightness changes visible and keeps users consistent.", product: "Phone camera", durationMin: 8 },
      { label: "Tan trigger recap", howTo: "Review outdoor exposure, sunscreen misses, and late nights from the week.", whyItHelps: "Most dullness relapse comes from repeat triggers, not one bad product.", product: "Weekly tracker", durationMin: 7 },
    ],
  },
  energy_fatigue: {
    morning: [
      { label: "Water plus daylight start", howTo: "Drink water soon after waking and step into daylight for 3 to 5 minutes.", whyItHelps: "A fast circadian cue improves wakefulness and steadier morning energy.", product: "Water bottle + daylight cue", durationMin: 5 },
      { label: "Protein-first breakfast", howTo: "Eat eggs, paneer, sprouts, curd if tolerated, or dal-based breakfast before relying on tea.", whyItHelps: "Reduces mid-morning and post-lunch crashes from weak breakfast quality.", product: "Protein breakfast option", durationMin: 10 },
      { label: "Tea-coffee timing control", howTo: "Keep first caffeine after some water and food instead of empty stomach overload.", whyItHelps: "Helps reduce jitter-crash cycles.", product: "Caffeine timing plan", durationMin: 2 },
      { label: "2-minute movement activation", howTo: "Do a short walk, stretch, or stair round before sitting for long work blocks.", whyItHelps: "Shifts the body out of sluggish morning inertia.", product: "2-minute timer", durationMin: 2 },
    ],
    night: [
      { label: "Screen cutoff block", howTo: "Cut down phone or laptop usage at least 30 to 45 minutes before sleep.", whyItHelps: "Late blue-light exposure pushes next-day fatigue higher.", product: "Do-not-disturb schedule", durationMin: 2 },
      { label: "Light dinner timing", howTo: "Finish heavy dinner earlier and avoid sleeping immediately after overeating.", whyItHelps: "Improves next-day freshness and sleep quality.", product: "Dinner reminder", durationMin: 3 },
      { label: "Sleep setup reset", howTo: "Cool room, dark lights, and same bedtime window at least 5 nights weekly.", whyItHelps: "Consistency matters more than occasional perfect sleep.", product: "Sleep checklist", durationMin: 4 },
      { label: "Next-day plan close", howTo: "Write the first task of tomorrow and stop mental looping.", whyItHelps: "Reduces stress carryover into sleep.", product: "Phone notes or diary", durationMin: 3 },
    ],
    lifestyle: [
      { label: "Hydration ladder", howTo: "Break water into 4 checkpoints instead of trying to catch up late.", whyItHelps: "Steadier hydration means steadier energy.", product: "1L bottle tracker", durationMin: 2 },
      { label: "Lunch crash defense", howTo: "Choose dal, roti, sabzi, salad, or protein bowl instead of only rice plus fried sides.", whyItHelps: "Balanced lunch lowers the heavy post-lunch slump.", product: "Balanced lunch swap", durationMin: 4 },
      { label: "Stress interrupt", howTo: "Take one 5-minute walk or breath break during the busiest part of the day.", whyItHelps: "Mental load often shows up as physical fatigue.", product: "Break timer", durationMin: 5 },
      { label: "Weekend recovery guardrail", howTo: "Avoid ruining sleep rhythm by sleeping extremely late on weekends.", whyItHelps: "Social jet lag can wreck Monday-to-Wednesday energy.", product: "Wake-time guardrail", durationMin: 3 },
    ],
    weekly: [
      { label: "Energy crash review", howTo: "Review which days had the worst crash and what came before them.", whyItHelps: "Makes the plan personalized instead of generic.", product: "Energy journal", durationMin: 7 },
      { label: "Sleep debt reset", howTo: "Plan one or two nights this week where sleep gets priority over late entertainment or work.", whyItHelps: "Recovery starts with banking back lost sleep.", product: "Weekly schedule review", durationMin: 6 },
    ],
  },
  fitness_recovery: {
    morning: [
      { label: "Mobility primer", howTo: "Spend 5 minutes on hips, shoulders, ankles, or the stiffest zones before the day gets busy.", whyItHelps: "Prepares the body better for training and daily movement.", product: "Mobility flow", durationMin: 5 },
      { label: "Hydration and electrolytes", howTo: "Hydrate early, especially after sweaty sessions or hot-weather walks.", whyItHelps: "Cuts the hidden dehydration load that slows recovery.", product: "Electrolyte drink", durationMin: 2 },
      { label: "Protein anchor", howTo: "Include at least one clear protein source in breakfast or post-training meal.", whyItHelps: "Recovery is limited when protein stays low till lunch.", product: "Protein option", durationMin: 5 },
      { label: "Warm-up rule", howTo: "Never start training cold. Use 5 to 8 minutes of progressive prep.", whyItHelps: "Lowers avoidable injury risk and improves session quality.", product: "Warm-up template", durationMin: 6 },
    ],
    night: [
      { label: "Cooldown stretch", howTo: "Do a short cooldown for the most loaded muscle groups after training or before sleep.", whyItHelps: "Helps next-day stiffness feel more manageable.", product: "Recovery stretch plan", durationMin: 6 },
      { label: "Recovery meal check", howTo: "Review whether the day had enough protein, carbs, and fluids after training.", whyItHelps: "Recovery fails more from nutrition misses than motivation misses.", product: "Meal checklist", durationMin: 3 },
      { label: "Soreness support", howTo: "Use a recovery gel, hot shower, or light walk instead of complete stagnation when sore.", whyItHelps: "Gentle recovery beats doing nothing when soreness is high.", product: "Recovery gel or hot shower", durationMin: 5 },
      { label: "Sleep protection", howTo: "Treat sleep as part of the training plan, not optional extra effort.", whyItHelps: "Sleep is the biggest legal recovery enhancer most users ignore.", product: "Sleep alarm", durationMin: 2 },
    ],
    lifestyle: [
      { label: "Load balance check", howTo: "Avoid stacking several all-out sessions with no low-intensity day.", whyItHelps: "Smart load management keeps consistency higher over months.", product: "Training calendar", durationMin: 3 },
      { label: "Post-workout fuel timing", howTo: "Eat within a sensible window after training instead of waiting many hours.", whyItHelps: "Improves recovery quality and reduces next-day heaviness.", product: "Recovery meal plan", durationMin: 3 },
      { label: "Niggle log", howTo: "Track knee, shoulder, or low-back niggles before they become layoff injuries.", whyItHelps: "Small warnings are easier to manage than full setbacks.", product: "Pain note tracker", durationMin: 2 },
      { label: "Easy-day discipline", howTo: "Keep one active recovery or lower-intensity day instead of pushing max effort daily.", whyItHelps: "Long-term gains need recoverable training, not constant fatigue.", product: "Recovery walk or cycle", durationMin: 5 },
    ],
    weekly: [
      { label: "Soreness and performance review", howTo: "Compare soreness, performance, and sleep quality for the full week.", whyItHelps: "Shows whether the current training load is sustainable.", product: "Weekly training notes", durationMin: 8 },
      { label: "Mobility reset session", howTo: "Do one focused 15-minute mobility block on the tightest body region this week.", whyItHelps: "Improves recovery and reduces repetitive stress buildup.", product: "Mobility routine", durationMin: 15 },
    ],
  },
};

function pad2(value: number) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function formatHHMM(totalMinutes: number) {
  const safe = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

function parseHHMM(value: string) {
  const [hour, minute] = value.split(":").map((part) => Number(part || 0));
  return Math.max(0, Math.min(23, hour)) * 60 + Math.max(0, Math.min(59, minute));
}

function getMealForDay(list: string[], dayNumber: number, offset = 0) {
  return list[(dayNumber - 1 + offset) % list.length];
}

function buildEducationTasks(category: ClinicalCategoryId, dayNumber: number, level: ProtocolToleranceMode): ProtocolTask[] {
  const profile = CATEGORY_RECOVERY_PROFILES[category];
  const reasons = profile.commonReasons.join(" ");
  const principle = profile.homeCarePrinciples[(dayNumber - 1) % profile.homeCarePrinciples.length];
  const levelCopy = LEVEL_DISPLAY[level];

  const tasks: ProtocolTask[] = [
    {
      id: `${category}-insight-${dayNumber}`,
      title: "Why this issue happens",
      label: "Why this issue happens",
      slot: "lifestyle",
      frequency: "daily",
      howTo: `${profile.issueSummary} Common reasons: ${reasons} Today follow this principle at home: ${principle}`,
      why: profile.benefitSummary,
      whyItHelps: profile.benefitSummary,
      ingredient: "Education",
      goal: `Understand your ${levelCopy.label.toLowerCase()} recovery track before starting tasks.`,
      expectedImprovement: "Better compliance because the user understands what is being treated and why.",
      recommendedProduct: "Guided recovery explainer",
      reward: 2,
      durationMin: 4,
    },
    {
      id: `${category}-food-plan-${dayNumber}`,
      title: "Indian meal guidance",
      label: "Indian meal guidance",
      slot: "lifestyle",
      frequency: "daily",
      howTo: `Breakfast: ${getMealForDay(profile.indianMeals.breakfast, dayNumber)}. Lunch: ${getMealForDay(profile.indianMeals.lunch, dayNumber, 1)}. Dinner: ${getMealForDay(profile.indianMeals.dinner, dayNumber, 2)}. Fruit focus: ${getMealForDay(profile.indianMeals.fruits, dayNumber)}. Prioritize: ${profile.foodsToPrefer.join(" ")}`,
      why: "Food quality supports recovery consistency when paired with the routine; it is support, not a guaranteed cure.",
      whyItHelps: "Food quality supports recovery consistency when paired with the routine; it is support, not a guaranteed cure.",
      ingredient: "Nutrition",
      goal: "Match the routine with practical Indian meals for the next 24 hours.",
      expectedImprovement: "More stable energy, hydration, and lower relapse from avoidable food triggers.",
      recommendedProduct: "Meal guide",
      reward: 2,
      durationMin: 5,
    },
    {
      id: `${category}-avoid-list-${dayNumber}`,
      title: "Relapse prevention checklist",
      label: "Relapse prevention checklist",
      slot: "night",
      frequency: "daily",
      howTo: `Before sleep review what to avoid tomorrow: ${profile.foodsToLimit.join(" ")} Escalate for medical review if needed: ${profile.whenToEscalate.join(" ")}`,
      why: "Avoiding common triggers lowers the chance that symptoms rebound while the 30-day routine is underway.",
      whyItHelps: "Avoiding common triggers lowers the chance that symptoms rebound while the 30-day routine is underway.",
      ingredient: "Prevention",
      goal: "Protect today's progress and reduce next-day trigger exposure.",
      expectedImprovement: "Fewer setbacks from friction, picking, missed sleep, or avoidable irritants.",
      recommendedProduct: "Trigger checklist",
      reward: 2,
      durationMin: 4,
    },
  ];

  if (dayNumber === 1) {
    tasks.push({
      id: `${category}-start-briefing`,
      title: "30-day start briefing",
      label: "30-day start briefing",
      slot: "morning",
      frequency: "daily",
      howTo: `Start with the ${levelCopy.label.toLowerCase()} track. ${levelCopy.description} Follow time windows exactly in India Standard Time and do not jump ahead to stronger steps on Day 1.`,
      why: "A clean start reduces routine fatigue and improves the chance that the user finishes the full 30-day protocol.",
      whyItHelps: "A clean start reduces routine fatigue and improves the chance that the user finishes the full 30-day protocol.",
      ingredient: "Structure",
      goal: "Set the user up for a realistic 30-day start.",
      expectedImprovement: "Higher completion odds through a structured start.",
      recommendedProduct: "Program overview",
      reward: 2,
      durationMin: 4,
    });
  }

  return tasks;
}

function buildSlotTasks(
  actions: GuidedAction[],
  slot: ProtocolTask["slot"],
  count: number,
  category: ClinicalCategoryId,
  dayNumber: number,
  phaseName: ProtocolPhase["name"],
  dayFocus: string
) {
  const tasks: ProtocolTask[] = [];
  const offset = (dayNumber - 1) % actions.length;

  for (let i = 0; i < count; i += 1) {
    const action = actions[(offset + i) % actions.length];
    tasks.push({
      id: `${category}-${slot}-${dayNumber}-${i + 1}`,
      title: action.label,
      label: action.label,
      slot,
      frequency: slot === "weekly" ? "weekly" : "daily",
      howTo: `${action.howTo} Today focus: ${dayFocus}.`,
      why: action.whyItHelps,
      whyItHelps: action.whyItHelps,
      ingredient: inferIngredient(action),
      goal: action.goal || dayFocus,
      expectedImprovement: action.expectedImprovement || DAY_EXPECTED_OUTCOME[dayNumber - 1] || "Steady visible recovery with consistency.",
      recommendedProduct: action.product,
      reward: slot === "weekly" ? 4 : 2,
      caution: action.caution,
      durationMin: action.durationMin,
    });
  }

  // Add one phase guidance anchor so each day clearly explains intent.
  tasks.unshift({
    id: `${category}-${slot}-${dayNumber}-anchor`,
    title: `${phaseName} Focus`,
    label: `${phaseName} Focus: ${dayFocus}`,
    slot,
    frequency: "daily",
    howTo: `Keep this slot simple and consistent. Complete every step in order and avoid adding new products today.`,
    why: `Daily intent clarity reduces decision fatigue and improves adherence consistency.`,
    whyItHelps: `Daily intent clarity reduces decision fatigue and improves adherence consistency.`,
    ingredient: "N/A",
    goal: dayFocus,
    expectedImprovement: DAY_EXPECTED_OUTCOME[dayNumber - 1] || "Steady visible recovery with consistency.",
    recommendedProduct: "Use only routine-approved products",
    reward: 1,
    durationMin: 2,
  });

  return tasks;
}

function localizeText(text: string, language: ProtocolGuidanceLanguage, kind: "how" | "why") {
  if (language === "hi") {
    return kind === "how" ? `कैसे करें: ${text}` : `क्यों फायदेमंद: ${text}`;
  }
  if (language === "hinglish") {
    return kind === "how" ? `Kaise karein: ${text}` : `Kyun helpful hai: ${text}`;
  }
  return text;
}

function localizeTask(task: ProtocolTask, language: ProtocolGuidanceLanguage): ProtocolTask {
  return {
    ...task,
    howTo: task.howTo ? localizeText(task.howTo, language, "how") : task.howTo,
    whyItHelps: task.whyItHelps ? localizeText(task.whyItHelps, language, "why") : task.whyItHelps,
  };
}

function isActiveHeavyTask(task: ProtocolTask) {
  const hay = `${task.label} ${task.howTo || ""}`.toLowerCase();
  return /(retinoid|salicylic|benzoyl|exfoliat|acid|bha|aha)/.test(hay);
}

function applyToleranceTaskCount(base: { morning: number; night: number; lifestyle: number }, mode: ProtocolToleranceMode) {
  if (mode === "beginner") {
    return {
      morning: Math.max(1, base.morning - 1),
      night: Math.max(1, base.night - 1),
      lifestyle: base.lifestyle,
    };
  }
  if (mode === "advanced") {
    return {
      morning: base.morning + 1,
      night: base.night + 1,
      lifestyle: base.lifestyle + 1,
    };
  }
  return base;
}

export function getRecoveryLevelDisplay(level: ProtocolToleranceMode) {
  return LEVEL_DISPLAY[level];
}

export function getCategoryRecoveryProfile(category: CategoryId) {
  const exactCategory = category === "fitness" ? "fitness_recovery" : category;
  return CATEGORY_RECOVERY_PROFILES[exactCategory as ClinicalCategoryId] || null;
}

export function normalizeRecoveryLevel(level?: string | null): ProtocolToleranceMode {
  if (level === "beginner") return "beginner";
  if (level === "advanced" || level === "aggressive") return "advanced";
  if (level === "intermediate" || level === "moderate") return "intermediate";
  return "intermediate";
}

function applySafetyRules(tasks: ProtocolTask[], category: ClinicalCategoryId, options: DailyProtocolOptions, dayNumber: number) {
  const contraindications = options.contraindications || {};
  let filtered = [...tasks];

  if (contraindications.sensitiveSkin || contraindications.activeIrritation) {
    filtered = filtered.filter((task) => !isActiveHeavyTask(task));
    filtered.push({
      id: `${category}-barrier-recovery-${dayNumber}`,
      label: "Barrier recovery substitute",
      slot: "night",
      frequency: "daily",
      howTo: "Use calming moisturizer only and skip strong actives for tonight.",
      whyItHelps: "Reduces irritation risk and protects consistency without overloading skin.",
      recommendedProduct: "Ceramide + panthenol moisturizer",
      durationMin: 3,
      caution: "Re-introduce actives gradually once irritation settles.",
    });
  }

  if (contraindications.shavedToday && category === "beard_growth") {
    filtered = filtered.map((task) => {
      if (!isActiveHeavyTask(task)) return task;
      return {
        ...task,
        label: `${task.label} (post-shave mild mode)`,
        howTo: "Use only soothing and non-exfoliating care after shaving today.",
        whyItHelps: "Prevents post-shave irritation and ingrown-triggered setbacks.",
        recommendedProduct: "Alcohol-free soothing gel",
      };
    });
  }

  if (contraindications.severeDandruff && category === "scalp_health") {
    filtered.push({
      id: `${category}-dandruff-boost-${dayNumber}`,
      label: "Intensive anti-flake control",
      slot: "night",
      frequency: "daily",
      howTo: "Use anti-flake therapeutic wash as advised and dry scalp fully after rinse.",
      whyItHelps: "Higher-control cadence helps reduce persistent flaking episodes.",
      recommendedProduct: "Therapeutic anti-dandruff wash",
      durationMin: 6,
    });
  }

  // Avoid stacking multiple active-heavy tasks in the same night.
  const nightActives = filtered.filter((task) => task.slot === "night" && isActiveHeavyTask(task));
  if (nightActives.length > 1) {
    const keepIndex = dayNumber % 2 === 0 ? 0 : 1;
    const keepTaskId = nightActives[Math.min(keepIndex, nightActives.length - 1)].id;
    filtered = filtered.filter((task) => task.slot !== "night" || !isActiveHeavyTask(task) || task.id === keepTaskId);
  }

  return filtered;
}

function addMissedDayFallback(tasks: ProtocolTask[], category: ClinicalCategoryId, dayNumber: number) {
  const lite = tasks.filter((task) => !isActiveHeavyTask(task));
  lite.push({
    id: `${category}-fallback-reset-${dayNumber}`,
    label: "Recovery Lite Reset Day",
    slot: "lifestyle",
    frequency: "daily",
    howTo: "Do only cleanser, hydration, protection, and sleep recovery today. Resume full protocol tomorrow.",
    whyItHelps: "Prevents dropout after missed days and rebuilds confidence quickly.",
    recommendedProduct: "Minimal routine essentials",
    durationMin: 8,
  });
  return lite;
}

function addWeeklyConfidencePrompt(tasks: ProtocolTask[], category: ClinicalCategoryId, dayNumber: number, options: DailyProtocolOptions) {
  const completed = Math.max(0, Math.min(7, Number(options.completedDaysThisWeek || 0)));
  const adherencePct = Math.round((completed / 7) * 100);
  const photoDone = Boolean(options.weeklyPhotoDone);

  const message =
    adherencePct >= 80
      ? "Strong week. Keep this rhythm and carry it forward."
      : adherencePct >= 50
        ? "Good momentum. One more consistent block can change results fast."
        : "Low consistency this week. Restart with Recovery Lite tomorrow and rebuild step-by-step.";

  tasks.push({
    id: `${category}-confidence-check-${dayNumber}`,
    title: "Weekly confidence check-in",
    label: "Weekly confidence check-in",
    slot: "weekly",
    frequency: "weekly",
    howTo: `Review this week: ${completed}/7 days complete (${adherencePct}%). ${photoDone ? "Compare before/after photos now." : "Take this week photo now for comparison."}`,
    why: message,
    whyItHelps: message,
    ingredient: "N/A",
    goal: "Measure confidence and adherence trend",
    expectedImprovement: "Better consistency decisions for next week.",
    recommendedProduct: "Progress photo + adherence log",
    reward: 3,
    durationMin: 6,
  });
}

export function generateDailyProtocolMeta(category: CategoryId, dayNumber: number): DailyProtocolMeta | null {
  const template = getProtocolTemplate(category);
  if (!template) return null;

  const normalizedDay = Math.max(1, Math.min(30, dayNumber));
  const phaseName: DailyProtocolMeta["phaseName"] = normalizedDay <= 7 ? "Reset" : normalizedDay <= 14 ? "Repair" : "Stabilize";

  return {
    phaseName,
    dailyGoal: DAY_FOCUS[normalizedDay - 1] || "Daily recovery objective",
    expectedResult: DAY_EXPECTED_OUTCOME[normalizedDay - 1] || "Improved symptom control with consistency.",
  };
}

export function getProtocolTemplate(category: CategoryId): ProtocolTemplate | null {
  if (!(category in protocolTemplates)) return null;
  return protocolTemplates[category as ClinicalCategoryId];
}

export function getCurrentProtocolPhase(template: ProtocolTemplate, dayNumber: number) {
  let runningDays = 0;

  for (const phase of template.phases) {
    runningDays += phase.duration_days;
    if (dayNumber <= runningDays) return phase;
  }

  return template.phases[template.phases.length - 1];
}

export function generateDailyProtocolTasks(category: CategoryId, dayNumber: number, options: DailyProtocolOptions = {}) {
  const template = getProtocolTemplate(category);
  if (!template) return [] as ProtocolTask[];

  const normalizedDay = Math.max(1, Math.min(30, dayNumber));
  const phase = getCurrentProtocolPhase(template, normalizedDay);
  const guidance = CATEGORY_GUIDANCE[category as ClinicalCategoryId];
  if (!guidance) return [] as ProtocolTask[];

  const dayFocus = DAY_FOCUS[normalizedDay - 1] || "Stay consistent and follow protocol";

  const baseSlotCount =
    phase.name === "Reset" || phase.name === "Stabilization"
      ? { morning: 2, night: 1, lifestyle: 1 }
      : phase.name === "Repair" || phase.name === "Correction"
        ? { morning: 2, night: 2, lifestyle: 1 }
        : { morning: 2, night: 1, lifestyle: 1 };

  const selectedLevel = normalizeRecoveryLevel(options.toleranceMode);
  const slotCount = applyToleranceTaskCount(baseSlotCount, selectedLevel);

  let tasks = [
    ...buildSlotTasks(guidance.morning, "morning", slotCount.morning, category as ClinicalCategoryId, normalizedDay, phase.name, dayFocus),
    ...buildSlotTasks(guidance.night, "night", slotCount.night, category as ClinicalCategoryId, normalizedDay, phase.name, dayFocus),
    ...buildSlotTasks(guidance.lifestyle, "lifestyle", slotCount.lifestyle, category as ClinicalCategoryId, normalizedDay, phase.name, dayFocus),
    ...buildEducationTasks(category as ClinicalCategoryId, normalizedDay, selectedLevel),
  ];

  if (normalizedDay % 7 === 0) {
    const weeklyAction = guidance.weekly[(Math.floor(normalizedDay / 7) - 1) % guidance.weekly.length];
    tasks.push({
      id: `${category}-weekly-${normalizedDay}`,
      title: weeklyAction.label,
      label: weeklyAction.label,
      slot: "weekly",
      frequency: "weekly",
      howTo: `${weeklyAction.howTo} Keep comparison conditions the same as previous check.`,
      why: weeklyAction.whyItHelps,
      whyItHelps: weeklyAction.whyItHelps,
      ingredient: inferIngredient(weeklyAction),
      goal: weeklyAction.goal || "Review weekly progress and refine routine",
      expectedImprovement: weeklyAction.expectedImprovement || "Clearer progress visibility and better weekly decisions.",
      recommendedProduct: weeklyAction.product,
      reward: 4,
      durationMin: weeklyAction.durationMin || 8,
    });

    addWeeklyConfidencePrompt(tasks, category as ClinicalCategoryId, normalizedDay, options);
  }

  if (normalizedDay === 1) {
    tasks.push({
      id: `${category}-day1-baseline`,
      title: "Day 1 baseline record",
      label: "Day 1 baseline record",
      slot: "lifestyle",
      frequency: "daily",
      howTo: "Take clear before photos and rate severity, confidence, and consistency target for next 30 days.",
      why: "A concrete baseline makes progress visible and improves confidence.",
      whyItHelps: "A concrete baseline makes progress visible and improves confidence.",
      ingredient: "N/A",
      goal: "Set baseline for objective improvement tracking",
      expectedImprovement: "Clear comparison reference by Day 14 and Day 30.",
      recommendedProduct: "Phone notes + camera",
      reward: 3,
      durationMin: 10,
    });
  }

  if (normalizedDay === 30) {
    tasks.push({
      id: `${category}-day30-maintenance`,
      title: "Maintenance plan handoff",
      label: "Maintenance plan handoff",
      slot: "weekly",
      frequency: "weekly",
      howTo: "Finalize the 3 most effective steps and set a sustainable 4-week maintenance schedule.",
      why: "Prevents relapse and protects gains after the 30-day program.",
      whyItHelps: "Prevents relapse and protects gains after the 30-day program.",
      ingredient: "N/A",
      goal: "Transition to low-friction long-term maintenance",
      expectedImprovement: "Reduced relapse risk and improved long-term consistency.",
      recommendedProduct: "Simple maintenance checklist",
      reward: 5,
      durationMin: 10,
    });
  }

  tasks = applySafetyRules(tasks, category as ClinicalCategoryId, options, normalizedDay);

  if (options.missedYesterday) {
    tasks = addMissedDayFallback(tasks, category as ClinicalCategoryId, normalizedDay);
  }

  const language = options.guidanceLanguage || "en";
  tasks = tasks.map((task) => {
    const localized = localizeTask(task, language);
    return {
      ...localized,
      title: localized.title || localized.label,
      why: localized.why || localized.whyItHelps,
      ingredient: localized.ingredient || "Targeted active blend",
      goal: localized.goal || DAY_FOCUS[normalizedDay - 1] || "Daily recovery objective",
      expectedImprovement: localized.expectedImprovement || DAY_EXPECTED_OUTCOME[normalizedDay - 1] || "Steady visible recovery with consistency.",
      reward: Number.isFinite(Number(localized.reward)) ? Number(localized.reward) : localized.slot === "weekly" ? 4 : 2,
    };
  });

  return tasks;
}

export function getProtocolDurationDays(template: ProtocolTemplate) {
  return template.phases.reduce((sum, phase) => sum + phase.duration_days, 0);
}

function slotWindow(
  slot: ProtocolTask["slot"],
  level: ProtocolToleranceMode,
  dayNumber: number,
  taskIndexInSlot = 0,
  slotTaskCount = 1
) {
  const bucket = slot === "weekly" ? "weekly" : slot;
  const base = LEVEL_SLOT_WINDOWS[level][bucket];
  const startMin = parseHHMM(base.start);
  const endMin = parseHHMM(base.end);
  const span = Math.max(45, endMin - startMin);
  const segment = Math.max(35, Math.floor(span / Math.max(1, slotTaskCount)));
  const dayOffset = ((dayNumber + taskIndexInSlot) % 3) * 10;
  const segmentStart = Math.min(endMin - 30, startMin + taskIndexInSlot * segment + dayOffset);
  const segmentEnd = Math.min(endMin, Math.max(segmentStart + 30, segmentStart + Math.min(75, segment - 5)));

  return {
    start: formatHHMM(segmentStart),
    end: formatHHMM(segmentEnd),
  };
}

function sanitizeProductId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function splitHowToSteps(howTo?: string) {
  if (!howTo) return ["Follow the task steps gently and consistently."];
  return howTo
    .split(/[.\n]+/)
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step, index) => `${index + 1}. ${step}`)
    .slice(0, 5);
}

function fallbackByCategory(category: CategoryId): string[] {
  const map: Record<string, string[]> = {
    acne: ["Use chilled clean water compress for 2 minutes", "Apply pure aloe gel on inflamed zones", "Avoid picking and reduce high-glycemic snacks"],
    dark_circles: ["Use cold spoon compress under eyes", "Sleep before 11 PM consistently", "Drink 2.5L water across day"],
    hair_loss: ["5-minute scalp fingertip massage", "Protein-rich breakfast daily", "Avoid tight hairstyles and harsh heat"],
    scalp_health: ["Use lukewarm water only", "Keep scalp dry after sweat", "Avoid fragranced scalp styling products"],
    beard_growth: ["Warm towel compress before massage", "Daily beard-area cleanse", "Avoid aggressive over-trimming"],
    body_acne: ["Shower after sweating", "Wear breathable cotton fabrics", "Avoid occlusive body lotions on acne-prone zones"],
    body_odor: ["Rinse sweat-prone zones quickly", "Switch into a fresh shirt and socks", "Dry underarms fully before antiperspirant"],
    lip_care: ["Apply plain petroleum jelly overnight", "Hydrate regularly", "Avoid licking lips"],
    anti_aging: ["Use sunscreen daily", "Keep gentle cleanse + moisturizer rhythm", "Prioritize sleep and hydration"],
    skin_dullness: ["Use sunscreen daily", "Add one vitamin C fruit", "Avoid harsh scrubbing"],
    energy_fatigue: ["Drink water soon after waking", "Eat protein before relying on tea", "Cut late-night scrolling"],
    fitness_recovery: ["Warm up before training", "Hit protein after workouts", "Protect sleep on hard-training days"],
  };
  return map[category] || ["Keep routine simple, consistent, and gentle."];
}

function normalizePhaseName(name: ProtocolPhase["name"]): DailyProtocolMeta["phaseName"] {
  if (name === "Reset") return "Reset";
  if (name === "Repair" || name === "Correction") return "Repair";
  return "Stabilize";
}

function mapProtocolTaskToExecutionTask(
  category: CategoryId,
  task: ProtocolTask,
  dayNumber: number,
  ownedProductIds: Set<string>,
  level: ProtocolToleranceMode,
  taskIndexInSlot: number,
  slotTaskCount: number
): DailyExecutionTask {
  const label = task.title || task.label;
  const matchedProduct = pickClinicalDemoProduct(
    category,
    `${label} ${task.recommendedProduct || ""} ${task.howTo || ""} ${task.whyItHelps || task.why || ""}`,
    level
  );
  const productName = matchedProduct?.name || task.recommendedProduct || `${label} support product`;
  const productId = matchedProduct?.id || sanitizeProductId(`${category}-${task.id}-${productName}`);
  const ingredient = matchedProduct?.ingredient || task.ingredient || inferIngredient({
    label,
    howTo: task.howTo || "",
    whyItHelps: task.whyItHelps || task.why || "",
    product: productName,
  });

  const window = task.timeWindow || slotWindow(task.slot, level, dayNumber, taskIndexInSlot, slotTaskCount);
  const required = task.slot !== "lifestyle";

  return {
    id: `${category}:${dayNumber}:${task.id}`,
    title: label,
    timeWindow: window,
    durationMin: Math.max(1, Number(task.durationMin || (task.slot === "lifestyle" ? 5 : 3))),
    goal: task.goal || "Daily recovery objective",
    whyItHelps: task.whyItHelps || task.why || "Supports recovery consistency and reduces symptom volatility.",
    howToSteps: task.howToSteps?.length ? task.howToSteps : splitHowToSteps(task.howTo),
    product: {
      id: productId,
      name: productName,
      ingredient,
      required,
    },
    userHasProduct: ownedProductIds.has(productId),
    fallbackHomeRemedy: task.fallbackHomeRemedy?.length ? task.fallbackHomeRemedy : fallbackByCategory(category),
    reward: Number.isFinite(Number(task.reward)) ? Number(task.reward) : task.slot === "weekly" ? 4 : 2,
    caution: task.caution || "Patch test and stop if irritation worsens.",
    unlockCondition: task.unlockCondition || { type: "time", value: `${window.start}-${window.end}` },
  };
}

export function generateDailyExecutionPayload(
  category: CategoryId,
  dayNumber: number,
  options: DailyProtocolOptions = {},
  context: {
    completedTaskIds?: string[];
    ownedProductIds?: string[];
  } = {}
): DailyExecutionPayload | null {
  const template = getProtocolTemplate(category);
  if (!template) return null;

  const normalizedDay = Math.max(1, Math.min(30, dayNumber));
  const phase = normalizePhaseName(getCurrentProtocolPhase(template, normalizedDay).name);
  const meta = generateDailyProtocolMeta(category, normalizedDay);
  const protocolTasks = generateDailyProtocolTasks(category, normalizedDay, options);
  const selectedLevel = normalizeRecoveryLevel(options.toleranceMode);

  const completed = new Set(context.completedTaskIds || []);
  const ownedProducts = new Set(context.ownedProductIds || []);

  const slotCounts = protocolTasks.reduce(
    (acc, task) => {
      acc[task.slot] += 1;
      return acc;
    },
    { morning: 0, lifestyle: 0, night: 0, weekly: 0 } as Record<ProtocolTask["slot"], number>
  );
  const slotIndexes = { morning: 0, lifestyle: 0, night: 0, weekly: 0 } as Record<ProtocolTask["slot"], number>;

  const executionTasks = protocolTasks.map((task) => {
    const taskIndexInSlot = slotIndexes[task.slot];
    slotIndexes[task.slot] += 1;

    return mapProtocolTaskToExecutionTask(
      category,
      task,
      normalizedDay,
      ownedProducts,
      selectedLevel,
      taskIndexInSlot,
      slotCounts[task.slot]
    );
  });

  const grouped = {
    morning: executionTasks.filter((task, index) => protocolTasks[index]?.slot === "morning"),
    afternoon: executionTasks.filter((task, index) => protocolTasks[index]?.slot === "lifestyle"),
    night: executionTasks.filter((task, index) => protocolTasks[index]?.slot === "night" || protocolTasks[index]?.slot === "weekly"),
  };

  const total = executionTasks.length;
  const done = executionTasks.reduce((sum, task) => sum + (completed.has(task.id) ? 1 : 0), 0);

  return {
    day: normalizedDay,
    phase,
    dailyGoal: meta?.dailyGoal || DAY_FOCUS[normalizedDay - 1] || "Daily recovery objective",
    expectedOutcome: meta?.expectedResult || DAY_EXPECTED_OUTCOME[normalizedDay - 1] || "Improved symptom control with consistency.",
    tasks: grouped,
    completionStatus: {
      total,
      completed: done,
      pending: Math.max(0, total - done),
    },
    adherenceScore: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

export { protocolTemplates };
