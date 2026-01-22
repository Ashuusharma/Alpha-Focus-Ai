// lib/questions.ts

// lib/questions.ts

export type CategoryId =
  | "hairCare"
  | "skinCare"
  | "beardCare"
  | "bodyCare"
  | "healthCare"
  | "fitness"
  | "fragrance";

export interface Category {
  id: CategoryId;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
}

/**
 * 🔒 FIXED CATEGORIES — DO NOT CHANGE
 */
export const categories: { id: CategoryId; label: string }[] = [
  { id: "hairCare", label: "Hair Care" },
  { id: "skinCare", label: "Skin Care" },
  { id: "beardCare", label: "Beard Care" },
  { id: "bodyCare", label: "Body Care" },
  { id: "healthCare", label: "Health Care" },
  { id: "fitness", label: "Fitness" },
  { id: "fragrance", label: "Fragrance" },
];


/**
 * 7 Categories × 5 Questions × 3+ Options
 */
export const questions: Record<CategoryId, Question[]> = {
  hairCare: [
    {
      id: "hair_concern",
      text: "What is your main hair concern?",
      options: ["Hair fall", "Dandruff", "Dry hair", "Hair thinning"],
    },
    {
      id: "hair_type",
      text: "What best describes your hair type?",
      options: ["Straight", "Wavy", "Curly"],
    },
    {
      id: "scalp_type",
      text: "How does your scalp usually feel?",
      options: ["Oily", "Dry", "Normal"],
    },
    {
      id: "hair_damage",
      text: "Do you use heat or chemical treatments?",
      options: ["Frequently", "Occasionally", "Never"],
    },
    {
      id: "hair_goal",
      text: "What is your primary hair goal?",
      options: ["Reduce hair fall", "Increase growth", "Improve texture"],
    },
  ],

  skinCare: [
    {
      id: "skin_type",
      text: "What is your skin type?",
      options: ["Oily", "Dry", "Combination"],
    },
    {
      id: "skin_concern",
      text: "Main skin concern?",
      options: ["Acne", "Dark spots", "Dullness"],
    },
    {
      id: "breakouts",
      text: "How often do you get breakouts?",
      options: ["Frequently", "Sometimes", "Rarely"],
    },
    {
      id: "sun_exposure",
      text: "Daily sun exposure?",
      options: ["High", "Moderate", "Low"],
    },
    {
      id: "skin_goal",
      text: "Skin goal?",
      options: ["Clear skin", "Brightening", "Hydration"],
    },
  ],

  beardCare: [
    {
      id: "beard_growth",
      text: "How is your beard growth?",
      options: ["Patchy", "Uneven", "Full"],
    },
    {
      id: "beard_issue",
      text: "Biggest beard issue?",
      options: ["Itching", "Dryness", "Ingrown hair"],
    },
    {
      id: "beard_length",
      text: "Preferred beard length?",
      options: ["Short", "Medium", "Long"],
    },
    {
      id: "beard_care",
      text: "Do you use beard products?",
      options: ["Yes", "Sometimes", "No"],
    },
    {
      id: "beard_goal",
      text: "Beard goal?",
      options: ["Thicker beard", "Soft beard", "Defined shape"],
    },
  ],

  bodyCare: [
    {
      id: "body_skin",
      text: "Body skin type?",
      options: ["Dry", "Normal", "Oily"],
    },
    {
      id: "body_issue",
      text: "Main body concern?",
      options: ["Body acne", "Odor", "Dryness"],
    },
    {
      id: "sweat",
      text: "Sweating level?",
      options: ["High", "Moderate", "Low"],
    },
    {
      id: "shower_freq",
      text: "Shower frequency?",
      options: ["Daily", "Alternate days", "Occasional"],
    },
    {
      id: "body_goal",
      text: "Body care goal?",
      options: ["Freshness", "Smooth skin", "Hydration"],
    },
  ],

  healthCare: [
    {
      id: "energy",
      text: "Daily energy level?",
      options: ["Low", "Average", "High"],
    },
    {
      id: "sleep",
      text: "Sleep quality?",
      options: ["Poor", "Average", "Good"],
    },
    {
      id: "stress",
      text: "Stress level?",
      options: ["High", "Medium", "Low"],
    },
    {
      id: "diet",
      text: "Diet type?",
      options: ["Balanced", "Irregular", "Processed"],
    },
    {
      id: "health_goal",
      text: "Health goal?",
      options: ["Better sleep", "More energy", "Stress control"],
    },
  ],

  fitness: [
    {
      id: "activity",
      text: "Activity level?",
      options: ["Sedentary", "Moderate", "Active"],
    },
    {
      id: "workout",
      text: "Workout frequency?",
      options: ["Daily", "Few times/week", "Rarely"],
    },
    {
      id: "goal",
      text: "Fitness goal?",
      options: ["Weight loss", "Muscle gain", "Endurance"],
    },
    {
      id: "injury",
      text: "Any injuries?",
      options: ["Yes", "No", "Past"],
    },
    {
      id: "fitness_focus",
      text: "Focus area?",
      options: ["Strength", "Cardio", "Flexibility"],
    },
  ],

  fragrance: [
    {
      id: "scent_type",
      text: "Preferred scent type?",
      options: ["Fresh", "Woody", "Spicy"],
    },
    {
      id: "usage",
      text: "When do you use fragrance?",
      options: ["Daily", "Occasionally", "Special events"],
    },
    {
      id: "strength",
      text: "Preferred strength?",
      options: ["Light", "Medium", "Strong"],
    },
    {
      id: "climate",
      text: "Climate?",
      options: ["Hot", "Moderate", "Cold"],
    },
    {
      id: "fragrance_goal",
      text: "Fragrance goal?",
      options: ["Long lasting", "Signature scent", "Compliments"],
    },
  ],
};
