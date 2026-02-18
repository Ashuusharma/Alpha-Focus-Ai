// Grooming Challenge Engine
// 1-month, 2-month, 3-month challenges with daily tasks, streaks, and rewards

export type ChallengeDuration = "1-month" | "2-month" | "3-month";

export interface ChallengeTask {
  day: number;
  title: string;
  description: string;
  category: "skincare" | "haircare" | "grooming" | "fitness" | "nutrition" | "mindset";
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  completed: boolean;
  completedAt?: string;
}

export interface ChallengeWeek {
  week: number;
  theme: string;
  description: string;
  tasks: ChallengeTask[];
  bonusTask?: ChallengeTask;
}

export interface Challenge {
  id: string;
  title: string;
  subtitle: string;
  duration: ChallengeDuration;
  totalDays: number;
  icon: string;
  color: string;
  description: string;
  benefits: string[];
  weeks: ChallengeWeek[];
  startedAt?: string;
  completedTasks: number;
  streak: number;
  longestStreak: number;
  totalXP: number;
  isActive: boolean;
}

export interface ChallengeProgress {
  challengeId: string;
  completedDays: number[];
  streak: number;
  longestStreak: number;
  totalXP: number;
  startedAt: string;
  lastCompletedAt?: string;
}

// ─── CHALLENGE DEFINITIONS ────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  skincare: "🧴",
  haircare: "💇",
  grooming: "✂️",
  fitness: "💪",
  nutrition: "🥗",
  mindset: "🧠",
};

function generateOneMonthChallenge(): ChallengeWeek[] {
  return [
    {
      week: 1,
      theme: "Build The Foundation",
      description: "Establish basic grooming habits. No skipping — consistency is king.",
      tasks: [
        { day: 1, title: "Start a Skincare Routine", description: "Wash face with cleanser morning & night. Apply moisturizer after. Take a 'Day 1' selfie for progress tracking.", category: "skincare", difficulty: "easy", xpReward: 10, completed: false },
        { day: 2, title: "Hydration Check", description: "Drink 3 liters of water today. Track with a bottle. Set hourly reminders if needed.", category: "nutrition", difficulty: "easy", xpReward: 10, completed: false },
        { day: 3, title: "Trim & Shape", description: "Trim beard/stubble to a clean shape. Define neckline. Clean nose & ear hair. Look sharper instantly.", category: "grooming", difficulty: "medium", xpReward: 15, completed: false },
        { day: 4, title: "Hair Wash Day", description: "Use proper shampoo (sulfate-free if possible). Condition ends only. Don't rub with towel — pat dry.", category: "haircare", difficulty: "easy", xpReward: 10, completed: false },
        { day: 5, title: "Sunscreen Every Day", description: "Apply SPF 30+ before going out. Even on cloudy days. This single habit prevents 80% of aging.", category: "skincare", difficulty: "easy", xpReward: 10, completed: false },
        { day: 6, title: "20-Min Workout", description: "Do 20 minutes of any exercise: push-ups, squats, walk. Exercise boosts blood flow to skin & hair.", category: "fitness", difficulty: "medium", xpReward: 15, completed: false },
        { day: 7, title: "Grooming Sunday Reset", description: "Full grooming session: face wash, scrub, trim nails, clean ears, moisturize. Start the week fresh.", category: "grooming", difficulty: "medium", xpReward: 20, completed: false },
      ],
      bonusTask: { day: 7, title: "Week 1 Photo", description: "Take a progress photo from the same angle as Day 1. Save it — you'll thank yourself later.", category: "mindset", difficulty: "easy", xpReward: 25, completed: false },
    },
    {
      week: 2,
      theme: "Level Up Products",
      description: "Introduce active ingredients. Your skin is now ready for the next level.",
      tasks: [
        { day: 8, title: "Add a Serum", description: "Introduce Niacinamide or Vitamin C serum after cleansing. 3-4 drops, press into skin. Do this daily from now.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 9, title: "Oral Care Upgrade", description: "Brush for full 2 minutes (use timer). Floss tonight. Consider mouthwash. Your smile matters.", category: "grooming", difficulty: "easy", xpReward: 10, completed: false },
        { day: 10, title: "Protein-Rich Meal", description: "Eat at least 100g protein today (chicken, eggs, paneer, dal). Protein = building block for hair, skin, nails.", category: "nutrition", difficulty: "medium", xpReward: 15, completed: false },
        { day: 11, title: "Scalp Massage", description: "Spend 5 minutes massaging your scalp in circular motions. Increases blood flow. Can do with or without oil.", category: "haircare", difficulty: "easy", xpReward: 10, completed: false },
        { day: 12, title: "Lip Care", description: "Exfoliate lips gently with sugar scrub. Apply lip balm with SPF. Repeat balm throughout the day.", category: "skincare", difficulty: "easy", xpReward: 10, completed: false },
        { day: 13, title: "Posture Check", description: "Stand tall all day. Set 3 reminders to check posture. Good posture = better jawline appearance + confidence.", category: "fitness", difficulty: "medium", xpReward: 15, completed: false },
        { day: 14, title: "Mid-Challenge Review", description: "Compare Day 1 and Day 14 photos side by side. Journal what habits stuck and what you need to work on.", category: "mindset", difficulty: "easy", xpReward: 20, completed: false },
      ],
    },
    {
      week: 3,
      theme: "Consistency is the Secret",
      description: "This is where most people quit. You won't. The gap between you and them starts here.",
      tasks: [
        { day: 15, title: "Face Mask Night", description: "Apply a clay mask (multani mitti works great) for 10-15 minutes. Rinse. Moisturize. Deep pore cleanse.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 16, title: "No-Sugar Day", description: "Zero added sugar today. Sugar causes inflammation = breakouts + dull skin. Read labels carefully.", category: "nutrition", difficulty: "hard", xpReward: 25, completed: false },
        { day: 17, title: "Fragrance Game", description: "Apply cologne properly: wrists, behind ears, neck. Less is more. Let people discover your scent, not be hit by it.", category: "grooming", difficulty: "easy", xpReward: 10, completed: false },
        { day: 18, title: "Hair Styling Practice", description: "Try a new hairstyle. Watch a YouTube tutorial. Use product (wax/clay/pomade). Style makes a massive difference.", category: "haircare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 19, title: "Cold Water Rinse", description: "End your shower with 30 seconds of cold water. Tightens pores, boosts circulation, builds mental toughness.", category: "fitness", difficulty: "hard", xpReward: 20, completed: false },
        { day: 20, title: "Exfoliate Day", description: "Use chemical exfoliant (AHA/BHA) or gentle physical scrub on face. Don't scrub hard. Removes dead cells for glow.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 21, title: "3-Week Milestone!", description: "You've built a HABIT. Science says 21 days forms a habit. This routine is now part of you. Celebrate properly.", category: "mindset", difficulty: "easy", xpReward: 30, completed: false },
      ],
      bonusTask: { day: 21, title: "Progress Selfie #3", description: "Third progress photo. The difference from Day 1 should genuinely surprise you.", category: "mindset", difficulty: "easy", xpReward: 25, completed: false },
    },
    {
      week: 4,
      theme: "The New You",
      description: "Final week. Lock in your transformation. Build systems that last beyond this challenge.",
      tasks: [
        { day: 22, title: "Eye Care Focus", description: "Apply caffeine eye cream morning & night. Get 7+ hours sleep tonight. Dark circles take consistency.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 23, title: "Full Body Grooming", description: "Manage body hair (back, chest, arms as preferred). Trim, shave, or leave styled. Intentional grooming > neglect.", category: "grooming", difficulty: "medium", xpReward: 15, completed: false },
        { day: 24, title: "Meal Prep Skin Foods", description: "Eat these today: salmon/walnuts (omega-3), spinach (iron), blueberries (antioxidants), eggs (biotin).", category: "nutrition", difficulty: "medium", xpReward: 15, completed: false },
        { day: 25, title: "Beard/Shave Mastery", description: "If bearded: oil, brush, shape it perfectly. If clean-shaven: pre-shave oil, sharp razor, aftershave balm.", category: "grooming", difficulty: "medium", xpReward: 15, completed: false },
        { day: 26, title: "Morning Routine Under 15 Min", description: "Time yourself: cleanse, serum, moisturize, sunscreen, style hair. Get it under 15 minutes. Efficiency = sustainability.", category: "skincare", difficulty: "hard", xpReward: 20, completed: false },
        { day: 27, title: "Rest & Recover", description: "No harsh products today. Just cleanse and moisturize. Skin needs rest days too. Drink extra water.", category: "skincare", difficulty: "easy", xpReward: 10, completed: false },
        { day: 28, title: "Challenge Complete! Final Photo", description: "Take final progress photo. Compare Day 1 vs Day 28 side by side. Share your transformation (optional but powerful).", category: "mindset", difficulty: "easy", xpReward: 50, completed: false },
      ],
      bonusTask: { day: 28, title: "Write Your Next Goals", description: "Write down 3 grooming goals for next month. The challenge ends but the journey continues.", category: "mindset", difficulty: "easy", xpReward: 30, completed: false },
    },
  ];
}

function generateTwoMonthChallenge(): ChallengeWeek[] {
  const month1 = generateOneMonthChallenge();
  const month2: ChallengeWeek[] = [
    {
      week: 5,
      theme: "Advanced Skincare",
      description: "Time to introduce stronger actives. Your skin barrier is now prepared.",
      tasks: [
        { day: 29, title: "Introduce Retinol", description: "Start retinol 0.3% every OTHER night. Apply pea-size after moisturizer (buffer method). THIS is the gold standard.", category: "skincare", difficulty: "hard", xpReward: 25, completed: false },
        { day: 30, title: "Double Cleanse Method", description: "Evening: oil/balm cleanser first to dissolve sunscreen, then regular cleanser. Game-changing for clear skin.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 31, title: "Supplements Stack", description: "Start: Biotin, Zinc, Vitamin D3, Omega-3. These target hair, skin, and nail health from within.", category: "nutrition", difficulty: "medium", xpReward: 15, completed: false },
        { day: 32, title: "Derma Roller (Optional)", description: "Use a 0.25mm derma roller on face (clean & sanitized). Stimulates collagen. Only if comfortable. Research first.", category: "skincare", difficulty: "hard", xpReward: 25, completed: false },
        { day: 33, title: "Hair Treatment Mask", description: "Apply hair mask or deep conditioner. Leave 20 min with heat cap/towel. Wash out. Hair will feel completely different.", category: "haircare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 34, title: "HIIT Workout", description: "15-min HIIT session. Intense exercise = growth hormone release = better skin, hair, mood. Sweat it out.", category: "fitness", difficulty: "hard", xpReward: 20, completed: false },
        { day: 35, title: "Month 2 Baseline Photo", description: "Progress photo for Month 2 start. You're in the top 5% of men who care about grooming. Own it.", category: "mindset", difficulty: "easy", xpReward: 20, completed: false },
      ],
    },
    {
      week: 6,
      theme: "Targeted Treatments",
      description: "Focus on your specific problem areas with precision.",
      tasks: [
        { day: 36, title: "Spot Treatment Night", description: "Apply targeted treatment to problem areas: salicylic acid for acne, vitamin C for dark spots, peptides for aging.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 37, title: "Beard Growth Oil", description: "If growing beard: apply growth oil with Redensyl. If clean-shaven: exfoliate and apply anti-ingrown serum.", category: "grooming", difficulty: "medium", xpReward: 15, completed: false },
        { day: 38, title: "Teeth Whitening", description: "Start using whitening toothpaste or strips. Brush for full 2 min morning & night. Floss daily. Smile brighter.", category: "grooming", difficulty: "medium", xpReward: 15, completed: false },
        { day: 39, title: "Sleep Optimization", description: "Tonight: no screens 1 hour before bed. Dark room. 7-8 hours minimum. Growth hormone peaks during deep sleep.", category: "mindset", difficulty: "medium", xpReward: 15, completed: false },
        { day: 40, title: "Skin Fasting Day", description: "Only water + moisturizer today. Let skin reset. No actives, no serums. Skin barrier recovery time.", category: "skincare", difficulty: "easy", xpReward: 10, completed: false },
        { day: 41, title: "Wardrobe Audit", description: "Clean out clothes that don't fit well. Grooming + style work together. One well-fitted outfit > 10 baggy ones.", category: "mindset", difficulty: "medium", xpReward: 15, completed: false },
        { day: 42, title: "6-Week Check-In", description: "Compare all progress photos. Evaluate what's working. Drop what isn't. Double down on what gives results.", category: "mindset", difficulty: "easy", xpReward: 25, completed: false },
      ],
    },
    {
      week: 7,
      theme: "Peak Performance",
      description: "You're in the zone now. Everything is optimized. Time to fine-tune.",
      tasks: [
        { day: 43, title: "Chemical Peel (Mild)", description: "Use an at-home AHA 10% peel. Apply for 10 min, rinse. Major glow next day. Don't use with retinol same night.", category: "skincare", difficulty: "hard", xpReward: 25, completed: false },
        { day: 44, title: "Scalp Detox", description: "Use clarifying shampoo or ACV rinse. Remove product buildup from weeks of styling. Scalp needs a reset.", category: "haircare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 45, title: "Ice Facial", description: "Wrap ice cubes in cloth, glide across face for 5 minutes. Reduces puffiness, tightens pores, instant glow.", category: "skincare", difficulty: "easy", xpReward: 10, completed: false },
        { day: 46, title: "Protein & Iron Check", description: "Track your protein intake today. Men need 1.2-1.6g per kg for optimal hair/skin. Ensure iron-rich foods.", category: "nutrition", difficulty: "medium", xpReward: 15, completed: false },
        { day: 47, title: "Signature Scent", description: "Find or apply your signature fragrance. Layer: scented body wash → lotion → cologne. Subtle but memorable.", category: "grooming", difficulty: "easy", xpReward: 10, completed: false },
        { day: 48, title: "Meditation & Stress", description: "10 min guided meditation. Cortisol (stress hormone) literally causes: acne, hair loss, aging. Mind = skin connection.", category: "mindset", difficulty: "medium", xpReward: 15, completed: false },
        { day: 49, title: "Week 7 Complete", description: "7 weeks in. Write down 3 compliments you've received this month. Grooming transformation is being noticed.", category: "mindset", difficulty: "easy", xpReward: 20, completed: false },
      ],
    },
    {
      week: 8,
      theme: "Transformation Complete",
      description: "Lock in your new identity. You're not 'doing a challenge' anymore — this IS who you are.",
      tasks: [
        { day: 50, title: "Perfect Your AM Routine", description: "Cleanse → Vitamin C → Niacinamide → Moisturize → SPF. Under 10 min. This is muscle memory now.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 51, title: "Perfect Your PM Routine", description: "Double Cleanse → Treatment → Retinol (3x/week) → Moisturize. Your night routine repairs everything.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 52, title: "Full Grooming Day", description: "The works: haircut/trim, beard shape, nails, eyebrows, nose hair, skin routine, cologne. Top-to-bottom.", category: "grooming", difficulty: "hard", xpReward: 25, completed: false },
        { day: 53, title: "Teach Someone", description: "Share one grooming tip with a friend or family member. Teaching reinforces your own knowledge.", category: "mindset", difficulty: "easy", xpReward: 10, completed: false },
        { day: 54, title: "Nutrition Mastery", description: "Full day of skin-optimized eating: No sugar, 3L water, protein goal hit, omega-3, fruits & veggies.", category: "nutrition", difficulty: "hard", xpReward: 20, completed: false },
        { day: 55, title: "Active Rest Day", description: "Light walk + basic routine only. Recovery is as important as action. Your skin and body need rest.", category: "fitness", difficulty: "easy", xpReward: 10, completed: false },
        { day: 56, title: "2-Month Champion! 🏆", description: "FINAL photo. Day 1 vs Day 56 comparison. You've done what 95% of men won't. Write your next 2-month plan.", category: "mindset", difficulty: "easy", xpReward: 75, completed: false },
      ],
      bonusTask: { day: 56, title: "Create Your System", description: "Write down your permanent daily & weekly routine. This challenge ends, but your system doesn't.", category: "mindset", difficulty: "easy", xpReward: 50, completed: false },
    },
  ];
  return [...month1, ...month2];
}

function generateThreeMonthChallenge(): ChallengeWeek[] {
  const twoMonth = generateTwoMonthChallenge();
  const month3: ChallengeWeek[] = [
    {
      week: 9,
      theme: "Expert-Level Skincare",
      description: "Professional-grade routines. Only for those who've earned their foundation.",
      tasks: [
        { day: 57, title: "Increase Retinol", description: "Move to retinol 0.5% (if tolerated). Apply 3 nights/week. This is where real anti-aging and texture refinement happens.", category: "skincare", difficulty: "hard", xpReward: 25, completed: false },
        { day: 58, title: "Sheet Mask Revival", description: "Use a hydrating sheet mask for 20 min. Perfect skin prep for any event. Instant plump and glow.", category: "skincare", difficulty: "easy", xpReward: 10, completed: false },
        { day: 59, title: "Barber Consultation", description: "Visit a barber and discuss the best hairstyle for your face shape. Professional advice > guessing.", category: "haircare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 60, title: "Gut Health Focus", description: "Eat probiotic foods: yogurt, kombucha, sauerkraut. Gut health directly affects skin clarity.", category: "nutrition", difficulty: "medium", xpReward: 15, completed: false },
        { day: 61, title: "Hand & Nail Care", description: "Trim nails short and clean. Moisturize hands. Push cuticles back. Men's hands are noticed more than you think.", category: "grooming", difficulty: "easy", xpReward: 10, completed: false },
        { day: 62, title: "Sauna / Steam", description: "If available: 15 min steam room or hot towel facial. Opens pores for deep cleansing. Follow with cold rinse.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 63, title: "9-Week Photo", description: "Progress check! The changes from Month 1 to now should be dramatic if you've stayed consistent.", category: "mindset", difficulty: "easy", xpReward: 20, completed: false },
      ],
    },
    {
      week: 10,
      theme: "Bio-Hacking Your Look",
      description: "Optimize every variable. Small 1% improvements that compound into transformation.",
      tasks: [
        { day: 64, title: "Jawline Exercises", description: "Mewing (proper tongue posture) + 10 min jaw exercises. Long-term face structure improvement. YouTube guides available.", category: "fitness", difficulty: "medium", xpReward: 15, completed: false },
        { day: 65, title: "Eye Area Intensive", description: "Double eye cream application today: caffeine AM, retinol PM. The eye area ages 3x faster than rest of face.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 66, title: "Body Skin Care", description: "Exfoliate body with scrub gloves. Apply body lotion after shower. Don't neglect skin below the neck.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 67, title: "Digital Detox Night", description: "No phone/laptop after 8 PM. Blue light = melatonin disruption = poor sleep = poor skin recovery. Read a book instead.", category: "mindset", difficulty: "hard", xpReward: 20, completed: false },
        { day: 68, title: "Collagen Boost Day", description: "Bone broth, citrus fruits, and collagen peptide powder. Feed your skin from the inside.", category: "nutrition", difficulty: "medium", xpReward: 15, completed: false },
        { day: 69, title: "Style Experiment", description: "Try one new style element: different hair parting, new shirt color, accessory. Small changes = big impact.", category: "grooming", difficulty: "easy", xpReward: 10, completed: false },
        { day: 70, title: "10-Week Milestone", description: "70 days of intentional grooming. Most men don't do this in a lifetime. You're built different. Record your reflection.", category: "mindset", difficulty: "easy", xpReward: 25, completed: false },
      ],
    },
    {
      week: 11,
      theme: "Social Confidence",
      description: "Looking great means nothing if you don't feel it. Inner game matches outer game.",
      tasks: [
        { day: 71, title: "Confidence Anchor", description: "Full grooming routine + best outfit. Go somewhere public. Make eye contact. Smile. Notice how people respond differently.", category: "mindset", difficulty: "medium", xpReward: 15, completed: false },
        { day: 72, title: "Professional Photo", description: "Get a professional-quality photo (or good phone photo). You deserve updated photos that match your upgrade.", category: "grooming", difficulty: "medium", xpReward: 15, completed: false },
        { day: 73, title: "Environmental Audit", description: "Clean sheets, clean towels, organized bathroom products. Your environment reflects your standards.", category: "mindset", difficulty: "medium", xpReward: 15, completed: false },
        { day: 74, title: "Full Nutrition Day", description: "Track every macro today. Protein, healthy fats, complex carbs, 8 servings fruits/vegetables. Eat for your skin.", category: "nutrition", difficulty: "hard", xpReward: 20, completed: false },
        { day: 75, title: "Pamper Night", description: "Face mask, hair mask, lip mask, hand cream, eye patches — all at once. You're not 'extra', you're dedicated.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 76, title: "Cold Shower Day", description: "Full cold shower. Benefits: reduced inflammation, better circulation, mental resilience, tighter skin.", category: "fitness", difficulty: "hard", xpReward: 25, completed: false },
        { day: 77, title: "Week 11 Reflections", description: "Write what changed about you beyond your appearance. Confidence, discipline, self-respect — the real rewards.", category: "mindset", difficulty: "easy", xpReward: 20, completed: false },
      ],
    },
    {
      week: 12,
      theme: "Legacy Mode — The New Standard",
      description: "This isn't the end. This is who you are now. Own it forever.",
      tasks: [
        { day: 78, title: "Morning Routine Mastered", description: "Timed AM routine: under 12 minutes, every step perfect. You could do this blindfolded. Mastery achieved.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 79, title: "Night Routine Mastered", description: "Timed PM routine: double cleanse → actives → treatment → moisturize. Efficient and automatic.", category: "skincare", difficulty: "medium", xpReward: 15, completed: false },
        { day: 80, title: "Final Grooming Session", description: "Everything done to perfection: hair, beard, skin, nails, teeth, scent. Photo-ready from every angle.", category: "grooming", difficulty: "hard", xpReward: 25, completed: false },
        { day: 81, title: "Teach & Inspire", description: "Help someone start their grooming journey. Write a mini guide, share tips, or gift a product. Pay it forward.", category: "mindset", difficulty: "easy", xpReward: 15, completed: false },
        { day: 82, title: "Gratitude List", description: "Write 10 things about your appearance/health you're grateful for. Your mindset about yourself has completely shifted.", category: "mindset", difficulty: "easy", xpReward: 10, completed: false },
        { day: 83, title: "Future Planning", description: "Book a dermatologist check-up if you haven't. Set 3-month, 6-month, 1-year grooming goals. Think long-term.", category: "mindset", difficulty: "medium", xpReward: 15, completed: false },
        { day: 84, title: "90-DAY CHAMPION! 🏆🏆🏆", description: "FINAL PHOTO. Day 1 → Day 90 comparison. Share if you're proud (you should be). You've transformed yourself.", category: "mindset", difficulty: "easy", xpReward: 100, completed: false },
      ],
      bonusTask: { day: 84, title: "Create Your Legacy System", description: "Write your permanent grooming playbook: daily, weekly, monthly routines + products + nutrition. This is your life now.", category: "mindset", difficulty: "easy", xpReward: 75, completed: false },
    },
  ];
  return [...twoMonth, ...month3];
}

// ─── PUBLIC API ────────────────────────────────────────────────

export function getChallenges(): Challenge[] {
  return [
    {
      id: "1-month-glow-up",
      title: "30-Day Glow Up",
      subtitle: "Build the Foundation",
      duration: "1-month",
      totalDays: 28,
      icon: "🔥",
      color: "from-orange-500 to-red-500",
      description: "Perfect for beginners. Build essential grooming habits from zero. By Day 28, you'll have a complete skincare, haircare, and grooming routine that takes under 15 minutes.",
      benefits: [
        "Build a complete morning & night routine",
        "Learn proper product usage & layering",
        "Establish nutrition habits for better skin",
        "See visible changes in skin texture & clarity",
      ],
      weeks: generateOneMonthChallenge(),
      completedTasks: 0,
      streak: 0,
      longestStreak: 0,
      totalXP: 0,
      isActive: false,
    },
    {
      id: "2-month-transformation",
      title: "60-Day Transformation",
      subtitle: "Intermediate to Advanced",
      duration: "2-month",
      totalDays: 56,
      icon: "⚡",
      color: "from-blue-500 to-purple-500",
      description: "For those ready to go deeper. Introduces retinol, advanced treatments, supplements, and lifestyle optimization. This is where real transformation happens.",
      benefits: [
        "Master advanced active ingredients (retinol, AHA/BHA)",
        "Optimize nutrition & supplements for skin/hair",
        "Develop expert-level product knowledge",
        "Dramatic before/after transformation",
      ],
      weeks: generateTwoMonthChallenge(),
      completedTasks: 0,
      streak: 0,
      longestStreak: 0,
      totalXP: 0,
      isActive: false,
    },
    {
      id: "3-month-mastery",
      title: "90-Day Mastery",
      subtitle: "The Ultimate Challenge",
      duration: "3-month",
      totalDays: 84,
      icon: "👑",
      color: "from-yellow-500 to-amber-600",
      description: "The complete transformation package. From beginner to grooming expert. Covers skincare, haircare, fitness, nutrition, mindset, and style. You'll be a completely different man.",
      benefits: [
        "Full skincare expertise with professional techniques",
        "Complete lifestyle optimization",
        "Confidence and social presence boost",
        "Permanent grooming system for life",
      ],
      weeks: generateThreeMonthChallenge(),
      completedTasks: 0,
      streak: 0,
      longestStreak: 0,
      totalXP: 0,
      isActive: false,
    },
  ];
}

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || "📋";
}

// ─── PERSISTENCE (localStorage) ───────────────────────────────

const STORAGE_KEY = "oneman_challenge_progress";

export function loadChallengeProgress(challengeId: string): ChallengeProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${challengeId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveChallengeProgress(progress: ChallengeProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${progress.challengeId}`, JSON.stringify(progress));
  } catch {
    console.error("Failed to save challenge progress");
  }
}

export function getActiveChallengeId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`${STORAGE_KEY}_active`);
  } catch {
    return null;
  }
}

export function setActiveChallengeId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) {
      localStorage.setItem(`${STORAGE_KEY}_active`, id);
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_active`);
    }
  } catch {
    console.error("Failed to save active challenge");
  }
}

export function calculateStreak(completedDays: number[], totalDays: number): { streak: number; longestStreak: number } {
  if (completedDays.length === 0) return { streak: 0, longestStreak: 0 };
  
  const sorted = [...completedDays].sort((a, b) => a - b);
  let streak = 1;
  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  // Check if the current streak is still active (last completed day is recent)
  const lastDay = sorted[sorted.length - 1];
  const startDate = new Date(localStorage.getItem(`${STORAGE_KEY}_active_start`) || Date.now());
  const daysSinceStart = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (lastDay >= daysSinceStart - 1) {
    streak = currentStreak;
  } else {
    streak = 0;
  }

  return { streak, longestStreak: Math.max(longestStreak, streak) };
}
