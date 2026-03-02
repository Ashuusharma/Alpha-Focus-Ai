# 🏗️ Complete Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONEMAN AI ASSISTANT                          │
│                    Architecture Overview                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 14 - App Router)                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐      ┌──────────────────┐              │
│  │  / (Home)      │      │ /image-analyzer  │              │
│  │ Questionnaire  │      │   4-Step Flow    │              │
│  │                │      │  Skin/Hair/Beard │              │
│  │  Categories:   │      │                  │              │
│  │  • Skin Care   │      │  Components:     │              │
│  │  • Hair Care   │      │  • Analyzer Type │              │
│  │  • Beard Care  │      │  • Image Upload  │              │
│  │  • Body Care   │      │  • Analysis Rslt │              │
│  │  • Health Care │      │                  │              │
│  │  • Fitness     │      │  Mock Engine:    │              │
│  │  • Fragrance   │      │  65-94% confid   │              │
│  └────────────────┘      └──────────────────┘              │
│         │                        │                           │
│         │ Answers saved          │ Photo analysis saved      │
│         │ to form state          │ to sessionStorage         │
│         └────────────┬───────────┘                           │
│                      │                                       │
│                      ▼                                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │  /result (MAIN DISPLAY PAGE)                      │     │
│  │                                                    │     │
│  │  ┌────────────────────────────────────────────┐   │     │
│  │  │ 🧠 AI Analysis Insights                   │   │     │
│  │  │  • Validation: Photo + Q&A agree         │   │     │
│  │  │  • Warnings: Significant issues          │   │     │
│  │  │  • Opportunities: Hidden issues          │   │     │
│  │  │  • Strengths: Manageable areas           │   │     │
│  │  └────────────────────────────────────────────┘   │     │
│  │                                                    │     │
│  │  ┌────────────────────────────────────────────┐   │     │
│  │  │ 📊 Confidence Comparison                  │   │     │
│  │  │  Photo: [████░░░░] 85%                   │   │     │
│  │  │  Combined: [██████░░] 89%                │   │     │
│  │  └────────────────────────────────────────────┘   │     │
│  │                                                    │     │
│  │  ┌────────────────────────────────────────────┐   │     │
│  │  │ 🔍 AI-Detected Issues (if photo)          │   │     │
│  │  │  • Acne [📸📝] 88% 🟠 Moderate            │   │     │
│  │  │    → Use salicylic acid cleanser          │   │     │
│  │  │  • Dryness [📸] 78% 🟡 Minor              │   │     │
│  │  │    → Use hydrating shampoo                │   │     │
│  │  └────────────────────────────────────────────┘   │     │
│  │                                                    │     │
│  │  ┌────────────────────────────────────────────┐   │     │
│  │  │ 💊 Recommended Products (AI Scored)      │   │     │
│  │  │  Product A [████████░] 85% match         │   │     │
│  │  │  Product B [██████░░░] 72% match         │   │     │
│  │  │  Product C [████░░░░░] 45% match         │   │     │
│  │  └────────────────────────────────────────────┘   │     │
│  │                                                    │     │
│  │  [Routine Timeline] [Recovery Score] [Progress]  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ /ai-demo       │  │ /profile       │  │ /test        │  │
│  │ Interactive    │  │ User settings  │  │ Playground   │  │
│  │ Demo Engine    │  │ & history      │  │ & testing    │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  BUSINESS LOGIC LAYER                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AI Analysis Engine (lib/aiAnalysisEngine.ts)         │ │
│  │                                                        │ │
│  │  analyzeWithAI(photoAnalysis, answers)                │ │
│  │  Returns: CombinedAnalysis                            │ │
│  │                                                        │ │
│  │  Functions:                                           │ │
│  │  • extractAnalyzedCategories()                        │ │
│  │  • extractIssuesFromAnswers()                         │ │
│  │  • enrichIssues()          ← SMART MERGING!          │ │
│  │  • generateCombinedRecommendations()                  │ │
│  │  • generateInsights()      ← AI INSIGHTS!            │ │
│  │  • calculateCombinedConfidence()                      │ │
│  │  • determineUrgency()                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Inputs:                          Outputs:                   │
│  ├─ photoAnalysis                 ├─ enrichedIssues[]      │
│  │  ├─ type                       ├─ recommendations[]     │
│  │  ├─ confidence                 ├─ insights[]            │
│  │  ├─ detectedIssues[]           ├─ combinedConfidence   │
│  │  └─ severity                   └─ urgencyLevel         │
│  │                                                          │
│  └─ questionnaireAnswers                                    │
│     ├─ skin_type, skin_concern                             │
│     ├─ hair_concern, hair_type                             │
│     ├─ beard_issue, beard_coverage                         │
│     └─ ... (35+ questions)                                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Mock Analysis Engine (lib/analyzeImage.ts)           │ │
│  │  → Ready for real APIs (Google Vision, AWS, Claude)   │ │
│  │                                                        │ │
│  │  analyzeImage(imageData, type): AnalysisResult        │ │
│  │  • Returns 3 issues per analysis                      │ │
│  │  • Confidence: 65-94% (realistic)                     │ │
│  │  • Severity: low/moderate/high                        │ │
│  │  • Tips & recommendations included                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Recommendation Rules (lib/recommendationRules.ts)    │ │
│  │                                                        │ │
│  │  ~50 products organized by:                           │ │
│  │  • Category (skin, hair, beard, body, health)         │ │
│  │  • Issue focus (acne, hair loss, dryness, etc)        │ │
│  │  • Product details (ingredients, how it works)        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Recovery Score (lib/getRecoveryScore.ts)             │ │
│  │                                                        │ │
│  │  Score based on:                                      │ │
│  │  • Questions answered                                 │ │
│  │  • Severity levels                                    │ │
│  │  • Recovery potential                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  State Management:                                           │
│  ├─ Zustand (Cart state)                                    │
│  ├─ React Hooks (Component state)                           │
│  ├─ localStorage (Persistence)                              │
│  └─ sessionStorage (Temporary: photo analysis)              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  DATA STRUCTURES                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  AnalysisResult (from photo)                               │
│  ├─ type: "skin" | "hair" | "beard"                       │
│  ├─ confidence: 0-100                                       │
│  ├─ severity: "low" | "moderate" | "high"                  │
│  ├─ detectedIssues: DetectedIssue[]                        │
│  │  ├─ name: string                                        │
│  │  ├─ confidence: 0-100                                   │
│  │  ├─ description: string                                 │
│  │  └─ impact: string                                      │
│  └─ recommendations: string[]                              │
│                                                              │
│  CombinedAnalysis (AI merged result)      ← NEW!           │
│  ├─ photoAnalysis: AnalysisResult | null                  │
│  ├─ questionnaireAnswers: Record<string>                  │
│  ├─ analyzedCategories: string[]                           │
│  ├─ confidence: 0-100            ← BOOSTED!               │
│  ├─ detectedIssues: EnrichedIssue[]       ← ENRICHED!     │
│  │  ├─ source: "photo" | "questionnaire" | "both"         │
│  │  ├─ combinedConfidence: 0-100   ← MERGED!             │
│  │  └─ suggestedActions: string[]                         │
│  ├─ recommendations: ScoredRecommendation[]               │
│  │  ├─ score: 0-100                ← AI SCORED!          │
│  │  ├─ matchSources: string[]                             │
│  │  └─ urgency: "low" | "medium" | "high"                │
│  ├─ insights: AnalysisInsight[]           ← AI INSIGHTS!  │
│  │  ├─ type: "strength" | "warning" | "opportunity"      │
│  │  └─ actionable: boolean                                │
│  └─ urgencyLevel: "low" | "moderate" | "high"             │
│                                                              │
│  Recommendation                                             │
│  ├─ id: string                                             │
│  ├─ title: string                                          │
│  ├─ category: string                                       │
│  ├─ cause: string                                          │
│  ├─ solution: string                                       │
│  ├─ steps: string[]                                        │
│  └─ products: Product[]                                    │
│     ├─ id, name, price, rating                            │
│     ├─ benefits, ingredients                              │
│     └─ why_it_works                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

```

## Data Flow Example

```
SCENARIO: User uploads skin photo + answers questionnaire

Step 1: Photo Analysis
┌──────────────────────────────────────┐
│ User uploads skin photo              │
│ Select: 🧴 Skin Analyzer             │
└──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│ analyzeImage(blob, "skin")           │
│                                      │
│ Returns:                             │
│ ├─ type: "skin"                      │
│ ├─ confidence: 85%                   │
│ ├─ detectedIssues: [                │
│ │  { name: "Acne-Prone Areas",      │
│ │    confidence: 92% },             │
│ │  { name: "Dry Patches",           │
│ │    confidence: 78% }              │
│ ]                                    │
│ └─ severity: "moderate"              │
└──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│ Save to sessionStorage                │
│ sessionStorage.photoAnalysis = {...}  │
└──────────────────────────────────────┘


Step 2: Questionnaire
┌──────────────────────────────────────┐
│ User navigates to /                  │
│ Photo analysis loaded from storage   │
└──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│ User answers questions:              │
│ ├─ skin_type: "Oily"                 │
│ ├─ skin_concern: "Acne and dryness" │
│ ├─ skin_severity: "Moderate"        │
│ └─ ... (other answers)               │
└──────────────────────────────────────┘


Step 3: AI Merging (THE MAGIC!)
┌──────────────────────────────────────┐
│ analyzeWithAI(photoAnalysis, answers)│
└──────────────────────────────────────┘
            │
            ├──▶ extractAnalyzedCategories()
            │    Returns: ["Skin Care"]
            │
            ├──▶ extractIssuesFromAnswers()
            │    Returns: { category: "skin",
            │              issues: ["Acne", "Dryness"] }
            │
            ├──▶ enrichIssues()
            │    ✨ SMART MERGING HAPPENS HERE
            │    
            │    Photo found: "Acne-Prone Areas" 92%
            │    Q&A found: "Acne and dryness"
            │    
            │    Result: EnrichedIssue {
            │      name: "Acne-Prone Areas",
            │      source: "both",  ← BOTH!
            │      photoConfidence: 92,
            │      questionnaireMatch: 85,
            │      combinedConfidence: 88  ← BOOSTED!
            │    }
            │
            ├──▶ generateCombinedRecommendations()
            │    Returns: products scored by
            │    - Issue match (88% acne issue)
            │    - Questionnaire match ("Oily" skin)
            │    - Confidence (high = featured)
            │
            ├──▶ generateInsights()
            │    Returns: [
            │      { type: "validation",
            │        title: "Acne confirmed by both sources",
            │        description: "Photo & questionnaire..." }
            │    ]
            │
            ├──▶ calculateCombinedConfidence()
            │    Returns: 87%
            │    (50% base + 25% photo + 85/4 + 15% Q&A)
            │
            └──▶ determineUrgency()
                 Returns: "moderate"
                 (acne + dryness = 2 moderate issues)
            │
            ▼
┌──────────────────────────────────────────────┐
│ CombinedAnalysis returned:                  │
│                                             │
│ {                                           │
│   photoAnalysis: { ... },                   │
│   questionnaireAnswers: { ... },            │
│   analyzedCategories: ["Skin Care"],        │
│   confidence: 87,                           │
│   detectedIssues: [                         │
│     {                                        │
│       name: "Acne-Prone Areas",             │
│       source: "both",                       │
│       combinedConfidence: 88,               │
│       ...                                    │
│     },                                       │
│     {                                        │
│       name: "Dryness",                      │
│       source: "questionnaire",              │
│       combinedConfidence: 75,               │
│       ...                                    │
│     }                                        │
│   ],                                         │
│   recommendations: [                        │
│     { title: "Acne Cleanser",              │
│       score: 92,        ← HIGH SCORE!      │
│       matchSources: ["photo", "questionnaire"] }
│   ],                                         │
│   insights: [                                │
│     { type: "validation",                    │
│       title: "Acne confirmed by both..." }  │
│   ],                                         │
│   urgencyLevel: "moderate"                  │
│ }                                            │
└──────────────────────────────────────────────┘


Step 4: Display on Result Page
┌──────────────────────────────────────────────┐
│ /result page loads CombinedAnalysis          │
│                                             │
│ Displays:                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ 🧠 AI Analysis Insights                 │ │
│ │ ✅ "Acne confirmed by both sources!"    │ │
│ │ 📸 Photo detected this issue            │ │
│ │ 📝 Questionnaire also mentioned it      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📊 Confidence                           │ │
│ │ Photo: [████░░░░] 85%                  │ │
│ │ Combined: [██████░░] 87%  (BOOSTED!)   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🔍 AI-Detected Issues                   │ │
│ │ • Acne [📸📝] 88% Moderate              │ │
│ │   → Use salicylic acid cleanser         │ │
│ │ • Dryness [📝] 75% Minor               │ │
│ │   → Use hydrating moisturizer           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 💊 Recommended Products                 │ │
│ │ • Acne Cleanser [92% match] 🎯          │ │
│ │ • Hydrating Moisturizer [75% match]     │ │
│ │ • Spot Treatment [88% match] 🔥         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Routine] [Recovery Score] [Progress]      │
└──────────────────────────────────────────────┘
```

## Technology Stack

```
Frontend:
├─ Next.js 14.2.35 (App Router)
├─ React 18.x
├─ TypeScript (strict mode)
├─ Tailwind CSS + custom theme
├─ Zustand (state management)
├─ Framer Motion (animations)
└─ Lucide Icons

Design System:
├─ Color Palette:
│  ├─ Primary: #1a1a1a (Deep Black)
│  ├─ Accent: #c9a961 (Premium Gold)
│  ├─ Success: #2ecc71 (Health Green)
│  └─ Semantic: Reds, Yellows, Blues
├─ Typography: Sans-serif (system fonts)
├─ Spacing: 4px base unit
└─ Responsive: Mobile-first

State Management:
├─ Zustand (cart operations)
├─ React useState (local components)
├─ sessionStorage (photo analysis)
└─ localStorage (recovery persistence)
```

## Component Hierarchy

```
App (Root)
├─ layout.tsx
│  ├─ UserMenu (global)
│  └─ Navigation
│
├─ page.tsx (Questionnaire)
│  ├─ Header
│  ├─ Progress Bar
│  ├─ CategoryAccordions
│  │  └─ QuestionSelects
│  ├─ ImageAnalyzerCTA
│  └─ ActionButtons
│
├─ image-analyzer/page.tsx
│  ├─ StepIndicator
│  ├─ AnalyzerSelector (step 1)
│  ├─ ImageUpload (step 2)
│  ├─ AnalysisResults (step 3)
│  └─ NavigationButtons
│
├─ result/page.tsx
│  ├─ ResultHeader
│  ├─ AIInsights (NEW)
│  ├─ ConfidenceComparison (NEW)
│  ├─ AIIssuesDisplay (NEW)
│  ├─ IssueSummary
│  ├─ ProductGrid
│  │  └─ EnhancedProductCard
│  ├─ RoutineTimeline
│  ├─ RoutineComplianceTracker
│  ├─ ResultsTimeline
│  ├─ SocialProofWidget
│  ├─ ExpertConsultationCTA
│  ├─ RecoveryScore (sidebar)
│  └─ QuickTips (sidebar)
│
├─ ai-demo/page.tsx (NEW)
│  ├─ DemoHeader
│  ├─ StepDisplay (photo + combined)
│  ├─ InsightsList
│  └─ ActionButton
│
└─ profile/page.tsx
   └─ UserSettings
```

## Key Features by Phase

### ✅ Phase 1: Foundation (Complete)
- Basic questionnaire
- Result page with recommendations
- Product card design

### ✅ Phase 2: Image Analysis (Complete)
- Camera + file upload
- Mock analysis engine
- 3 analyzer types (skin/hair/beard)
- Results display

### ✅ Phase 3: AI Analysis Engine (Complete) 🎉
- Photo + questionnaire merging
- Confidence boosting
- Issue enrichment (source tracking)
- AI insights generation
- Smart recommendation scoring
- Urgency determination

### 🟡 Phase 4: User Experience (Next)
- Profile & history
- Scan comparison
- Routine generator
- Ingredient matcher

### 🟡 Phase 5: Integration (Later)
- Shopify products
- Expert consultation
- Analytics
- Mobile app

---

**Total Implementation**: 10 files created, 5 files modified
**Total Lines of Code**: ~1,200 (excluding docs)
**Build Status**: ✅ Production Ready
**Performance**: Client-side instant analysis
**Next Priority**: User profiles & history
