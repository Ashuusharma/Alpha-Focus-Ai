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
  /** Natural Hindi translation of `label`. Falls back to `label` if unset. */
  labelHi?: string;
}

export interface Question {
  id: string;
  text: string;
  domain: string;
  weight: number;
  options: QuestionOption[];
  imageUrl?: string;
  context?: string;
  /** Natural Hindi translation of `text`. Falls back to `text` if unset. */
  textHi?: string;
  /** One relevant emoji shown alongside the question — presentational only. */
  emoji?: string;
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

/**
 * Human-friendly section labels/descriptions for each domain string, shown
 * in the assessment header instead of the raw snake_case domain id.
 * Content-only (labels/copy) — does not change which domain a question
 * belongs to or how scoring groups by domain.
 */
export interface DomainMeta {
  label: string;
  labelHi: string;
  description: string;
  descriptionHi: string;
}

export const domainMeta: Record<string, DomainMeta> = {
  inflammation: { label: "Scalp Irritation", labelHi: "स्कैल्प में जलन", description: "Redness, itching, or burning on the scalp.", descriptionHi: "स्कैल्प में लालिमा, खुजली या जलन।" },
  sebum_balance: { label: "Oil Balance", labelHi: "तेल का संतुलन", description: "How oily or dry your scalp gets.", descriptionHi: "आपकी स्कैल्प कितनी तैलीय या रूखी होती है।" },
  barrier_integrity: { label: "Scalp Sensitivity", labelHi: "स्कैल्प की संवेदनशीलता", description: "How your scalp reacts to products or weather.", descriptionHi: "मौसम या प्रोडक्ट बदलने पर स्कैल्प कैसे रिएक्ट करती है।" },
  shedding_risk: { label: "Hair Shedding", labelHi: "बाल झड़ना", description: "How much hair you're losing day to day.", descriptionHi: "रोज़ाना कितने बाल झड़ते हैं।" },
  stress_impact: { label: "Stress Connection", labelHi: "तनाव का असर", description: "Whether stress makes scalp issues worse.", descriptionHi: "क्या तनाव बढ़ने पर स्कैल्प की समस्या बढ़ जाती है।" },
  sleep_impact: { label: "Sleep Connection", labelHi: "नींद का असर", description: "Whether poor sleep affects your scalp.", descriptionHi: "क्या कम नींद का असर स्कैल्प पर पड़ता है।" },
  hygiene_pattern: { label: "Wash Routine", labelHi: "सफाई की आदत", description: "How consistently you clean the area.", descriptionHi: "आप कितनी नियमितता से सफाई करते हैं।" },
  inflammatory_load: { label: "Active Breakouts", labelHi: "सक्रिय पिंपल्स", description: "Painful, red, or swollen pimples.", descriptionHi: "दर्द भरे, लाल या सूजे हुए पिंपल्स।" },
  pore_clogging: { label: "Clogged Pores", labelHi: "बंद रोमछिद्र", description: "Blackheads and clogged pores in oily areas.", descriptionHi: "तैलीय हिस्सों में ब्लैकहेड्स और बंद रोमछिद्र।" },
  hormonal_factor: { label: "Hormonal Pattern", labelHi: "हार्मोनल पैटर्न", description: "Breakouts tied to a monthly pattern or jawline.", descriptionHi: "मासिक पैटर्न या जॉलाइन पर होने वाले पिंपल्स।" },
  stress_trigger: { label: "Stress Trigger", labelHi: "तनाव से असर", description: "Whether stress sets off breakouts for you.", descriptionHi: "क्या तनाव बढ़ने पर पिंपल्स बढ़ जाते हैं।" },
  diet_trigger: { label: "Food Triggers", labelHi: "खानपान का असर", description: "Whether certain foods seem to trigger flare-ups.", descriptionHi: "क्या कुछ खास खाना खाने के बाद समस्या बढ़ती है।" },
  sun_damage: { label: "Sun Exposure", labelHi: "धूप का संपर्क", description: "How much unprotected sun you get.", descriptionHi: "बिना सुरक्षा के आप कितनी धूप में रहते हैं।" },
  post_acne_marking: { label: "Marks & Pigmentation", labelHi: "दाग और पिगमेंटेशन", description: "Dark marks left behind after pimples heal.", descriptionHi: "पिंपल्स ठीक होने के बाद बचे काले दाग।" },
  vascular_factor: { label: "Visible Veins", labelHi: "दिखती नसें", description: "Bluish or purple tint from blood vessels showing through thin skin.", descriptionHi: "पतली त्वचा से झलकती नीली-बैंगनी नसें।" },
  pigmentation: { label: "Skin Tone / Pigmentation", labelHi: "त्वचा का रंग", description: "Darkening of skin colour in the area.", descriptionHi: "उस हिस्से की त्वचा का रंग गहरा होना।" },
  sleep_deprivation: { label: "Sleep Quality", labelHi: "नींद की गुणवत्ता", description: "How much restful sleep you're actually getting.", descriptionHi: "आपको वाकई कितनी अच्छी नींद मिलती है।" },
  dehydration: { label: "Hydration Level", labelHi: "पानी की कमी", description: "Whether the area looks dry or crepey by evening.", descriptionHi: "शाम तक क्या यह हिस्सा रूखा या मुरझाया दिखता है।" },
  stress_load: { label: "Everyday Stress", labelHi: "रोज़ का तनाव", description: "How much ongoing stress you're carrying.", descriptionHi: "आप इन दिनों कितना तनाव महसूस करते हैं।" },
  follicle_density: { label: "Overall Density", labelHi: "बालों का घनत्व", description: "How much thinner your hair looks compared to before.", descriptionHi: "पहले की तुलना में बाल कितने पतले लगते हैं।" },
  recession_pattern: { label: "Hairline Pattern", labelHi: "हेयरलाइन का पैटर्न", description: "Whether your hairline is visibly moving back.", descriptionHi: "क्या आपकी हेयरलाइन साफ़ तौर पर पीछे खिसक रही है।" },
  shedding_rate: { label: "Daily Hair Fall", labelHi: "रोज़ाना बाल झड़ना", description: "How many strands you notice during wash or combing.", descriptionHi: "नहाते या कंघी करते समय कितने बाल झड़ते हैं।" },
  hormonal_risk: { label: "Family History", labelHi: "पारिवारिक इतिहास", description: "Whether early hair loss runs in your family.", descriptionHi: "क्या परिवार में जल्दी गंजापन आने का इतिहास है।" },
  nutritional_risk: { label: "Diet & Nutrition", labelHi: "आहार और पोषण", description: "Whether your diet may be missing things hair needs.", descriptionHi: "क्या आपके खानपान में बालों के लिए ज़रूरी पोषण की कमी है।" },
  stress_factor: { label: "Stress Connection", labelHi: "तनाव का असर", description: "Whether stress seems to increase your hair fall.", descriptionHi: "क्या तनाव बढ़ने पर बाल ज़्यादा झड़ते हैं।" },
  patchiness: { label: "Even Growth", labelHi: "बराबर growth", description: "How patchy or uneven your beard looks.", descriptionHi: "आपकी दाढ़ी कितनी असमान या पैची दिखती है।" },
  density: { label: "Thickness", labelHi: "घनापन", description: "How thick your beard grows where you want it.", descriptionHi: "जहां आप चाहते हैं वहां दाढ़ी कितनी घनी उगती है।" },
  ingrown_risk: { label: "Ingrown Hairs", labelHi: "अंदर बढ़े बाल", description: "How often you get small painful bumps from trimming/shaving.", descriptionHi: "ट्रिमिंग या शेविंग के बाद कितनी बार छोटे दर्द भरे दाने होते हैं।" },
  irritation_level: { label: "Shaving Irritation", labelHi: "शेविंग से जलन", description: "Redness or razor burn after grooming.", descriptionHi: "ग्रूमिंग के बाद लालिमा या जलन।" },
  grooming_pattern: { label: "Care Routine", labelHi: "देखभाल की आदत", description: "How consistently you clean and moisturise your beard.", descriptionHi: "आप कितनी नियमितता से दाढ़ी साफ़ और मॉइस्चराइज़ करते हैं।" },
  sweat_load: { label: "Sweat Exposure", labelHi: "पसीने का असर", description: "How long sweat sits on skin before you shower.", descriptionHi: "नहाने से पहले पसीना कितनी देर त्वचा पर रहता है।" },
  friction_irritation: { label: "Friction from Clothing", labelHi: "कपड़ों से रगड़", description: "Tight clothes or bags rubbing on the skin.", descriptionHi: "टाइट कपड़े या बैग से त्वचा पर रगड़।" },
  bacterial_risk: { label: "Recurring Breakouts", labelHi: "बार-बार होने वाले दाने", description: "How often inflamed bumps come back in the same spots.", descriptionHi: "एक ही जगह पर सूजे हुए दाने कितनी बार वापस आते हैं।" },
  sweat_volume: { label: "How Much You Sweat", labelHi: "कितना पसीना आता है", description: "How quickly you sweat through a normal day.", descriptionHi: "सामान्य दिन में आपको कितनी जल्दी पसीना आता है।" },
  odor_intensity: { label: "Smell by Midday", labelHi: "दोपहर तक बदबू", description: "Whether odour is noticeable even after bathing.", descriptionHi: "नहाने के बाद भी क्या बदबू महसूस होती है।" },
  fabric_retention: { label: "Clothes Holding Smell", labelHi: "कपड़ों में बदबू", description: "Whether shirts/gym clothes hold on to smell.", descriptionHi: "क्या शर्ट या जिम के कपड़ों में बदबू रह जाती है।" },
  hygiene_gap: { label: "Time Between Washes", labelHi: "नहाने के बीच का समय", description: "How often a busy day delays a bath or clean clothes.", descriptionHi: "व्यस्त दिन में नहाने या कपड़े बदलने में कितनी देरी होती है।" },
  climate_trigger: { label: "Heat & Humidity", labelHi: "गर्मी और उमस", description: "How strongly heat or humidity sets off sweating.", descriptionHi: "गर्मी या उमस में पसीना कितनी तेज़ी से आता है।" },
  dryness_index: { label: "Dryness & Peeling", labelHi: "रूखापन और पपड़ी", description: "How often lips feel dry, cracked, or peeling.", descriptionHi: "होंठ कितनी बार रूखे, फटे या पपड़ीदार महसूस होते हैं।" },
  sun_exposure: { label: "Sun Exposure", labelHi: "धूप का संपर्क", description: "How much direct, unprotected sun this area gets.", descriptionHi: "यह हिस्सा बिना सुरक्षा के कितनी धूप में रहता है।" },
  hydration_level: { label: "Hydration Through the Day", labelHi: "दिनभर की नमी", description: "Whether it stays comfortable or dries out by evening.", descriptionHi: "क्या शाम तक यह आरामदायक रहता है या सूख जाता है।" },
  wrinkle_depth: { label: "Fine Lines", labelHi: "महीन रेखाएं", description: "How visible fine lines are when your face is relaxed.", descriptionHi: "चेहरा सामान्य होने पर महीन रेखाएं कितनी दिखती हैं।" },
  elasticity_loss: { label: "Skin Firmness", labelHi: "त्वचा की कसावट", description: "Whether skin feels less firm or bouncy than before.", descriptionHi: "क्या त्वचा पहले जितनी कसी हुई नहीं लगती।" },
  collagen_decline: { label: "Lasting Creases", labelHi: "स्थायी रेखाएं", description: "Whether expression lines stay after your face relaxes.", descriptionHi: "चेहरा सामान्य होने के बाद भी क्या रेखाएं बनी रहती हैं।" },
  stress_oxidation: { label: "Lifestyle Load", labelHi: "जीवनशैली का असर", description: "Stress, pollution, and habits that speed up visible aging.", descriptionHi: "तनाव, प्रदूषण और आदतें जो उम्र के असर को तेज़ करती हैं।" },
  tone_unevenness: { label: "Even Skin Tone", labelHi: "त्वचा का रंग", description: "How patchy or uneven your skin tone looks.", descriptionHi: "आपकी त्वचा का रंग कितना असमान दिखता है।" },
  tan_buildup: { label: "Tan Build-up", labelHi: "टैनिंग", description: "How stubborn tanning is from commute or outdoor time.", descriptionHi: "आने-जाने या बाहर रहने से हुई टैनिंग कितनी जिद्दी है।" },
  texture_roughness: { label: "Skin Texture", labelHi: "त्वचा की बनावट", description: "How rough or tired skin feels by evening.", descriptionHi: "शाम तक त्वचा कितनी खुरदरी या थकी हुई लगती है।" },
  sleep_stress: { label: "Tired Look", labelHi: "थका हुआ रूप", description: "Whether poor sleep or stress shows on your face.", descriptionHi: "क्या कम नींद या तनाव चेहरे पर दिखता है।" },
  hydration_drop: { label: "Skin Hydration", labelHi: "त्वचा की नमी", description: "Whether skin looks flat or dehydrated despite moisturiser.", descriptionHi: "मॉइस्चराइज़र लगाने के बाद भी क्या त्वचा बेजान लगती है।" },
  pollution_exposure: { label: "Pollution Exposure", labelHi: "प्रदूषण का असर", description: "Daily dust, smoke, and traffic exposure.", descriptionHi: "रोज़ाना धूल, धुएं और ट्रैफिक का सामना।" },
  sleep_debt: { label: "Sleep Debt", labelHi: "नींद की कमी", description: "How many days a week you wake up under-rested.", descriptionHi: "हफ्ते में कितने दिन आप अधूरी नींद के साथ उठते हैं।" },
  midday_crash: { label: "Energy Crash", labelHi: "ऊर्जा में गिरावट", description: "How strong your post-lunch or evening slump is.", descriptionHi: "दोपहर के खाने या शाम को ऊर्जा कितनी गिरती है।" },
  hydration_gap: { label: "Water Intake", labelHi: "पानी की मात्रा", description: "How much water you're actually drinking most days.", descriptionHi: "आप ज़्यादातर दिनों में कितना पानी पीते हैं।" },
  stress_burden: { label: "Mental Load", labelHi: "मानसिक भार", description: "How much work or personal stress you're carrying right now.", descriptionHi: "इन दिनों आप कितना काम या व्यक्तिगत तनाव झेल रहे हैं।" },
  meal_quality: { label: "Meal Consistency", labelHi: "खाने की नियमितता", description: "Skipped meals or heavy/fried food leaving you drained.", descriptionHi: "खाना छोड़ना या तला-भुना खाना जो आपको थका देता है।" },
  screen_overload: { label: "Screen Time at Night", labelHi: "रात में स्क्रीन टाइम", description: "Late-night screen use cutting into sleep.", descriptionHi: "देर रात स्क्रीन देखना जो नींद कम कर देता है।" },
  soreness_load: { label: "Muscle Soreness", labelHi: "मांसपेशियों में दर्द", description: "How long soreness lingers after training.", descriptionHi: "एक्सरसाइज़ के बाद दर्द कितनी देर रहता है।" },
  recovery_sleep: { label: "Recovery Sleep", labelHi: "रिकवरी नींद", description: "Whether poor sleep is hurting your performance.", descriptionHi: "क्या कम नींद आपके परफॉर्मेंस को नुकसान पहुंचा रही है।" },
  protein_intake: { label: "Protein Intake", labelHi: "प्रोटीन का सेवन", description: "How consistent your protein intake is across meals.", descriptionHi: "आपके खाने में प्रोटीन कितनी नियमितता से शामिल होता है।" },
  training_balance: { label: "Training Balance", labelHi: "ट्रेनिंग का संतुलन", description: "Whether you're pushing hard with no easy/recovery days.", descriptionHi: "क्या आप बिना आराम के दिन लिए लगातार ज़ोर लगाते हैं।" },
  injury_risk: { label: "Nagging Pain", labelHi: "बार-बार होने वाला दर्द", description: "Joint or muscle niggles that limit consistency.", descriptionHi: "जोड़ों या मांसपेशियों का दर्द जो आपकी नियमितता रोकता है।" },
};

export interface CategoryIntro {
  title: string;
  titleHi: string;
  tagline: string;
  taglineHi: string;
  description: string;
  descriptionHi: string;
}

/** Short, warm per-category intro copy for the assessment welcome screen and the AI Lab. */
export const categoryIntro: Record<ClinicalCategoryId, CategoryIntro> = {
  scalp_health: {
    title: "Scalp Health",
    titleHi: "स्कैल्प हेल्थ",
    tagline: "Healthy hair starts with a healthy scalp.",
    taglineHi: "स्वस्थ बालों की शुरुआत स्वस्थ स्कैल्प से होती है।",
    description: "A few quick questions about oiliness, itching, and shedding so we can build the right routine.",
    descriptionHi: "तेल, खुजली और बाल झड़ने से जुड़े कुछ छोटे सवाल — सही रूटीन बनाने के लिए।",
  },
  acne: {
    title: "Acne",
    titleHi: "एक्ने",
    tagline: "Clear skin starts beneath the surface.",
    taglineHi: "साफ़ त्वचा की शुरुआत अंदर से होती है।",
    description: "Tell us about your breakouts, triggers, and skin habits so your plan targets the real cause.",
    descriptionHi: "अपने पिंपल्स, कारणों और आदतों के बारे में बताएं — ताकि हम असली वजह पर काम कर सकें।",
  },
  dark_circles: {
    title: "Dark Circles",
    titleHi: "डार्क सर्कल्स",
    tagline: "Bright eyes tell the story of good recovery.",
    taglineHi: "चमकती आंखें अच्छी रिकवरी की कहानी बताती हैं।",
    description: "Under-eye darkness can come from sleep, pigmentation, or visible veins — let's figure out which is yours.",
    descriptionHi: "आंखों के नीचे कालापन नींद, पिगमेंटेशन या नसों की वजह से हो सकता है — चलिए पता करते हैं आपकी वजह क्या है।",
  },
  hair_loss: {
    title: "Hair Loss",
    titleHi: "बाल झड़ना",
    tagline: "Understanding your hair is the first step to keeping it.",
    taglineHi: "बालों को समझना ही उन्हें बचाने का पहला कदम है।",
    description: "A few questions about shedding, family history, and diet to build a plan that fits your pattern.",
    descriptionHi: "बाल झड़ना, पारिवारिक इतिहास और खानपान से जुड़े कुछ सवाल — आपके पैटर्न के हिसाब से प्लान बनाने के लिए।",
  },
  beard_growth: {
    title: "Beard Growth",
    titleHi: "दाढ़ी की ग्रोथ",
    tagline: "Every beard grows on its own timeline.",
    taglineHi: "हर दाढ़ी की अपनी रफ़्तार होती है।",
    description: "Tell us about patchiness, ingrown hairs, and your grooming routine.",
    descriptionHi: "पैची ग्रोथ, अंदर बढ़े बाल और आपकी ग्रूमिंग आदतों के बारे में बताएं।",
  },
  body_acne: {
    title: "Body Acne",
    titleHi: "बॉडी एक्ने",
    tagline: "Comfortable skin starts with the right routine.",
    taglineHi: "आरामदायक त्वचा की शुरुआत सही रूटीन से होती है।",
    description: "Sweat, friction, and hygiene timing all play a role — let's find your pattern.",
    descriptionHi: "पसीना, रगड़ और सफाई का समय — सब मिलकर असर डालते हैं, चलिए आपका पैटर्न समझते हैं।",
  },
  body_odor: {
    title: "Body Odor / Sweat",
    titleHi: "बॉडी ओडर / पसीना",
    tagline: "Fresh all day starts with knowing your triggers.",
    taglineHi: "दिनभर तरोताज़ा रहने की शुरुआत अपने ट्रिगर्स को समझने से होती है।",
    description: "A few honest questions about sweat, clothing, and daily habits.",
    descriptionHi: "पसीने, कपड़ों और रोज़ की आदतों के बारे में कुछ ईमानदार सवाल।",
  },
  lip_care: {
    title: "Lip Care",
    titleHi: "लिप केयर",
    tagline: "Soft lips start with the right protection.",
    taglineHi: "मुलायम होंठों की शुरुआत सही सुरक्षा से होती है।",
    description: "Dryness, sun exposure, and hydration habits — let's map out yours.",
    descriptionHi: "रूखापन, धूप और नमी की आदतें — चलिए आपकी स्थिति समझते हैं।",
  },
  anti_aging: {
    title: "Anti-Aging",
    titleHi: "एंटी-एजिंग",
    tagline: "Confident skin ages on its own terms.",
    taglineHi: "आत्मविश्वासी त्वचा अपनी शर्तों पर उम्र बढ़ाती है।",
    description: "Fine lines, firmness, and sun exposure — a few questions to build your prevention plan.",
    descriptionHi: "महीन रेखाएं, कसावट और धूप का असर — आपकी सुरक्षा योजना बनाने के लिए कुछ सवाल।",
  },
  skin_dullness: {
    title: "Skin Dullness",
    titleHi: "त्वचा की बेजानता",
    tagline: "Real glow comes from understanding your skin.",
    taglineHi: "असली निखार त्वचा को समझने से आता है।",
    description: "Tan, texture, and tiredness — let's see what's holding your glow back.",
    descriptionHi: "टैन, बनावट और थकान — चलिए देखते हैं आपकी चमक को क्या रोक रहा है।",
  },
  energy_fatigue: {
    title: "Energy / Fatigue",
    titleHi: "ऊर्जा / थकान",
    tagline: "Real energy starts with understanding your recovery.",
    taglineHi: "असली ऊर्जा की शुरुआत अपनी रिकवरी को समझने से होती है।",
    description: "Sleep, hydration, and stress all affect your energy — let's find your biggest lever.",
    descriptionHi: "नींद, पानी और तनाव — सब आपकी ऊर्जा पर असर डालते हैं, चलिए सबसे बड़ी वजह ढूंढते हैं।",
  },
  fitness_recovery: {
    title: "Fitness / Recovery",
    titleHi: "फिटनेस / रिकवरी",
    tagline: "Better recovery means better performance.",
    taglineHi: "बेहतर रिकवरी का मतलब है बेहतर परफॉर्मेंस।",
    description: "Soreness, sleep, and training balance — a few questions to protect your progress.",
    descriptionHi: "दर्द, नींद और ट्रेनिंग का संतुलन — आपकी प्रगति बचाने के लिए कुछ सवाल।",
  },
};

// Frequency-style option set shared where a question is fundamentally
// "how often" — kept as one constant so the four labels stay worded
// consistently across every question that uses it. Scores are unchanged
// from the original S4-S1 preset (4=highest severity/frequency ... 1=lowest).
const FREQ = [
  { label: "Almost every day", score: 4, labelHi: "लगभग हर दिन" },
  { label: "A few times a week", score: 3, labelHi: "हफ्ते में कुछ बार" },
  { label: "Occasionally", score: 2, labelHi: "कभी-कभी" },
  { label: "Rarely or never", score: 1, labelHi: "शायद ही कभी" },
];

const clinicalQuestions: Record<ClinicalCategoryId, Question[]> = {
  scalp_health: [
    { id: "scalp_inflammation_symptoms", emoji: "🔥", domain: "inflammation", weight: 1.4,
      text: "How often does your scalp feel red, itchy, or like it's burning?",
      textHi: "आपकी स्कैल्प कितनी बार लाल, खुजलीदार या जलन भरी महसूस होती है?",
      options: FREQ },
    { id: "scalp_oil_pattern", emoji: "💧", domain: "sebum_balance", weight: 1.2,
      text: "How oily does your scalp feel by the end of the day after washing?",
      textHi: "धोने के बाद, दिन के अंत तक आपकी स्कैल्प कितनी तैलीय महसूस होती है?",
      options: [
        { label: "Very oily", score: 4, labelHi: "बहुत तैलीय" },
        { label: "A bit oily by evening", score: 3, labelHi: "शाम तक थोड़ी तैलीय" },
        { label: "Balanced", score: 2, labelHi: "संतुलित" },
        { label: "Dry or tight", score: 1, labelHi: "रूखी या कसी हुई" },
      ] },
    { id: "scalp_barrier_reactivity", emoji: "⚡", domain: "barrier_integrity", weight: 1.3,
      text: "Does your scalp react badly to new products or a change in weather?",
      textHi: "क्या नए प्रोडक्ट या मौसम बदलने पर आपकी स्कैल्प तुरंत रिएक्ट करती है?",
      options: FREQ },
    { id: "scalp_shedding_frequency", emoji: "🌀", domain: "shedding_risk", weight: 1.4,
      text: "Compared to normal, how much more hair are you noticing fall out daily?",
      textHi: "सामान्य से, आपको रोज़ाना कितने ज़्यादा बाल झड़ते दिख रहे हैं?",
      options: [
        { label: "A lot more than usual", score: 4, labelHi: "सामान्य से बहुत ज़्यादा" },
        { label: "Noticeably more", score: 3, labelHi: "साफ़ तौर पर ज़्यादा" },
        { label: "Slightly more", score: 2, labelHi: "थोड़ा ज़्यादा" },
        { label: "About the same as always", score: 1, labelHi: "हमेशा जितना ही" },
      ] },
    { id: "scalp_stress_correlation", emoji: "😣", domain: "stress_impact", weight: 1.1,
      text: "Do your scalp problems get worse during stressful periods?",
      textHi: "क्या तनाव भरे समय में आपकी स्कैल्प की समस्या बढ़ जाती है?",
      options: FREQ },
    { id: "scalp_sleep_quality", emoji: "😴", domain: "sleep_impact", weight: 1.0,
      text: "After a bad night's sleep, does your scalp feel more irritated the next day?",
      textHi: "रात की खराब नींद के बाद, अगले दिन क्या स्कैल्प ज़्यादा परेशान करती है?",
      options: FREQ },
    { id: "scalp_hygiene_frequency", emoji: "🚿", domain: "hygiene_pattern", weight: 1.0,
      text: "How well does your current wash routine keep up with your scalp's oil and sweat?",
      textHi: "आपका मौजूदा धोने का रूटीन स्कैल्प के तेल और पसीने को कितना संभाल पाता है?",
      options: [
        { label: "Not well at all", score: 4, labelHi: "बिल्कुल नहीं" },
        { label: "Sometimes falls behind", score: 3, labelHi: "कभी-कभी पीछे रह जाता है" },
        { label: "Mostly keeps up", score: 2, labelHi: "ज़्यादातर संभल जाता है" },
        { label: "Always on top of it", score: 1, labelHi: "हमेशा पूरी तरह संभला हुआ" },
      ] },
  ],
  acne: [
    { id: "acne_inflammatory_activity", emoji: "🔴", domain: "inflammatory_load", weight: 1.5,
      text: "How many painful, red, or swollen pimples do you usually have in a week?",
      textHi: "एक हफ्ते में आपके आमतौर पर कितने दर्द भरे, लाल या सूजे हुए पिंपल्स होते हैं?",
      options: FREQ },
    { id: "acne_pore_congestion", emoji: "🕳️", domain: "pore_clogging", weight: 1.2,
      text: "How often do you get blackheads or clogged pores in your oily areas?",
      textHi: "आपके तैलीय हिस्सों में ब्लैकहेड्स या बंद रोमछिद्र कितनी बार होते हैं?",
      options: FREQ },
    { id: "acne_hormonal_pattern", emoji: "📅", domain: "hormonal_factor", weight: 1.3,
      text: "Do your breakouts tend to follow a monthly pattern, or show up mainly on your jawline/chin?",
      textHi: "क्या आपके पिंपल्स एक मासिक पैटर्न में आते हैं, या ज़्यादातर जॉलाइन/ठुड्डी पर होते हैं?",
      options: FREQ },
    { id: "acne_stress_trigger", emoji: "😖", domain: "stress_trigger", weight: 1.0,
      text: "When you're stressed, do you notice more breakouts soon after?",
      textHi: "जब आप तनाव में होते हैं, क्या उसके बाद जल्दी पिंपल्स बढ़ जाते हैं?",
      options: FREQ },
    { id: "acne_diet_trigger", emoji: "🍕", domain: "diet_trigger", weight: 1.0,
      text: "Do sugary, oily, or dairy-heavy meals seem to bring on breakouts for you?",
      textHi: "क्या मीठा, तला हुआ या डेयरी वाला खाना खाने के बाद पिंपल्स बढ़ जाते हैं?",
      options: FREQ },
    { id: "acne_uv_exposure", emoji: "☀️", domain: "sun_damage", weight: 0.9,
      text: "How much time do you spend in direct sun without sunscreen?",
      textHi: "आप बिना सनस्क्रीन के सीधी धूप में कितना समय बिताते हैं?",
      options: FREQ },
    { id: "acne_post_marks", emoji: "🎯", domain: "post_acne_marking", weight: 1.1,
      text: "How noticeable are the dark marks left behind after your pimples heal?",
      textHi: "पिंपल्स ठीक होने के बाद बचे काले दाग कितने साफ़ दिखते हैं?",
      options: FREQ },
  ],
  dark_circles: [
    { id: "dc_vascular_visibility", emoji: "👁️", domain: "vascular_factor", weight: 1.3,
      text: "Can you see a bluish or purple tint under your eyes?",
      textHi: "क्या आपको आंखों के नीचे नीला या बैंगनी रंग दिखता है?",
      options: FREQ },
    { id: "dc_pigmentation_depth", emoji: "🎨", domain: "pigmentation", weight: 1.4,
      text: "How much darker is the skin under your eyes compared to the rest of your face?",
      textHi: "आपके चेहरे के बाकी हिस्से की तुलना में आंखों के नीचे की त्वचा कितनी गहरी है?",
      options: FREQ },
    { id: "dc_sleep_deprivation", emoji: "😴", domain: "sleep_deprivation", weight: 1.2,
      text: "How often do you get less than 7 hours of good sleep?",
      textHi: "आपको कितनी बार 7 घंटे से कम अच्छी नींद मिलती है?",
      options: FREQ },
    { id: "dc_dehydration_status", emoji: "🏜️", domain: "dehydration", weight: 1.0,
      text: "By the end of the day, does the under-eye area look dry or crepey?",
      textHi: "दिन के अंत तक, क्या आंखों के नीचे का हिस्सा रूखा या मुरझाया दिखता है?",
      options: FREQ },
    { id: "dc_stress_load", emoji: "😓", domain: "stress_load", weight: 1.0,
      text: "How much stress have you been under this past month?",
      textHi: "पिछले महीने आप कितने तनाव में रहे हैं?",
      options: FREQ },
  ],
  hair_loss: [
    { id: "hl_follicle_density", emoji: "🧑", domain: "follicle_density", weight: 1.5,
      text: "Compared to a few years ago, how much thinner does your hair look overall?",
      textHi: "कुछ साल पहले की तुलना में, आपके बाल कुल मिलाकर कितने पतले दिखते हैं?",
      options: FREQ },
    { id: "hl_recession_pattern", emoji: "📏", domain: "recession_pattern", weight: 1.3,
      text: "Is your hairline visibly moving back at the front or temples?",
      textHi: "क्या आपकी हेयरलाइन सामने या कनपटी पर साफ़ तौर पर पीछे खिसक रही है?",
      options: FREQ },
    { id: "hl_shedding_rate", emoji: "🌀", domain: "shedding_rate", weight: 1.3,
      text: "How many strands do you notice falling out during a wash or comb?",
      textHi: "नहाते या कंघी करते समय आपको कितने बाल झड़ते दिखते हैं?",
      options: FREQ },
    { id: "hl_hormonal_risk", emoji: "👨‍👦", domain: "hormonal_risk", weight: 1.2,
      text: "Do men in your family — father, uncles, or grandfathers — have a history of going bald early?",
      textHi: "क्या आपके परिवार के पुरुषों — पिता, चाचा या दादा — में जल्दी गंजेपन का इतिहास है?",
      options: FREQ },
    { id: "hl_nutritional_risk", emoji: "🥗", domain: "nutritional_risk", weight: 1.0,
      text: "How often does your diet skip protein, iron, or other nutrients your hair needs?",
      textHi: "आपके खाने में प्रोटीन, आयरन या ज़रूरी पोषक तत्व कितनी बार छूट जाते हैं?",
      options: FREQ },
    { id: "hl_stress_factor", emoji: "😣", domain: "stress_factor", weight: 1.0,
      text: "During stressful periods, do you notice your hair fall increasing?",
      textHi: "तनाव भरे समय में, क्या आपको बाल झड़ना बढ़ता हुआ दिखता है?",
      options: FREQ },
  ],
  beard_growth: [
    { id: "bg_patchiness_level", emoji: "🗺️", domain: "patchiness", weight: 1.4,
      text: "How patchy or uneven does your beard growth look?",
      textHi: "आपकी दाढ़ी की ग्रोथ कितनी पैची या असमान दिखती है?",
      options: FREQ },
    { id: "bg_density_level", emoji: "🧔", domain: "density", weight: 1.3,
      text: "How thick does your beard grow in the areas you want it to fill in?",
      textHi: "जहां आप चाहते हैं, वहां आपकी दाढ़ी कितनी घनी उगती है?",
      options: [
        { label: "Very thin", score: 4, labelHi: "बहुत पतली" },
        { label: "Somewhat thin", score: 3, labelHi: "थोड़ी पतली" },
        { label: "Reasonably full", score: 2, labelHi: "काफ़ी घनी" },
        { label: "Thick and full", score: 1, labelHi: "घनी और भरपूर" },
      ] },
    { id: "bg_ingrown_tendency", emoji: "😖", domain: "ingrown_risk", weight: 1.1,
      text: "How often do you get small, painful bumps after trimming or shaving?",
      textHi: "ट्रिमिंग या शेविंग के बाद कितनी बार छोटे, दर्द भरे दाने निकलते हैं?",
      options: FREQ },
    { id: "bg_irritation_pattern", emoji: "🔥", domain: "irritation_level", weight: 1.1,
      text: "How often does shaving or trimming leave your skin red or irritated?",
      textHi: "शेविंग या ट्रिमिंग के बाद त्वचा कितनी बार लाल या परेशान हो जाती है?",
      options: FREQ },
    { id: "bg_grooming_hygiene", emoji: "🧴", domain: "grooming_pattern", weight: 1.0,
      text: "How consistently do you wash, exfoliate, and moisturise under your beard?",
      textHi: "आप दाढ़ी के नीचे कितनी नियमितता से धोते, एक्सफोलिएट और मॉइस्चराइज़ करते हैं?",
      options: [
        { label: "Rarely", score: 4, labelHi: "शायद ही कभी" },
        { label: "Sometimes", score: 3, labelHi: "कभी-कभी" },
        { label: "Most days", score: 2, labelHi: "ज़्यादातर दिन" },
        { label: "Every day", score: 1, labelHi: "हर दिन" },
      ] },
  ],
  body_acne: [
    { id: "ba_sweat_load", emoji: "💦", domain: "sweat_load", weight: 1.3,
      text: "After exercising, how long does sweat usually stay on your skin before you shower?",
      textHi: "एक्सरसाइज़ के बाद, नहाने से पहले पसीना कितनी देर त्वचा पर रहता है?",
      options: [
        { label: "Over an hour", score: 4, labelHi: "एक घंटे से ज़्यादा" },
        { label: "30-60 minutes", score: 3, labelHi: "30-60 मिनट" },
        { label: "A short while", score: 2, labelHi: "थोड़ी देर" },
        { label: "I shower right away", score: 1, labelHi: "मैं तुरंत नहा लेता हूं" },
      ] },
    { id: "ba_friction_irritation", emoji: "🎒", domain: "friction_irritation", weight: 1.1,
      text: "Do tight clothes or a backpack seem to make your body breakouts worse?",
      textHi: "क्या टाइट कपड़े या बैकपैक आपके बॉडी एक्ने को बढ़ा देते हैं?",
      options: FREQ },
    { id: "ba_bacterial_risk", emoji: "🔴", domain: "bacterial_risk", weight: 1.4,
      text: "How often do inflamed, pus-filled bumps come back in the same spots?",
      textHi: "एक ही जगह पर सूजे हुए, मवाद भरे दाने कितनी बार वापस आते हैं?",
      options: FREQ },
    { id: "ba_hygiene_pattern", emoji: "🚿", domain: "hygiene_pattern", weight: 1.0,
      text: "How consistent are you about showering and changing clothes after sweating?",
      textHi: "पसीना आने के बाद नहाने और कपड़े बदलने में आप कितने नियमित हैं?",
      options: [
        { label: "Not very consistent", score: 4, labelHi: "बहुत नियमित नहीं" },
        { label: "Somewhat inconsistent", score: 3, labelHi: "थोड़ा अनियमित" },
        { label: "Mostly consistent", score: 2, labelHi: "ज़्यादातर नियमित" },
        { label: "Always right away", score: 1, labelHi: "हमेशा तुरंत" },
      ] },
  ],
  body_odor: [
    { id: "bo_sweat_volume", emoji: "💦", domain: "sweat_volume", weight: 1.3,
      text: "On a normal day, how quickly do your underarms, chest, or groin get sweaty?",
      textHi: "सामान्य दिन में, आपकी बगल, छाती या कमर कितनी जल्दी पसीने से भर जाती है?",
      options: FREQ },
    { id: "bo_odor_intensity", emoji: "👃", domain: "odor_intensity", weight: 1.5,
      text: "By midday, is body odor noticeable even after bathing and using deodorant?",
      textHi: "दोपहर तक, क्या नहाने और डियोड्रेंट लगाने के बाद भी बदबू महसूस होती है?",
      options: FREQ },
    { id: "bo_fabric_retention", emoji: "👕", domain: "fabric_retention", weight: 1.1,
      text: "Do your shirts or gym clothes hold on to smell even after just one wear?",
      textHi: "क्या एक बार पहनने के बाद भी आपकी शर्ट या जिम के कपड़ों में बदबू रह जाती है?",
      options: FREQ },
    { id: "bo_hygiene_gap", emoji: "⏰", domain: "hygiene_gap", weight: 1.2,
      text: "How often does a long commute, workout, or work day delay your bath or a change of clothes?",
      textHi: "लंबा सफर, वर्कआउट या काम का दिन आपके नहाने या कपड़े बदलने में कितनी बार देरी करता है?",
      options: FREQ },
    { id: "bo_climate_trigger", emoji: "🥵", domain: "climate_trigger", weight: 1.0,
      text: "Do heat, humidity, or wearing a helmet/backpack make you sweat a lot more?",
      textHi: "क्या गर्मी, उमस या हेलमेट/बैकपैक पहनने से आपको बहुत ज़्यादा पसीना आता है?",
      options: FREQ },
    { id: "bo_diet_trigger", emoji: "🧅", domain: "diet_trigger", weight: 0.9,
      text: "Do onion-garlic heavy meals, alcohol, or not drinking enough water seem to worsen your body smell?",
      textHi: "क्या प्याज़-लहसुन वाला खाना, शराब या कम पानी पीना आपकी बदबू को बढ़ा देता है?",
      options: FREQ },
  ],
  lip_care: [
    { id: "lip_dryness_index", emoji: "🏜️", domain: "dryness_index", weight: 1.4,
      text: "How often do your lips feel dry, cracked, or peeling?",
      textHi: "आपके होंठ कितनी बार रूखे, फटे या पपड़ीदार महसूस होते हैं?",
      options: FREQ },
    { id: "lip_pigmentation_depth", emoji: "🎨", domain: "pigmentation", weight: 1.2,
      text: "How much darker are your lips compared to their natural colour?",
      textHi: "आपके होंठ अपने प्राकृतिक रंग से कितने गहरे दिखते हैं?",
      options: FREQ },
    { id: "lip_uv_exposure", emoji: "☀️", domain: "sun_exposure", weight: 1.0,
      text: "How often are your lips out in direct sun without any protection?",
      textHi: "आपके होंठ बिना किसी सुरक्षा के कितनी बार सीधी धूप में रहते हैं?",
      options: FREQ },
    { id: "lip_hydration_level", emoji: "💧", domain: "hydration_level", weight: 1.0,
      text: "How well do your lips stay hydrated through the day?",
      textHi: "दिनभर आपके होंठ कितनी अच्छी तरह नम रहते हैं?",
      options: [
        { label: "Very poorly — always dry", score: 4, labelHi: "बहुत खराब — हमेशा रूखे" },
        { label: "Inconsistent", score: 3, labelHi: "कभी ठीक, कभी नहीं" },
        { label: "Mostly stable", score: 2, labelHi: "ज़्यादातर ठीक" },
        { label: "Consistently well hydrated", score: 1, labelHi: "हमेशा अच्छी तरह नम" },
      ] },
  ],
  anti_aging: [
    { id: "age_wrinkle_depth", emoji: "🔍", domain: "wrinkle_depth", weight: 1.4,
      text: "When your face is relaxed, how visible are fine lines or wrinkles?",
      textHi: "जब आपका चेहरा सामान्य होता है, तो महीन रेखाएं या झुर्रियां कितनी दिखती हैं?",
      options: FREQ },
    { id: "age_elasticity_loss", emoji: "🎈", domain: "elasticity_loss", weight: 1.3,
      text: "Does your skin feel less firm or bouncy than it used to?",
      textHi: "क्या आपकी त्वचा पहले जितनी कसी हुई या लचीली नहीं लगती?",
      options: FREQ },
    { id: "age_uv_burden", emoji: "☀️", domain: "sun_exposure", weight: 1.1,
      text: "How often are you in the sun without applying SPF?",
      textHi: "आप बिना SPF लगाए कितनी बार धूप में रहते हैं?",
      options: FREQ },
    { id: "age_collagen_decline", emoji: "😊", domain: "collagen_decline", weight: 1.2,
      text: "After you smile or frown, how long do the lines stay before fully smoothing out?",
      textHi: "मुस्कुराने या भौंहें सिकोड़ने के बाद, रेखाएं पूरी तरह गायब होने में कितना समय लगता है?",
      options: FREQ },
    { id: "age_stress_oxidation", emoji: "🌆", domain: "stress_oxidation", weight: 1.0,
      text: "How much stress, pollution, or poor sleep have you been dealing with lately?",
      textHi: "हाल ही में आप कितने तनाव, प्रदूषण या कम नींद से जूझ रहे हैं?",
      options: FREQ },
  ],
  skin_dullness: [
    { id: "sd_tone_unevenness", emoji: "🎨", domain: "tone_unevenness", weight: 1.4,
      text: "How patchy or uneven does your skin tone look across your forehead, cheeks, and mouth area?",
      textHi: "आपके माथे, गालों और मुंह के आसपास त्वचा का रंग कितना असमान दिखता है?",
      options: FREQ },
    { id: "sd_tan_buildup", emoji: "☀️", domain: "tan_buildup", weight: 1.2,
      text: "How stubborn is the tan you get from commuting, sports, or outdoor time?",
      textHi: "आने-जाने, खेलने या बाहर रहने से हुई टैनिंग कितनी जिद्दी है?",
      options: FREQ },
    { id: "sd_texture_roughness", emoji: "🪨", domain: "texture_roughness", weight: 1.1,
      text: "By evening, how rough or tired does your skin feel to touch?",
      textHi: "शाम तक, आपकी त्वचा छूने पर कितनी खुरदरी या थकी हुई लगती है?",
      options: FREQ },
    { id: "sd_sleep_stress", emoji: "😴", domain: "sleep_stress", weight: 1.0,
      text: "Do poor sleep or stress make your face look tired or lifeless?",
      textHi: "क्या कम नींद या तनाव आपके चेहरे को थका हुआ या बेजान दिखा देता है?",
      options: FREQ },
    { id: "sd_hydration_drop", emoji: "💧", domain: "hydration_drop", weight: 1.0,
      text: "Even after moisturiser, does your skin still look flat or dehydrated?",
      textHi: "मॉइस्चराइज़र लगाने के बाद भी, क्या त्वचा बेजान या रूखी दिखती है?",
      options: FREQ },
    { id: "sd_pollution_exposure", emoji: "🌫️", domain: "pollution_exposure", weight: 1.0,
      text: "How much dust, smoke, or traffic pollution does your skin deal with daily?",
      textHi: "आपकी त्वचा रोज़ाना कितनी धूल, धुएं या ट्रैफिक प्रदूषण का सामना करती है?",
      options: FREQ },
  ],
  energy_fatigue: [
    { id: "ef_sleep_debt", emoji: "😴", domain: "sleep_debt", weight: 1.4,
      text: "How many days a week do you wake up still feeling tired?",
      textHi: "हफ्ते में कितने दिन आप थका हुआ महसूस करते हुए उठते हैं?",
      options: [
        { label: "Almost every day", score: 4, labelHi: "लगभग हर दिन" },
        { label: "4-5 days a week", score: 3, labelHi: "हफ्ते में 4-5 दिन" },
        { label: "1-3 days a week", score: 2, labelHi: "हफ्ते में 1-3 दिन" },
        { label: "Rarely", score: 1, labelHi: "शायद ही कभी" },
      ] },
    { id: "ef_midday_crash", emoji: "🥱", domain: "midday_crash", weight: 1.2,
      text: "How strong is your energy crash after lunch or in the early evening?",
      textHi: "दोपहर के खाने के बाद या शाम को आपकी ऊर्जा कितनी गिरती है?",
      options: FREQ },
    { id: "ef_hydration_gap", emoji: "💧", domain: "hydration_gap", weight: 1.0,
      text: "How often do you drink less than 2-2.5 litres of water in a day?",
      textHi: "आप कितनी बार दिनभर में 2-2.5 लीटर से कम पानी पीते हैं?",
      options: FREQ },
    { id: "ef_stress_burden", emoji: "😓", domain: "stress_burden", weight: 1.2,
      text: "How much is work, family, or daily pressure draining your energy right now?",
      textHi: "इन दिनों काम, परिवार या रोज़मर्रा का दबाव आपकी ऊर्जा कितनी छीन रहा है?",
      options: FREQ },
    { id: "ef_meal_quality", emoji: "🍔", domain: "meal_quality", weight: 1.0,
      text: "How often do skipped meals, fried snacks, or late dinners leave you feeling heavy or drained?",
      textHi: "खाना छोड़ना, तला-भुना नाश्ता या देर रात का खाना आपको कितनी बार थका हुआ महसूस कराता है?",
      options: FREQ },
    { id: "ef_screen_overload", emoji: "📱", domain: "screen_overload", weight: 0.9,
      text: "Does using your phone late at night make the next day noticeably harder?",
      textHi: "क्या देर रात फोन चलाना अगले दिन को साफ़ तौर पर मुश्किल बना देता है?",
      options: FREQ },
  ],
  fitness_recovery: [
    { id: "fr_soreness_load", emoji: "💪", domain: "soreness_load", weight: 1.3,
      text: "How often does muscle soreness stick around long enough to affect your next workout or workday?",
      textHi: "मांसपेशियों का दर्द कितनी बार इतनी देर रहता है कि अगली एक्सरसाइज़ या काम पर असर पड़े?",
      options: FREQ },
    { id: "fr_recovery_sleep", emoji: "😴", domain: "recovery_sleep", weight: 1.2,
      text: "How often does poor sleep or late nights hurt your gym performance or recovery?",
      textHi: "कम नींद या देर रात जागना आपके जिम परफॉर्मेंस या रिकवरी को कितनी बार नुकसान पहुंचाता है?",
      options: FREQ },
    { id: "fr_protein_intake", emoji: "🍗", domain: "protein_intake", weight: 1.1,
      text: "How consistent is your protein intake across breakfast, lunch, and dinner?",
      textHi: "नाश्ते, दोपहर और रात के खाने में आपका प्रोटीन सेवन कितना नियमित है?",
      options: [
        { label: "Very inconsistent", score: 4, labelHi: "बहुत अनियमित" },
        { label: "Somewhat inconsistent", score: 3, labelHi: "थोड़ा अनियमित" },
        { label: "Fairly consistent", score: 2, labelHi: "काफ़ी नियमित" },
        { label: "Very consistent", score: 1, labelHi: "बहुत नियमित" },
      ] },
    { id: "fr_hydration_gap", emoji: "💧", domain: "hydration_gap", weight: 1.0,
      text: "How often do you train or play sport without planning water or electrolytes?",
      textHi: "आप बिना पानी या इलेक्ट्रोलाइट्स की योजना बनाए कितनी बार ट्रेनिंग या खेल करते हैं?",
      options: FREQ },
    { id: "fr_training_balance", emoji: "🏋️", domain: "training_balance", weight: 1.1,
      text: "How often do you train hard with no easy day, stretching, or warm-up?",
      textHi: "आप बिना आराम के दिन, स्ट्रेचिंग या वार्म-अप के कितनी बार ज़ोर से ट्रेनिंग करते हैं?",
      options: FREQ },
    { id: "fr_injury_risk", emoji: "🦵", domain: "injury_risk", weight: 1.3,
      text: "Do niggles in your knees, shoulders, back, or ankles limit how consistently you train?",
      textHi: "क्या घुटनों, कंधों, पीठ या टखनों का दर्द आपकी नियमित ट्रेनिंग में रुकावट डालता है?",
      options: FREQ },
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
