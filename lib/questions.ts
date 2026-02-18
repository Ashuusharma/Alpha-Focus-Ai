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
  imageUrl: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  imageUrl?: string;
  context?: string;
}

/**
 * 🔒 FIXED CATEGORIES — Image Updated
 */
export const categories: { id: CategoryId; label: string; imageUrl: string }[] = [
  { 
    id: "hairCare", 
    label: "Hair Care",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1400&auto=format&fit=crop"
  },
  { 
    id: "skinCare", 
    label: "Skin Care",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1400&auto=format&fit=crop"
  },
  { 
    id: "beardCare", 
    label: "Beard Care",
    imageUrl: "https://images.unsplash.com/photo-1621607512214-68297480165e?q=80&w=1400&auto=format&fit=crop"
  },
  { 
    id: "bodyCare", 
    label: "Body Care",
    imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1400&auto=format&fit=crop"
  },
  { 
    id: "healthCare", 
    label: "Health Care",
    imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1400&auto=format&fit=crop"
  },
  { 
    id: "fitness", 
    label: "Fitness",
    imageUrl: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?q=80&w=1400&auto=format&fit=crop"
  },
  { 
    id: "fragrance", 
    label: "Fragrance",
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1400&auto=format&fit=crop"
  },
];


/**
 * 7 Categories × 5 Questions × 3+ Options
 */
export const questions: Record<CategoryId, Question[]> = {
  hairCare: [
    {
      id: "hair_concern",
      text: "What is your top hair/scalp concern right now?",
      options: ["Hair fall while combing/showering", "Visible thinning near temples/crown", "Dandruff/flaky scalp", "Dry/rough hair texture"],
      imageUrl: "/images/categories/hair-care.svg"
    },
    {
      id: "hair_type",
      text: "How would you describe your current hair density?",
      options: ["Thick/full", "Medium", "Noticeably reduced"],
      imageUrl: "/images/categories/hair-care.svg"
    },
    {
      id: "scalp_type",
      text: "How does your scalp feel within 24 hours of washing?",
      options: ["Oily/greasy", "Tight/dry/itchy", "Balanced"],
      imageUrl: "/images/categories/hair-care.svg"
    },
    {
      id: "hair_damage",
      text: "How often do you use heat styling or chemical treatments?",
      options: ["3+ times/week", "1-2 times/week", "Rarely/Never"],
      imageUrl: "/images/categories/hair-care.svg"
    },
    {
      id: "hair_goal",
      text: "What result matters most in the next 8 weeks?",
      options: ["Reduce hair fall", "Improve scalp health", "Thicker/healthier look"],
      imageUrl: "/images/categories/hair-care.svg"
    },
  ],

  skinCare: [
    {
      id: "skin_type",
      text: "How does your face usually feel by midday?",
      options: ["Oily/shiny", "Dry/tight", "Oily T-zone + dry cheeks"],
      imageUrl: "/images/categories/skin-care.svg"
    },
    {
      id: "skin_concern",
      text: "What is your highest-priority skin concern?",
      options: ["Acne/pimples", "Dark spots/marks", "Early fine lines"],
      imageUrl: "/images/categories/skin-care.svg"
    },
    {
      id: "breakouts",
      text: "How often do active breakouts appear?",
      options: ["Frequent (weekly)", "Sometimes (monthly)", "Rarely"],
      imageUrl: "/images/categories/skin-care.svg"
    },
    {
      id: "sun_exposure",
      text: "How much direct sun exposure do you get most days?",
      options: ["High (1+ hour)", "Moderate (15-60 min)", "Low (<15 min)"],
      imageUrl: "/images/categories/skin-care.svg"
    },
    {
      id: "skin_goal",
      text: "What is your main skin goal for the next month?",
      options: ["Clear skin", "Fade pigmentation", "Barrier repair/hydration"],
      imageUrl: "/images/categories/skin-care.svg"
    },
  ],

  beardCare: [
    {
      id: "beard_growth",
      text: "How is your beard growth pattern?",
      options: ["Patchy areas", "Uneven but improving", "Full and even"],
      imageUrl: "/images/categories/beard-care.svg"
    },
    {
      id: "beard_issue",
      text: "What issue affects comfort most?",
      options: ["Itching/irritation", "Dry/beard dandruff", "Ingrown bumps"],
      imageUrl: "/images/categories/beard-care.svg"
    },
    {
      id: "beard_length",
      text: "Current beard length stage?",
      options: ["Stubble/short", "Medium", "Long/full"],
      imageUrl: "/images/categories/beard-care.svg"
    },
    {
      id: "beard_care",
      text: "How consistent is your beard-care routine?",
      options: ["Daily", "2-3 times/week", "Rarely"],
      imageUrl: "/images/categories/beard-care.svg"
    },
    {
      id: "beard_goal",
      text: "Primary beard goal this cycle?",
      options: ["Thicker beard", "Softer and less itchy", "Sharper defined shape"],
      imageUrl: "/images/categories/beard-care.svg"
    },
  ],

  bodyCare: [
    {
      id: "body_skin",
      text: "How does body skin usually feel after showering?",
      options: ["Dry/ashy", "Balanced", "Oily/sweaty quickly"],
      imageUrl: "/images/categories/body-care.svg"
    },
    {
      id: "body_issue",
      text: "Which body concern is most persistent?",
      options: ["Body acne/back acne", "Strong body odor", "Rough dry patches"],
      imageUrl: "/images/categories/body-care.svg"
    },
    {
      id: "sweat",
      text: "How intense is daily sweating?",
      options: ["High", "Moderate", "Low"],
      imageUrl: "/images/categories/body-care.svg"
    },
    {
      id: "shower_freq",
      text: "How often do you shower/cleanse body?",
      options: ["Daily (sometimes twice)", "Alternate days", "Irregular"],
      imageUrl: "/images/categories/body-care.svg"
    },
    {
      id: "body_goal",
      text: "Top body-care outcome you want?",
      options: ["All-day freshness", "Clear body skin", "Softer hydrated skin"],
      imageUrl: "/images/categories/body-care.svg"
    },
  ],

  healthCare: [
    {
      id: "energy",
      text: "Your daytime energy level most days?",
      options: ["Low/fatigued", "Average", "High/stable"],
      imageUrl: "/images/categories/health-care.svg"
    },
    {
      id: "sleep",
      text: "How would you rate sleep quality recently?",
      options: ["Poor (<6h or broken)", "Average", "Good (7h+ restorative)"],
      imageUrl: "/images/categories/health-care.svg"
    },
    {
      id: "stress",
      text: "How high is your stress load this month?",
      options: ["High", "Moderate", "Low"],
      imageUrl: "/images/categories/health-care.svg"
    },
    {
      id: "diet",
      text: "Which best describes your eating pattern?",
      options: ["Mostly balanced whole foods", "Mixed/irregular", "Mostly processed/high sugar"],
      imageUrl: "/images/categories/health-care.svg"
    },
    {
      id: "health_goal",
      text: "What health shift would help your appearance most?",
      options: ["Better sleep", "Higher daytime energy", "Lower stress reactivity"],
      imageUrl: "/images/categories/health-care.svg"
    },
  ],

  fitness: [
    {
      id: "activity",
      text: "Overall weekly activity level?",
      options: ["Mostly sedentary", "Moderately active", "Active most days"],
      imageUrl: "/images/categories/fitness.svg"
    },
    {
      id: "workout",
      text: "How often do you train/work out?",
      options: ["5-7 days/week", "2-4 days/week", "Rarely"],
      imageUrl: "/images/categories/fitness.svg"
    },
    {
      id: "goal",
      text: "Primary fitness objective right now?",
      options: ["Fat loss", "Muscle/strength gain", "Cardio endurance"],
      imageUrl: "/images/categories/fitness.svg"
    },
    {
      id: "injury",
      text: "Any pain/injury currently affecting training?",
      options: ["Yes (active)", "No", "Past history only"],
      imageUrl: "/images/categories/fitness.svg"
    },
    {
      id: "fitness_focus",
      text: "Which focus area should your plan prioritize?",
      options: ["Strength & posture", "Cardio stamina", "Mobility & recovery"],
      imageUrl: "/images/categories/fitness.svg"
    },
  ],

  fragrance: [
    {
      id: "scent_type",
      text: "Which scent family feels most like your style?",
      options: ["Fresh/Citrus", "Woody/Amber", "Spicy/Oriental"],
      imageUrl: "/images/categories/fragrance.svg"
    },
    {
      id: "usage",
      text: "When do you normally wear fragrance?",
      options: ["Daily work/casual", "Some days only", "Special events only"],
      imageUrl: "/images/categories/fragrance.svg"
    },
    {
      id: "strength",
      text: "Preferred projection strength?",
      options: ["Subtle/close", "Balanced", "Strong presence"],
      imageUrl: "/images/categories/fragrance.svg"
    },
    {
      id: "climate",
      text: "Your usual climate where fragrance is worn?",
      options: ["Hot/humid", "Moderate", "Cool/cold"],
      imageUrl: "/images/categories/fragrance.svg"
    },
    {
      id: "fragrance_goal",
      text: "What fragrance outcome matters most?",
      options: ["Long-lasting wear", "Unique signature scent", "Compliment-worthy trail"],
      imageUrl: "/images/categories/fragrance.svg"
    },
  ],
};
