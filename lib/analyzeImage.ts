// AI Image Analysis Engine — Full 10-category system
// In production, wire to Google Vision / AWS Rekognition / Custom TF model

export type AnalyzerType =
  | "skin"
  | "acne"
  | "dark_circles"
  | "aging"
  | "hair"
  | "scalp"
  | "beard"
  | "teeth"
  | "body_acne"
  | "lips";

export interface PhotoAngle {
  id: string;
  label: string;
  instruction: string;
  imageData: string | null;
}

export interface DetectedIssue {
  name: string;
  confidence: number;
  impact: "minor" | "moderate" | "significant";
  description: string;
  affectedArea: string; // e.g. "Forehead", "Left Cheek", "Beard Line"
}

export interface ProductRecommendation {
  name: string;
  type: string; // "Cleanser", "Serum", etc.
  keyIngredients: string[];
  ingredientBenefits: Record<string, string>;
  howToUse: string;
  whenToUse: string; // "Morning" | "Evening" | "Both"
  price: string;
  rating: number;
  imageUrl?: string;
}

export interface WeeklyRoutine {
  week: number;
  title: string;
  days: DayRoutine[];
  weeklyTip: string;
  expectedProgress: string;
}

export interface DayRoutine {
  day: string; // "Monday", "Tuesday"...
  morning: RoutineAction[];
  evening: RoutineAction[];
  specialTreatment?: RoutineAction; // e.g. mask day
}

export interface RoutineAction {
  step: number;
  product: string;
  action: string;
  duration: string; // "2 minutes", "30 seconds"
  tip?: string;
}

export interface AnalysisResult {
  type: AnalyzerType;
  confidence: number;
  detectedIssues: DetectedIssue[];
  severity: "low" | "moderate" | "high";
  recommendations: string[];
  tips: string[];
  products: ProductRecommendation[];
  weeklyRoutines: WeeklyRoutine[];
  capturedPhotos?: string[];
}

// ─── PHOTO ANGLE DEFINITIONS PER TYPE ───────────────────────────

const ANGLE_DEFINITIONS: Record<AnalyzerType, Omit<PhotoAngle, "imageData">[]> = {
  skin: [
    { id: "skin-front", label: "Front Face", instruction: "Look straight at the camera with a neutral expression. Keep your face relaxed, hair pulled back. Ensure even, natural lighting with no shadows on your face." },
    { id: "skin-left", label: "Left Profile", instruction: "Turn your head 90° to the right so your LEFT cheek faces the camera. Keep eyes looking forward. This captures jawline, cheek texture, and sideburn area." },
    { id: "skin-right", label: "Right Profile", instruction: "Turn your head 90° to the left so your RIGHT cheek faces the camera. This helps detect asymmetric issues like uneven skin tone or one-sided breakouts." },
  ],
  acne: [
    { id: "acne-front", label: "Full Face", instruction: "Face camera directly. Remove any makeup/products. We need to see every bump, redness, and mark clearly. Use bright, even light." },
    { id: "acne-tzone", label: "T-Zone Close-Up", instruction: "Bring camera close (15cm away) to your forehead, nose, and chin area. Tilt head slightly back. This captures the oiliest zone where most acne occurs." },
    { id: "acne-cheek", label: "Worst Affected Side", instruction: "Turn to show the side of your face with the most breakouts. Get close so individual spots are visible. This helps grade acne severity accurately." },
  ],
  dark_circles: [
    { id: "dc-front", label: "Eyes Straight", instruction: "Look directly at the camera. Keep eyes naturally open (don't squint or open wide). Ensure light hits your face evenly — shadows can mimic dark circles." },
    { id: "dc-up", label: "Looking Up", instruction: "Tilt your chin down slightly while looking up at the camera. This stretches the under-eye skin and reveals the true depth and color of dark circles." },
    { id: "dc-side", label: "45° Side View", instruction: "Turn head 45° and look at camera with eyes. This shows the hollow/puffiness depth under your eyes from a different angle for 3D assessment." },
  ],
  aging: [
    { id: "age-front", label: "Relaxed Face", instruction: "Look at camera with completely relaxed muscles. No smile, no frown. This reveals natural resting lines, nasolabial folds, and skin laxity." },
    { id: "age-smile", label: "Full Smile", instruction: "Give your biggest natural smile. This reveals crow's feet around eyes, laugh lines, and how your skin creases — key aging indicators." },
    { id: "age-frown", label: "Frown/Raised Brows", instruction: "Raise your eyebrows high and then frown. This reveals forehead lines (11 lines) and dynamic wrinkles that appear with expressions." },
  ],
  hair: [
    { id: "hair-front", label: "Hairline Front", instruction: "Pull hair back to fully expose your hairline. Camera at forehead level. This detects recession at temples and frontal thinning." },
    { id: "hair-top", label: "Crown / Top View", instruction: "Tilt your head down so the camera looks straight at the top/crown of your head. Use a mirror or selfie camera overhead. Critical for detecting thinning at the crown." },
    { id: "hair-side", label: "Side Profile", instruction: "Show your head from the side with hair in natural state. This reveals overall density, hair thickness, and temple recession." },
  ],
  scalp: [
    { id: "scalp-part", label: "Hair Parting", instruction: "Part your hair in the middle and show the exposed scalp line. Get close (10cm). This reveals flaking, redness, and scalp condition." },
    { id: "scalp-crown", label: "Crown Close-Up", instruction: "Tilt head forward. Part hair at crown area to expose scalp skin. Look for white flakes, redness, or oily buildup." },
    { id: "scalp-temple", label: "Temple Area", instruction: "Push hair back at temples. Show the skin near your ears and hairline. This area often shows first signs of irritation." },
  ],
  beard: [
    { id: "beard-front", label: "Beard Front View", instruction: "Face camera straight on. Keep mouth closed naturally. This shows overall beard shape, density balance, and coverage symmetry." },
    { id: "beard-side", label: "Beard Side Profile", instruction: "Turn 90° to show your beard from the side. This reveals cheek coverage, jawline beard density, and sideburn connection." },
    { id: "beard-chin", label: "Chin / Neck Line", instruction: "Tilt head up to expose beard neckline and chin underside. This shows neck growth, ingrown hairs, and chin patchiness." },
  ],
  teeth: [
    { id: "teeth-smile", label: "Full Smile", instruction: "Give a wide, natural smile showing all front teeth. Pull lips back slightly. Good lighting on teeth. This reveals staining, alignment, and gum line." },
    { id: "teeth-upper", label: "Upper Teeth", instruction: "Lift your upper lip to show top row of teeth and gums. This reveals gum health, tartar buildup, and upper tooth condition." },
    { id: "teeth-side", label: "Side Bite", instruction: "Show teeth from side angle while biting down naturally. This reveals bite alignment, overlap, and side tooth health." },
  ],
  body_acne: [
    { id: "body-back", label: "Upper Back", instruction: "Use a mirror or ask someone to photograph your upper back and shoulders. Pull shirt off completely. This is the #1 area for body acne." },
    { id: "body-chest", label: "Chest Area", instruction: "Face camera shirtless showing full chest area. This reveals breakouts along the chest center where sweat accumulates." },
    { id: "body-shoulder", label: "Shoulder Close-Up", instruction: "Show the shoulder/upper arm area close-up. Folliculitis and keratosis pilaris (bumpy skin) are common here." },
  ],
  lips: [
    { id: "lips-closed", label: "Closed Mouth", instruction: "Face camera with lips gently closed in natural position. This shows lip texture, dryness, cracks, and overall lip color." },
    { id: "lips-open", label: "Slightly Open", instruction: "Open mouth slightly to show lip margins and inner lip edge. This reveals angular cheilitis (corner cracking) and inner lip health." },
    { id: "lips-side", label: "Side View", instruction: "Turn 45° to show lip profile. This reveals lip volume, asymmetry, and the lip border definition." },
  ],
};

export function getPhotoAngles(type: AnalyzerType): PhotoAngle[] {
  return (ANGLE_DEFINITIONS[type] || ANGLE_DEFINITIONS.skin).map((a) => ({
    ...a,
    imageData: null,
  }));
}

// ─── MOCK ANALYSIS ENGINE ──────────────────────────────────────

const ANALYSIS_DATA: Record<AnalyzerType, Omit<AnalysisResult, "capturedPhotos">> = {
  skin: {
    type: "skin",
    confidence: 87,
    severity: "moderate",
    detectedIssues: [
      { name: "Oily T-Zone", confidence: 92, impact: "moderate", description: "Excess sebum production on forehead, nose, and chin. Pores appear enlarged in these areas.", affectedArea: "T-Zone (Forehead, Nose, Chin)" },
      { name: "Uneven Skin Tone", confidence: 78, impact: "moderate", description: "Hyperpigmentation spots detected on cheeks. Post-inflammatory marks from previous breakouts.", affectedArea: "Both Cheeks" },
      { name: "Dehydration Lines", confidence: 65, impact: "minor", description: "Fine surface lines caused by dehydration, not aging. Skin barrier appears compromised.", affectedArea: "Under Eyes & Cheeks" },
    ],
    recommendations: [
      "Use a gentle pH-balanced cleanser twice daily",
      "Apply niacinamide 10% serum for pore control",
      "Use vitamin C serum in morning for tone evening",
      "Lightweight gel moisturizer for hydration without oil",
      "SPF 50 sunscreen daily to prevent further pigmentation",
    ],
    tips: [
      "Don't skip moisturizer even with oily skin — dehydrated skin overproduces oil",
      "Change pillowcase every 2-3 days",
      "Stay hydrated — 3L water minimum daily",
      "Avoid touching your face throughout the day",
      "Results visible in 4-6 weeks with consistency",
    ],
    products: [
      {
        name: "CeraVe Foaming Facial Cleanser",
        type: "Cleanser",
        keyIngredients: ["Niacinamide", "Ceramides", "Hyaluronic Acid"],
        ingredientBenefits: { "Niacinamide": "Controls oil and minimizes pores", "Ceramides": "Restores skin barrier", "Hyaluronic Acid": "Draws moisture into skin" },
        howToUse: "Wet face, apply small amount, massage gently for 60 seconds in circular motions, rinse with lukewarm water",
        whenToUse: "Morning & Evening",
        price: "₹599",
        rating: 4.7,
      },
      {
        name: "The Ordinary Niacinamide 10% + Zinc 1%",
        type: "Serum",
        keyIngredients: ["Niacinamide 10%", "Zinc PCA 1%"],
        ingredientBenefits: { "Niacinamide 10%": "Reduces pore size, controls sebum, evens tone", "Zinc PCA 1%": "Regulates oil production, anti-inflammatory" },
        howToUse: "After cleansing, apply 3-4 drops to palm, press onto face gently. Avoid rubbing.",
        whenToUse: "Morning & Evening",
        price: "₹649",
        rating: 4.6,
      },
      {
        name: "Garnier Vitamin C Serum",
        type: "Serum",
        keyIngredients: ["Vitamin C 3.5%", "Salicylic Acid", "Niacinamide"],
        ingredientBenefits: { "Vitamin C 3.5%": "Brightens skin, fades dark spots", "Salicylic Acid": "Unclogs pores, gentle exfoliation", "Niacinamide": "Smooths texture" },
        howToUse: "Apply 2-3 drops after niacinamide serum, spread evenly, let absorb 2 minutes",
        whenToUse: "Morning",
        price: "₹399",
        rating: 4.3,
      },
      {
        name: "Neutrogena Hydro Boost Gel Cream",
        type: "Moisturizer",
        keyIngredients: ["Hyaluronic Acid", "Glycerin", "Dimethicone"],
        ingredientBenefits: { "Hyaluronic Acid": "Intense hydration without heaviness", "Glycerin": "Locks in moisture", "Dimethicone": "Smooths skin surface" },
        howToUse: "Apply pea-sized amount to entire face and neck after serums. Pat in gently.",
        whenToUse: "Morning & Evening",
        price: "₹899",
        rating: 4.5,
      },
      {
        name: "La Shield Sunscreen SPF 50",
        type: "Sunscreen",
        keyIngredients: ["Zinc Oxide", "Titanium Dioxide", "Niacinamide"],
        ingredientBenefits: { "Zinc Oxide": "Broad spectrum UV protection", "Titanium Dioxide": "Physical sun filter", "Niacinamide": "Reduces sun damage" },
        howToUse: "Apply generously as last step of morning routine. Reapply every 3 hours if outdoors.",
        whenToUse: "Morning",
        price: "₹499",
        rating: 4.4,
      },
    ],
    weeklyRoutines: generateWeeklyRoutines("skin"),
  },
  acne: {
    type: "acne",
    confidence: 91,
    severity: "high",
    detectedIssues: [
      { name: "Active Cystic Acne", confidence: 94, impact: "significant", description: "Deep, painful cysts detected on jawline and chin. Indicates hormonal or severe inflammatory acne requiring targeted treatment.", affectedArea: "Jawline & Chin" },
      { name: "Comedonal Acne (Blackheads/Whiteheads)", confidence: 88, impact: "moderate", description: "Clogged pores visible on nose and forehead. Mix of open (blackheads) and closed (whiteheads) comedones.", affectedArea: "Nose & Forehead" },
      { name: "Post-Inflammatory Hyperpigmentation", confidence: 82, impact: "moderate", description: "Dark marks remaining from healed acne spots. These are not scars but pigmentation that fades with treatment.", affectedArea: "Cheeks & Forehead" },
      { name: "Inflammatory Papules", confidence: 76, impact: "moderate", description: "Small red bumps indicating active bacterial infection in pores. Tender to touch.", affectedArea: "Cheeks" },
    ],
    recommendations: [
      "Use benzoyl peroxide 2.5% face wash for bacteria reduction",
      "Apply adapalene (Differin) retinoid gel nightly",
      "Use salicylic acid 2% as spot treatment",
      "Non-comedogenic moisturizer to prevent barrier damage",
      "SPF 50+ daily to prevent dark mark worsening",
    ],
    tips: [
      "Purging is normal — skin may worsen in weeks 2-4 before improving",
      "Never pop or squeeze cysts — causes scarring",
      "Introduce retinoid slowly (every other night first 2 weeks)",
      "Ice reduces cyst swelling temporarily",
      "See dermatologist if no improvement in 8 weeks",
    ],
    products: [
      {
        name: "Benzac AC 2.5% Wash",
        type: "Cleanser",
        keyIngredients: ["Benzoyl Peroxide 2.5%"],
        ingredientBenefits: { "Benzoyl Peroxide 2.5%": "Kills acne-causing P.acnes bacteria on contact with minimal irritation" },
        howToUse: "Apply to wet face, leave on 1-2 minutes as contact therapy, then rinse. Don't scrub.",
        whenToUse: "Evening",
        price: "₹450",
        rating: 4.5,
      },
      {
        name: "Adapalene Gel 0.1% (Differin)",
        type: "Retinoid Treatment",
        keyIngredients: ["Adapalene 0.1%"],
        ingredientBenefits: { "Adapalene 0.1%": "Unclogs pores at deep level, prevents new acne, speeds cell turnover, fades marks" },
        howToUse: "Apply pea-sized amount to entire face (not spots) on dry skin 20 min after washing. Avoid eyes & lips.",
        whenToUse: "Evening only",
        price: "₹399",
        rating: 4.7,
      },
      {
        name: "Cosrx BHA Blackhead Power Liquid",
        type: "Exfoliant",
        keyIngredients: ["Betaine Salicylate 4%", "Willow Bark Water"],
        ingredientBenefits: { "Betaine Salicylate 4%": "Oil-soluble acid that penetrates pores and dissolves clogs", "Willow Bark Water": "Natural anti-inflammatory, soothes redness" },
        howToUse: "After cleansing, apply with cotton pad to oily/acne areas. Wait 20 min before next product.",
        whenToUse: "Morning (alternate with retinoid)",
        price: "₹899",
        rating: 4.6,
      },
      {
        name: "Cetaphil Moisturizing Lotion",
        type: "Moisturizer",
        keyIngredients: ["Glycerin", "Dimethicone", "Sweet Almond Oil"],
        ingredientBenefits: { "Glycerin": "Humectant that draws water into skin", "Dimethicone": "Creates protective barrier without clogging pores" },
        howToUse: "Apply generously over retinoid once absorbed. Focus on dry/irritated areas.",
        whenToUse: "Morning & Evening",
        price: "₹399",
        rating: 4.4,
      },
    ],
    weeklyRoutines: generateWeeklyRoutines("acne"),
  },
  dark_circles: {
    type: "dark_circles",
    confidence: 85,
    severity: "moderate",
    detectedIssues: [
      { name: "Vascular Dark Circles", confidence: 88, impact: "moderate", description: "Bluish-purple hue under eyes caused by thin skin revealing blood vessels. Most common type in men.", affectedArea: "Under Both Eyes" },
      { name: "Under-Eye Puffiness", confidence: 79, impact: "minor", description: "Mild swelling from fluid retention. More noticeable in mornings and after salty foods.", affectedArea: "Under Eyes, Inner Corners" },
      { name: "Tear Trough Hollows", confidence: 72, impact: "moderate", description: "Natural indentation below the eye creating shadow that appears as darkness. Part structural, part volume loss.", affectedArea: "Inner Under-Eye Area" },
    ],
    recommendations: [
      "Caffeine eye cream to constrict blood vessels",
      "Retinol eye serum for collagen building (low %)",
      "Vitamin K cream to reduce vascular discoloration",
      "Cold compress/ice roller in mornings for puffiness",
      "Increase sleep to 7-8 hours consistently",
    ],
    tips: [
      "Elevate head slightly while sleeping to reduce puffiness",
      "Reduce salt intake — sodium causes water retention",
      "Cold tea bags (green/black) for 10 min reduces swelling",
      "Stay hydrated — dehydration makes circles darker",
      "Eye cream results take 6-8 weeks to see difference",
    ],
    products: [
      {
        name: "The Ordinary Caffeine Solution 5% + EGCG",
        type: "Eye Serum",
        keyIngredients: ["Caffeine 5%", "EGCG (Green Tea)"],
        ingredientBenefits: { "Caffeine 5%": "Constricts blood vessels, reduces puffiness and dark color", "EGCG (Green Tea)": "Powerful antioxidant, reduces inflammation" },
        howToUse: "Pat 1-2 drops under each eye with ring finger in gentle tapping motion. Don't pull or rub.",
        whenToUse: "Morning & Evening",
        price: "₹599",
        rating: 4.5,
      },
      {
        name: "Minimalist Retinol 0.3% Eye Cream",
        type: "Eye Cream",
        keyIngredients: ["Retinol 0.3%", "Squalane", "Pentavitin"],
        ingredientBenefits: { "Retinol 0.3%": "Boosts collagen, thickens thin under-eye skin", "Squalane": "Nourishes without irritation" },
        howToUse: "Apply a rice-grain amount under each eye at night. Avoid eyelids. Follow with moisturizer.",
        whenToUse: "Evening",
        price: "₹549",
        rating: 4.3,
      },
    ],
    weeklyRoutines: generateWeeklyRoutines("dark_circles"),
  },
  aging: {
    type: "aging",
    confidence: 83,
    severity: "moderate",
    detectedIssues: [
      { name: "Forehead Lines", confidence: 86, impact: "moderate", description: "Horizontal lines across forehead from repeated muscle movement. Deeper in the center, indicating expression habits.", affectedArea: "Forehead" },
      { name: "Crow's Feet", confidence: 81, impact: "minor", description: "Fine lines radiating from outer eye corners. More visible when smiling. Sun damage accelerates these.", affectedArea: "Outer Eye Corners" },
      { name: "Nasolabial Folds", confidence: 74, impact: "moderate", description: "Lines running from nose to mouth corners. Early deepening detected — indicates collagen loss beginning.", affectedArea: "Nose-to-Mouth Lines" },
    ],
    recommendations: [
      "Retinol serum (start 0.3%, work to 1%) for collagen",
      "Peptide complex cream for firmness",
      "Vitamin C serum 15-20% for antioxidant protection",
      "Hyaluronic acid for plumping fine lines",
      "SPF 50 religiously — #1 anti-aging product",
    ],
    tips: [
      "Retinol causes initial peeling — normal, stick with it",
      "Anti-aging is a marathon, not a sprint. 3-6 months minimum.",
      "Sleep on your back to prevent sleep lines",
      "Collagen supplements may help from inside",
      "Consider professional treatments for deeper lines (consult dermatologist)",
    ],
    products: [
      {
        name: "Olay Regenerist Retinol 24",
        type: "Night Cream",
        keyIngredients: ["Retinol", "Vitamin B3", "Peptides"],
        ingredientBenefits: { "Retinol": "Stimulates collagen, reduces wrinkle depth", "Vitamin B3": "Strengthens skin barrier", "Peptides": "Signal skin to produce more collagen" },
        howToUse: "Apply to clean, dry face at night. Use pea-sized amount. Avoid eye area.",
        whenToUse: "Evening",
        price: "₹1,299",
        rating: 4.6,
      },
      {
        name: "SkinCeuticals CE Ferulic (Dupe: Minimalist Vit C 10%)",
        type: "Vitamin C Serum",
        keyIngredients: ["L-Ascorbic Acid 10%", "Vitamin E", "Ferulic Acid"],
        ingredientBenefits: { "L-Ascorbic Acid": "Most potent antioxidant, boosts collagen, brightens", "Ferulic Acid": "Stabilizes vitamin C, doubles its effectiveness" },
        howToUse: "Apply 4-5 drops to face and neck in morning after cleansing. Let dry 2 min before moisturizer.",
        whenToUse: "Morning",
        price: "₹599",
        rating: 4.4,
      },
    ],
    weeklyRoutines: generateWeeklyRoutines("aging"),
  },
  hair: {
    type: "hair",
    confidence: 88,
    severity: "high",
    detectedIssues: [
      { name: "Frontal Hairline Recession", confidence: 94, impact: "significant", description: "Temples showing M-shaped recession pattern. Norwood Scale 2-3 estimated. Consistent with male pattern hair loss (androgenetic alopecia).", affectedArea: "Temple & Frontal Hairline" },
      { name: "Crown Thinning", confidence: 86, impact: "significant", description: "Reduced hair density at crown/vertex area. Scalp visibility increased. Early to mid-stage thinning.", affectedArea: "Crown / Top of Head" },
      { name: "Miniaturized Hairs", confidence: 78, impact: "moderate", description: "Thin, wispy hairs replacing thick terminal hairs. Sign of ongoing follicle shrinkage from DHT sensitivity.", affectedArea: "Hairline & Crown" },
    ],
    recommendations: [
      "Minoxidil 5% (Rogaine/Tugain) applied to scalp twice daily",
      "Finasteride 1mg (prescription) — consult dermatologist",
      "Ketoconazole 2% shampoo 3x/week for DHT blocking on scalp",
      "Biotin 5000mcg + Zinc supplements daily",
      "Gentle scalp massage 5 minutes daily to boost blood flow",
    ],
    tips: [
      "Minoxidil results take 3-6 months. Don't stop early.",
      "Initial shedding (weeks 2-6) is normal and a GOOD sign",
      "Hair loss is progressive — earlier treatment = better results",
      "Reduce stress — cortisol accelerates hair fall",
      "Photos monthly for tracking. Crown progress is hardest to see yourself.",
    ],
    products: [
      {
        name: "Tugain 5% Minoxidil Solution",
        type: "Hair Growth Treatment",
        keyIngredients: ["Minoxidil 5%"],
        ingredientBenefits: { "Minoxidil 5%": "Dilates blood vessels to follicles, extends growth phase, reverses miniaturization" },
        howToUse: "Apply 1ml to DRY scalp in thinning areas. Part hair to reach scalp. Massage gently. Let dry naturally.",
        whenToUse: "Morning & Evening (12 hours apart)",
        price: "₹699",
        rating: 4.5,
      },
      {
        name: "Ketoconazole 2% Anti-Dandruff Shampoo",
        type: "Medicated Shampoo",
        keyIngredients: ["Ketoconazole 2%"],
        ingredientBenefits: { "Ketoconazole 2%": "Anti-fungal that also blocks DHT on scalp. Reduces inflammation and dandruff." },
        howToUse: "Lather on scalp, leave 3-5 minutes, rinse thoroughly. Use every other wash day.",
        whenToUse: "3x per week",
        price: "₹350",
        rating: 4.4,
      },
      {
        name: "Biotin 5000mcg + Zinc Tablets",
        type: "Supplement",
        keyIngredients: ["Biotin 5000mcg", "Zinc 15mg", "Iron"],
        ingredientBenefits: { "Biotin": "Essential for keratin production (hair protein)", "Zinc": "Supports hair follicle oil glands", "Iron": "Carries oxygen to hair roots" },
        howToUse: "Take 1 tablet after breakfast with water. Consistent daily intake is crucial.",
        whenToUse: "Morning with food",
        price: "₹299",
        rating: 4.3,
      },
    ],
    weeklyRoutines: generateWeeklyRoutines("hair"),
  },
  scalp: {
    type: "scalp",
    confidence: 84,
    severity: "moderate",
    detectedIssues: [
      { name: "Dandruff / Seborrheic Dermatitis", confidence: 90, impact: "moderate", description: "White/yellowish flakes on scalp with underlying redness. Caused by Malassezia yeast overgrowth.", affectedArea: "Crown & Parting Line" },
      { name: "Scalp Oiliness", confidence: 82, impact: "minor", description: "Excessive sebum buildup at roots. Hair appears greasy within 24 hours of washing.", affectedArea: "Entire Scalp" },
      { name: "Mild Scalp Irritation", confidence: 71, impact: "minor", description: "Redness and sensitivity from product buildup or hard water. Itching reported.", affectedArea: "Temples & Behind Ears" },
    ],
    recommendations: [
      "Anti-dandruff shampoo with pyrithione zinc 2x/week",
      "Tea tree oil scalp treatment for antibacterial action",
      "Apple cider vinegar rinse weekly for pH balance",
      "Avoid hot water — use lukewarm when washing hair",
      "Scalp scrub/exfoliator once a week",
    ],
    tips: [
      "Don't scratch flakes — spreads irritation",
      "Rotate between 2 anti-dandruff shampoos to prevent resistance",
      "Hard water filter on showerhead makes a big difference",
      "Dandruff is manageable, not curable — consistent maintenance needed",
      "Stress and diet directly affect scalp health",
    ],
    products: [
      {
        name: "Head & Shoulders Clinical Strength",
        type: "Anti-Dandruff Shampoo",
        keyIngredients: ["Selenium Sulfide 1%", "Pyrithione Zinc"],
        ingredientBenefits: { "Selenium Sulfide 1%": "Slows fungal growth, reduces flaking at root cause", "Pyrithione Zinc": "Antibacterial and antifungal" },
        howToUse: "Apply to wet scalp, massage 2-3 minutes, let sit 1 minute, rinse thoroughly.",
        whenToUse: "2-3x per week",
        price: "₹450",
        rating: 4.3,
      },
    ],
    weeklyRoutines: generateWeeklyRoutines("scalp"),
  },
  beard: {
    type: "beard",
    confidence: 89,
    severity: "moderate",
    detectedIssues: [
      { name: "Patchy Beard Growth", confidence: 91, impact: "significant", description: "Significant gaps in beard density. Thinner growth on cheeks and lower jaw. Uneven distribution pattern.", affectedArea: "Cheeks & Lower Jaw" },
      { name: "Ingrown Hairs / Razor Bumps", confidence: 79, impact: "moderate", description: "Curled-back hairs trapped under skin causing red bumps. Most common along jawline and neck.", affectedArea: "Neck & Jawline" },
      { name: "Beard Dryness & Coarseness", confidence: 76, impact: "moderate", description: "Wiry texture with visible flaking beneath. Beard hair lacks moisture and natural oils.", affectedArea: "Full Beard Area" },
    ],
    recommendations: [
      "Apply beard growth oil with minoxidil-free formula daily",
      "Use beard conditioner 3x weekly for softness",
      "Exfoliate beard skin 2x/week to prevent ingrowns",
      "Biotin + Vitamin D3 supplements for growth support",
      "Trim every 2 weeks to maintain shape during growth",
    ],
    tips: [
      "Full beard transformation takes 3-6 months minimum",
      "Resist the urge to shave patchy areas — let it grow",
      "Sleep, exercise, and protein boost testosterone = beard growth",
      "A good beard brush trains hair direction over time",
      "Patience > Products. Genetics play a role but consistency helps.",
    ],
    products: [
      {
        name: "Ustraa Beard Growth Oil",
        type: "Beard Oil",
        keyIngredients: ["Redensyl", "Argan Oil", "Vitamin E"],
        ingredientBenefits: { "Redensyl": "Clinically proven to stimulate follicle stem cells", "Argan Oil": "Deep moisture, softens coarse hair", "Vitamin E": "Antioxidant that supports follicle health" },
        howToUse: "Apply 4-5 drops to palm, rub hands together, massage into beard and skin underneath.",
        whenToUse: "Morning after washing face",
        price: "₹449",
        rating: 4.3,
      },
      {
        name: "Beardo Beard Wash",
        type: "Beard Cleanser",
        keyIngredients: ["Tea Tree Oil", "Aloe Vera", "Argan Oil"],
        ingredientBenefits: { "Tea Tree Oil": "Antibacterial, prevents ingrown infections", "Aloe Vera": "Soothes irritation and itching" },
        howToUse: "Wet beard, apply small amount, work into lather for 1-2 minutes, rinse with lukewarm water.",
        whenToUse: "Every other day",
        price: "₹299",
        rating: 4.2,
      },
    ],
    weeklyRoutines: generateWeeklyRoutines("beard"),
  },
  teeth: {
    type: "teeth",
    confidence: 82,
    severity: "low",
    detectedIssues: [
      { name: "Surface Staining", confidence: 86, impact: "moderate", description: "Yellowish discoloration on front teeth from coffee, tea, or tobacco. Surface-level stain that responds well to whitening.", affectedArea: "Front Upper & Lower Teeth" },
      { name: "Mild Gum Recession", confidence: 68, impact: "minor", description: "Slight gum line pullback exposing tooth root on a couple of teeth. Can cause sensitivity.", affectedArea: "Lower Front Teeth" },
    ],
    recommendations: [
      "Whitening toothpaste with hydrogen peroxide 2x daily",
      "Electric toothbrush for better plaque removal",
      "Floss daily — gum disease starts between teeth",
      "Oil pulling with coconut oil 10 min/morning",
      "Professional cleaning every 6 months",
    ],
    tips: [
      "Brush for full 2 minutes each time — most people only do 45 seconds",
      "Wait 30 min after eating acidic food before brushing",
      "Drinking coffee through a straw reduces teeth staining",
      "Baking soda paste 1x/week gently buffs surface stains",
      "An aligned smile = easier to clean = healthier gums",
    ],
    products: [
      {
        name: "Colgate Visible White O2",
        type: "Whitening Toothpaste",
        keyIngredients: ["Hydrogen Peroxide", "Fluoride", "Micro-Polishing Agents"],
        ingredientBenefits: { "Hydrogen Peroxide": "Bleaches surface stains through oxidation", "Fluoride": "Strengthens enamel", "Micro-Polishing Agents": "Gently buff away plaque and stain" },
        howToUse: "Brush for 2 full minutes covering all surfaces. Spit, don't rinse — let fluoride work.",
        whenToUse: "Morning & Evening",
        price: "₹199",
        rating: 4.2,
      },
    ],
    weeklyRoutines: generateWeeklyRoutines("teeth"),
  },
  body_acne: {
    type: "body_acne",
    confidence: 85,
    severity: "moderate",
    detectedIssues: [
      { name: "Back Acne (Bacne)", confidence: 90, impact: "significant", description: "Inflammatory breakouts across upper back and shoulders. Caused by sweat, friction from clothing, and hormonal activity.", affectedArea: "Upper Back & Shoulders" },
      { name: "Folliculitis", confidence: 78, impact: "moderate", description: "Small red bumps around hair follicles from bacterial infection. Often caused by tight clothing or post-gym sweat.", affectedArea: "Chest & Shoulders" },
      { name: "Keratosis Pilaris", confidence: 65, impact: "minor", description: "Small rough bumps (chicken skin) on upper arms. Harmless but cosmetically bothersome. Caused by keratin plugs.", affectedArea: "Upper Arms" },
    ],
    recommendations: [
      "Benzoyl peroxide 5% body wash for back & chest",
      "Salicylic acid 2% spray for hard-to-reach back",
      "Exfoliating gloves 2x/week in shower",
      "Shower immediately after gym/sweating",
      "Wear loose cotton clothes during recovery",
    ],
    tips: [
      "Change shirts after sweating — bacteria thrives in damp fabric",
      "Wash bed sheets weekly in hot water",
      "Don't use fabric softener — it clogs body pores",
      "Back acne often needs body-specific products, not face ones",
      "Results typically faster than face acne — 3-4 weeks visible improvement",
    ],
    products: [
      {
        name: "Panoxyl 4% Benzoyl Peroxide Body Wash",
        type: "Body Wash",
        keyIngredients: ["Benzoyl Peroxide 4%"],
        ingredientBenefits: { "Benzoyl Peroxide 4%": "Kills acne bacteria on contact. Strong enough for body skin without over-drying." },
        howToUse: "Apply to wet skin of back, chest, shoulders. Leave on 1-2 minutes as contact therapy. Rinse. Pat dry.",
        whenToUse: "Daily in shower",
        price: "₹550",
        rating: 4.5,
      },
    ],
    weeklyRoutines: generateWeeklyRoutines("body_acne"),
  },
  lips: {
    type: "lips",
    confidence: 80,
    severity: "low",
    detectedIssues: [
      { name: "Chronic Lip Dryness", confidence: 84, impact: "moderate", description: "Persistent flaking and peeling of lip surface. Barrier function compromised. Possible lip licking habit exacerbating condition.", affectedArea: "Both Upper & Lower Lips" },
      { name: "Lip Pigmentation", confidence: 72, impact: "minor", description: "Darkening of lip borders and center. Caused by sun exposure, smoking, or post-inflammatory hyperpigmentation.", affectedArea: "Lip Borders" },
    ],
    recommendations: [
      "Petroleum-based lip balm (Vaseline/Aquaphor) as occlusive",
      "Lip scrub 2x/week to remove flakes gently",
      "SPF lip balm for sun protection during day",
      "Hyaluronic acid lip treatment for hydration",
      "Stop licking lips — saliva actually dries them out more",
    ],
    tips: [
      "Apply lip balm BEFORE bed — overnight repair is key",
      "Hydrate from inside — dehydration shows on lips first",
      "Avoid matte lip products while healing",
      "Lip pigmentation takes 4-8 weeks to fade with treatment",
      "Honey is a natural humectant — apply a thin layer for 10 min as mask",
    ],
    products: [
      {
        name: "Aquaphor Lip Repair",
        type: "Lip Balm",
        keyIngredients: ["Petrolatum", "Panthenol", "Shea Butter"],
        ingredientBenefits: { "Petrolatum": "Creates occlusive seal preventing moisture loss", "Panthenol": "Vitamin B5 — heals cracked skin", "Shea Butter": "Deep nourishment" },
        howToUse: "Apply thin layer whenever lips feel dry, especially before sleep and after eating.",
        whenToUse: "Throughout the day + Night",
        price: "₹349",
        rating: 4.6,
      },
    ],
    weeklyRoutines: generateWeeklyRoutines("lips"),
  },
};

// ─── WEEKLY ROUTINE GENERATOR ──────────────────────────────────

function generateWeeklyRoutines(type: AnalyzerType): WeeklyRoutine[] {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const routineTemplates: Record<string, () => WeeklyRoutine[]> = {
    skin: () => [
      buildWeek(1, "Foundation Week", "Introduce core products gently", "Skin is adjusting — slight dryness is normal", days, {
        morning: [
          { step: 1, product: "CeraVe Foaming Cleanser", action: "Wash face with lukewarm water", duration: "1 minute" },
          { step: 2, product: "Niacinamide 10% Serum", action: "Apply 3-4 drops, press into skin", duration: "30 seconds" },
          { step: 3, product: "Neutrogena Hydro Boost", action: "Moisturize entire face & neck", duration: "30 seconds" },
          { step: 4, product: "La Shield SPF 50", action: "Apply sunscreen as final step", duration: "30 seconds" },
        ],
        evening: [
          { step: 1, product: "CeraVe Foaming Cleanser", action: "Double cleanse if wore sunscreen", duration: "2 minutes" },
          { step: 2, product: "Niacinamide 10% Serum", action: "Apply to clean face", duration: "30 seconds" },
          { step: 3, product: "Neutrogena Hydro Boost", action: "Seal in moisture for overnight repair", duration: "30 seconds" },
        ],
        specialDay: { day: "Wednesday", treatment: { step: 1, product: "Gentle Exfoliating Scrub", action: "Exfoliate dead skin cells in circular motions", duration: "2 minutes", tip: "Don't scrub hard — let the product do the work" } },
      }),
      buildWeek(2, "Intensity Up", "Add vitamin C, increase frequency", "Expect slight tingling — sign ingredients are working", days, {
        morning: [
          { step: 1, product: "CeraVe Foaming Cleanser", action: "Cleanse face", duration: "1 minute" },
          { step: 2, product: "Vitamin C Serum", action: "Apply before niacinamide for brightening", duration: "30 seconds", tip: "Wait 1 min before next product" },
          { step: 3, product: "Niacinamide 10% Serum", action: "Layer for pore control", duration: "30 seconds" },
          { step: 4, product: "Neutrogena Hydro Boost", action: "Moisturize", duration: "30 seconds" },
          { step: 5, product: "La Shield SPF 50", action: "Sun protection", duration: "30 seconds" },
        ],
        evening: [
          { step: 1, product: "CeraVe Foaming Cleanser", action: "Double cleanse", duration: "2 minutes" },
          { step: 2, product: "Niacinamide 10% Serum", action: "Evening application", duration: "30 seconds" },
          { step: 3, product: "Neutrogena Hydro Boost", action: "Night moisture", duration: "30 seconds" },
        ],
        specialDay: { day: "Saturday", treatment: { step: 1, product: "Clay Mask (Multani Mitti)", action: "Apply thin layer, leave 10 min, rinse", duration: "15 minutes", tip: "Use once/week for deep pore cleaning" } },
      }),
      buildWeek(3, "Peak Performance", "Full routine active, body adapting", "This is where visible changes begin — take photos!", days, {
        morning: [
          { step: 1, product: "CeraVe Foaming Cleanser", action: "Cleanse", duration: "1 minute" },
          { step: 2, product: "Vitamin C Serum", action: "Brighten & protect", duration: "30 seconds" },
          { step: 3, product: "Niacinamide 10% Serum", action: "Oil control", duration: "30 seconds" },
          { step: 4, product: "Neutrogena Hydro Boost", action: "Hydrate", duration: "30 seconds" },
          { step: 5, product: "La Shield SPF 50", action: "Protect", duration: "30 seconds" },
        ],
        evening: [
          { step: 1, product: "CeraVe Foaming Cleanser", action: "Deep cleanse", duration: "2 minutes" },
          { step: 2, product: "Niacinamide 10% Serum", action: "Evening treatment", duration: "30 seconds" },
          { step: 3, product: "Centella Repair Cream", action: "Overnight recovery", duration: "30 seconds", tip: "Focus on problem areas" },
        ],
        specialDay: { day: "Wednesday", treatment: { step: 1, product: "AHA/BHA Exfoliant", action: "Apply with cotton pad, wait 20 min", duration: "20 minutes", tip: "Chemical exfoliation is gentler and more effective than physical scrubs" } },
      }),
      buildWeek(4, "Maintenance & Assessment", "Evaluate progress, adjust products", "Compare Day 1 photo vs now — track improvements!", days, {
        morning: [
          { step: 1, product: "CeraVe Foaming Cleanser", action: "Cleanse", duration: "1 minute" },
          { step: 2, product: "Vitamin C Serum", action: "Brighten", duration: "30 seconds" },
          { step: 3, product: "Niacinamide 10% Serum", action: "Treat", duration: "30 seconds" },
          { step: 4, product: "Neutrogena Hydro Boost", action: "Hydrate", duration: "30 seconds" },
          { step: 5, product: "La Shield SPF 50", action: "Protect", duration: "30 seconds" },
        ],
        evening: [
          { step: 1, product: "CeraVe Foaming Cleanser", action: "Cleanse", duration: "2 minutes" },
          { step: 2, product: "Niacinamide 10% Serum", action: "Treat", duration: "30 seconds" },
          { step: 3, product: "Neutrogena Hydro Boost", action: "Night moisture", duration: "30 seconds" },
        ],
        specialDay: { day: "Saturday", treatment: { step: 1, product: "Sheet Mask (Hydrating)", action: "Apply for 15-20 min, pat remaining essence", duration: "20 minutes", tip: "A reward for 4 weeks of consistency!" } },
      }),
    ],
    default: () => [
      buildWeek(1, "Getting Started", "Introduce products slowly", "Your body needs time to adjust to new routine", days, {
        morning: [
          { step: 1, product: "Primary Cleanser", action: "Cleanse the target area", duration: "1 minute" },
          { step: 2, product: "Treatment Product", action: "Apply to affected areas", duration: "1 minute" },
          { step: 3, product: "Moisturizer/Protector", action: "Lock in treatment", duration: "30 seconds" },
        ],
        evening: [
          { step: 1, product: "Primary Cleanser", action: "Clean off day's buildup", duration: "1 minute" },
          { step: 2, product: "Night Treatment", action: "Stronger treatment overnight", duration: "1 minute" },
        ],
      }),
      buildWeek(2, "Building Consistency", "Increase product usage", "Stay consistent — habits form in 21 days", days, {
        morning: [
          { step: 1, product: "Primary Cleanser", action: "Cleanse", duration: "1 minute" },
          { step: 2, product: "Active Treatment", action: "Full application", duration: "1 minute" },
          { step: 3, product: "Moisturizer/Protector", action: "Protect", duration: "30 seconds" },
        ],
        evening: [
          { step: 1, product: "Primary Cleanser", action: "Deep clean", duration: "2 minutes" },
          { step: 2, product: "Night Treatment", action: "Intensive repair", duration: "1 minute" },
          { step: 3, product: "Night Moisturizer", action: "Seal in treatments", duration: "30 seconds" },
        ],
      }),
      buildWeek(3, "Full Intensity", "All products active", "Results should become visible now", days, {
        morning: [
          { step: 1, product: "Primary Cleanser", action: "Cleanse", duration: "1 minute" },
          { step: 2, product: "Active Serum/Treatment", action: "Treat", duration: "1 minute" },
          { step: 3, product: "Secondary Treatment", action: "Layer", duration: "30 seconds" },
          { step: 4, product: "Moisturizer + SPF", action: "Protect", duration: "30 seconds" },
        ],
        evening: [
          { step: 1, product: "Primary Cleanser", action: "Deep clean", duration: "2 minutes" },
          { step: 2, product: "Intensive Night Treatment", action: "Repair", duration: "1 minute" },
          { step: 3, product: "Night Cream", action: "Nourish", duration: "30 seconds" },
        ],
      }),
      buildWeek(4, "Assess & Maintain", "Evaluate progress", "Compare before & after — celebrate wins!", days, {
        morning: [
          { step: 1, product: "Primary Cleanser", action: "Cleanse", duration: "1 minute" },
          { step: 2, product: "Maintenance Treatment", action: "Sustain results", duration: "1 minute" },
          { step: 3, product: "Moisturizer + SPF", action: "Daily protection", duration: "30 seconds" },
        ],
        evening: [
          { step: 1, product: "Primary Cleanser", action: "Cleanse", duration: "2 minutes" },
          { step: 2, product: "Night Treatment", action: "Continue repair", duration: "1 minute" },
          { step: 3, product: "Night Cream", action: "Seal", duration: "30 seconds" },
        ],
      }),
    ],
  };

  const generator = routineTemplates[type] || routineTemplates.default;
  return generator();
}

interface WeekBuildConfig {
  morning: RoutineAction[];
  evening: RoutineAction[];
  specialDay?: { day: string; treatment: RoutineAction };
}

function buildWeek(
  weekNum: number,
  title: string,
  weeklyTip: string,
  expectedProgress: string,
  days: string[],
  config: WeekBuildConfig
): WeeklyRoutine {
  return {
    week: weekNum,
    title,
    days: days.map((day) => ({
      day,
      morning: config.morning,
      evening: config.evening,
      specialTreatment:
        config.specialDay && config.specialDay.day === day
          ? config.specialDay.treatment
          : undefined,
    })),
    weeklyTip,
    expectedProgress,
  };
}

// ─── MAIN ANALYSIS FUNCTION ───────────────────────────────────

export async function analyzeImage(
  imageData: string | string[],
  analyzerType: AnalyzerType
): Promise<AnalysisResult> {
  // Simulate API processing time (1.5-3s)
  await new Promise((res) => setTimeout(res, 1500 + Math.random() * 1500));

  const data = ANALYSIS_DATA[analyzerType] || ANALYSIS_DATA.skin;

  // Slightly randomize confidence for realism
  const jitter = Math.floor(Math.random() * 6) - 3;
  
  return {
    ...data,
    confidence: Math.min(99, Math.max(60, data.confidence + jitter)),
    capturedPhotos: Array.isArray(imageData) ? imageData : [imageData],
  };
}
