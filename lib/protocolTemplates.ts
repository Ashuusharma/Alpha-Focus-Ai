import { CategoryId } from "@/lib/questions";

export type ClinicalCategoryId =
  | "scalp_health"
  | "acne"
  | "dark_circles"
  | "hair_loss"
  | "beard_growth"
  | "body_acne"
  | "lip_care"
  | "anti_aging";

export type ProtocolTask = {
  id: string;
  label: string;
  slot: "morning" | "night" | "weekly" | "lifestyle";
  frequency: "daily" | "alternate_days" | "weekly";
  howTo?: string;
  whyItHelps?: string;
  recommendedProduct?: string;
  caution?: string;
  durationMin?: number;
};

export type ProtocolPhase = {
  name: "Stabilization" | "Correction" | "Optimization";
  duration_days: number;
  tasks: ProtocolTask[];
};

export type ProtocolTemplate = {
  category: ClinicalCategoryId;
  phases: ProtocolPhase[];
};

export type ProtocolToleranceMode = "beginner" | "moderate" | "aggressive";

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
  product: string;
  durationMin?: number;
  caution?: string;
};

type CategoryGuidance = {
  morning: GuidedAction[];
  night: GuidedAction[];
  lifestyle: GuidedAction[];
  weekly: GuidedAction[];
};

const protocolTemplates: Record<ClinicalCategoryId, ProtocolTemplate> = {
  acne: {
    category: "acne",
    phases: [
      { name: "Stabilization", duration_days: 7, tasks: [] },
      { name: "Correction", duration_days: 14, tasks: [] },
      { name: "Optimization", duration_days: 9, tasks: [] },
    ],
  },
  hair_loss: {
    category: "hair_loss",
    phases: [
      { name: "Stabilization", duration_days: 7, tasks: [] },
      { name: "Correction", duration_days: 14, tasks: [] },
      { name: "Optimization", duration_days: 9, tasks: [] },
    ],
  },
  scalp_health: {
    category: "scalp_health",
    phases: [
      { name: "Stabilization", duration_days: 7, tasks: [] },
      { name: "Correction", duration_days: 14, tasks: [] },
      { name: "Optimization", duration_days: 9, tasks: [] },
    ],
  },
  dark_circles: {
    category: "dark_circles",
    phases: [
      { name: "Stabilization", duration_days: 7, tasks: [] },
      { name: "Correction", duration_days: 14, tasks: [] },
      { name: "Optimization", duration_days: 9, tasks: [] },
    ],
  },
  beard_growth: {
    category: "beard_growth",
    phases: [
      { name: "Stabilization", duration_days: 7, tasks: [] },
      { name: "Correction", duration_days: 14, tasks: [] },
      { name: "Optimization", duration_days: 9, tasks: [] },
    ],
  },
  body_acne: {
    category: "body_acne",
    phases: [
      { name: "Stabilization", duration_days: 7, tasks: [] },
      { name: "Correction", duration_days: 14, tasks: [] },
      { name: "Optimization", duration_days: 9, tasks: [] },
    ],
  },
  lip_care: {
    category: "lip_care",
    phases: [
      { name: "Stabilization", duration_days: 7, tasks: [] },
      { name: "Correction", duration_days: 14, tasks: [] },
      { name: "Optimization", duration_days: 9, tasks: [] },
    ],
  },
  anti_aging: {
    category: "anti_aging",
    phases: [
      { name: "Stabilization", duration_days: 7, tasks: [] },
      { name: "Correction", duration_days: 14, tasks: [] },
      { name: "Optimization", duration_days: 9, tasks: [] },
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
};

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
      label: action.label,
      slot,
      frequency: slot === "weekly" ? "weekly" : "daily",
      howTo: `${action.howTo} Today focus: ${dayFocus}.`,
      whyItHelps: action.whyItHelps,
      recommendedProduct: action.product,
      caution: action.caution,
      durationMin: action.durationMin,
    });
  }

  // Add one phase guidance anchor so each day clearly explains intent.
  tasks.unshift({
    id: `${category}-${slot}-${dayNumber}-anchor`,
    label: `${phaseName} Focus: ${dayFocus}`,
    slot,
    frequency: "daily",
    howTo: `Keep this slot simple and consistent. Complete every step in order and avoid adding new products today.`,
    whyItHelps: `Daily intent clarity reduces decision fatigue and improves adherence consistency.`,
    recommendedProduct: "Use only routine-approved products",
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
  if (mode === "aggressive") {
    return {
      morning: base.morning + 1,
      night: base.night + 1,
      lifestyle: base.lifestyle + 1,
    };
  }
  return base;
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
    label: "Weekly confidence check-in",
    slot: "weekly",
    frequency: "weekly",
    howTo: `Review this week: ${completed}/7 days complete (${adherencePct}%). ${photoDone ? "Compare before/after photos now." : "Take this week photo now for comparison."}`,
    whyItHelps: message,
    recommendedProduct: "Progress photo + adherence log",
    durationMin: 6,
  });
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
    phase.name === "Stabilization"
      ? { morning: 2, night: 1, lifestyle: 1 }
      : phase.name === "Correction"
        ? { morning: 2, night: 2, lifestyle: 1 }
        : { morning: 2, night: 1, lifestyle: 1 };

  const slotCount = applyToleranceTaskCount(baseSlotCount, options.toleranceMode || "moderate");

  let tasks = [
    ...buildSlotTasks(guidance.morning, "morning", slotCount.morning, category as ClinicalCategoryId, normalizedDay, phase.name, dayFocus),
    ...buildSlotTasks(guidance.night, "night", slotCount.night, category as ClinicalCategoryId, normalizedDay, phase.name, dayFocus),
    ...buildSlotTasks(guidance.lifestyle, "lifestyle", slotCount.lifestyle, category as ClinicalCategoryId, normalizedDay, phase.name, dayFocus),
  ];

  if (normalizedDay % 7 === 0) {
    const weeklyAction = guidance.weekly[(Math.floor(normalizedDay / 7) - 1) % guidance.weekly.length];
    tasks.push({
      id: `${category}-weekly-${normalizedDay}`,
      label: weeklyAction.label,
      slot: "weekly",
      frequency: "weekly",
      howTo: `${weeklyAction.howTo} Keep comparison conditions the same as previous check.`,
      whyItHelps: weeklyAction.whyItHelps,
      recommendedProduct: weeklyAction.product,
      durationMin: weeklyAction.durationMin || 8,
    });

    addWeeklyConfidencePrompt(tasks, category as ClinicalCategoryId, normalizedDay, options);
  }

  if (normalizedDay === 1) {
    tasks.push({
      id: `${category}-day1-baseline`,
      label: "Day 1 baseline record",
      slot: "lifestyle",
      frequency: "daily",
      howTo: "Take clear before photos and rate severity, confidence, and consistency target for next 30 days.",
      whyItHelps: "A concrete baseline makes progress visible and improves confidence.",
      recommendedProduct: "Phone notes + camera",
      durationMin: 10,
    });
  }

  if (normalizedDay === 30) {
    tasks.push({
      id: `${category}-day30-maintenance`,
      label: "Maintenance plan handoff",
      slot: "weekly",
      frequency: "weekly",
      howTo: "Finalize the 3 most effective steps and set a sustainable 4-week maintenance schedule.",
      whyItHelps: "Prevents relapse and protects gains after the 30-day program.",
      recommendedProduct: "Simple maintenance checklist",
      durationMin: 10,
    });
  }

  tasks = applySafetyRules(tasks, category as ClinicalCategoryId, options, normalizedDay);

  if (options.missedYesterday) {
    tasks = addMissedDayFallback(tasks, category as ClinicalCategoryId, normalizedDay);
  }

  const language = options.guidanceLanguage || "en";
  tasks = tasks.map((task) => localizeTask(task, language));

  return tasks;
}

export function getProtocolDurationDays(template: ProtocolTemplate) {
  return template.phases.reduce((sum, phase) => sum + phase.duration_days, 0);
}

export { protocolTemplates };
