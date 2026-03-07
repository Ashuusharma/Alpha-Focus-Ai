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

const protocolTemplates: Record<ClinicalCategoryId, ProtocolTemplate> = {
  acne: {
    category: "acne",
    phases: [
      {
        name: "Stabilization",
        duration_days: 7,
        tasks: [
          { id: "acne-cleanser-am", label: "Gentle cleanser", slot: "morning", frequency: "daily" },
          { id: "acne-niacinamide", label: "Niacinamide serum (4-10%)", slot: "morning", frequency: "daily" },
          { id: "acne-spf", label: "Non-comedogenic sunscreen SPF 30+", slot: "morning", frequency: "daily" },
          { id: "acne-cleanser-pm", label: "Gentle cleanser", slot: "night", frequency: "daily" },
          { id: "acne-bha", label: "Salicylic acid leave-on", slot: "night", frequency: "alternate_days" },
          { id: "acne-barrier", label: "Barrier-repair moisturizer", slot: "night", frequency: "daily" },
          { id: "acne-habit", label: "Avoid pimple picking and pore-clogging products", slot: "lifestyle", frequency: "daily" },
        ],
      },
      {
        name: "Correction",
        duration_days: 14,
        tasks: [
          { id: "acne-cleanser-am-2", label: "Gentle cleanser", slot: "morning", frequency: "daily" },
          { id: "acne-azelaic", label: "Azelaic acid/niacinamide corrective layer", slot: "morning", frequency: "daily" },
          { id: "acne-spf-2", label: "Sunscreen SPF 30+", slot: "morning", frequency: "daily" },
          { id: "acne-retinoid", label: "Retinoid night (as tolerated)", slot: "night", frequency: "alternate_days" },
          { id: "acne-bha-2", label: "Salicylic acid on non-retinoid nights", slot: "night", frequency: "alternate_days" },
          { id: "acne-weekly", label: "Weekly pore reset (gentle exfoliation)", slot: "weekly", frequency: "weekly" },
        ],
      },
      {
        name: "Optimization",
        duration_days: 9,
        tasks: [
          { id: "acne-am-opt", label: "Maintenance AM protocol + SPF", slot: "morning", frequency: "daily" },
          { id: "acne-pm-opt", label: "Retinoid cadence + barrier support", slot: "night", frequency: "daily" },
          { id: "acne-lifestyle-opt", label: "Sleep 7h+ and high-glycemic control", slot: "lifestyle", frequency: "daily" },
        ],
      },
    ],
  },
  hair_loss: {
    category: "hair_loss",
    phases: [
      {
        name: "Stabilization",
        duration_days: 7,
        tasks: [
          { id: "hl-massage", label: "Scalp massage (5 min)", slot: "morning", frequency: "daily" },
          { id: "hl-minoxidil-am", label: "Minoxidil (if applicable)", slot: "morning", frequency: "daily" },
          { id: "hl-oil-pm", label: "Rosemary support oil/scalp serum", slot: "night", frequency: "daily" },
          { id: "hl-protein", label: "Protein and iron-aware nutrition check", slot: "lifestyle", frequency: "daily" },
          { id: "hl-weekly", label: "Weekly scalp photo and part-line check", slot: "weekly", frequency: "weekly" },
        ],
      },
      {
        name: "Correction",
        duration_days: 14,
        tasks: [
          { id: "hl-minoxidil-twice", label: "Minoxidil cadence adherence", slot: "morning", frequency: "daily" },
          { id: "hl-cleanse", label: "Anti-buildup scalp cleanse", slot: "night", frequency: "alternate_days" },
          { id: "hl-stress", label: "Stress reduction session (10 min)", slot: "lifestyle", frequency: "daily" },
          { id: "hl-micro", label: "Microneedling session (if clinically appropriate)", slot: "weekly", frequency: "weekly" },
        ],
      },
      {
        name: "Optimization",
        duration_days: 9,
        tasks: [
          { id: "hl-maintain", label: "Continue scalp protocol with adherence >85%", slot: "morning", frequency: "daily" },
          { id: "hl-sleep", label: "Sleep recovery window (7-8h)", slot: "lifestyle", frequency: "daily" },
          { id: "hl-photo", label: "Weekly density comparison photo", slot: "weekly", frequency: "weekly" },
        ],
      },
    ],
  },
  scalp_health: {
    category: "scalp_health",
    phases: [
      {
        name: "Stabilization",
        duration_days: 7,
        tasks: [
          { id: "scalp-cleanse", label: "Targeted scalp cleanse", slot: "morning", frequency: "alternate_days" },
          { id: "scalp-soothe", label: "Anti-inflammatory scalp tonic", slot: "night", frequency: "daily" },
          { id: "scalp-avoid", label: "Avoid harsh scratching and hot-water washes", slot: "lifestyle", frequency: "daily" },
        ],
      },
      {
        name: "Correction",
        duration_days: 14,
        tasks: [
          { id: "scalp-ph", label: "pH-balanced shampoo cadence", slot: "morning", frequency: "alternate_days" },
          { id: "scalp-serum", label: "Barrier support scalp serum", slot: "night", frequency: "daily" },
          { id: "scalp-weekly", label: "Weekly anti-flake treatment", slot: "weekly", frequency: "weekly" },
        ],
      },
      {
        name: "Optimization",
        duration_days: 9,
        tasks: [
          { id: "scalp-maint", label: "Maintain low-inflammation scalp routine", slot: "morning", frequency: "daily" },
          { id: "scalp-sleep", label: "Sleep and stress compliance", slot: "lifestyle", frequency: "daily" },
        ],
      },
    ],
  },
  dark_circles: {
    category: "dark_circles",
    phases: [
      {
        name: "Stabilization",
        duration_days: 7,
        tasks: [
          { id: "dc-caffeine", label: "Caffeine eye serum", slot: "morning", frequency: "daily" },
          { id: "dc-spf", label: "SPF around orbital area", slot: "morning", frequency: "daily" },
          { id: "dc-retinol-eye", label: "Gentle retinoid eye cream", slot: "night", frequency: "alternate_days" },
          { id: "dc-sleep", label: "Sleep correction target (7h+)", slot: "lifestyle", frequency: "daily" },
        ],
      },
      {
        name: "Correction",
        duration_days: 14,
        tasks: [
          { id: "dc-am-correct", label: "Caffeine + hydrating eye support", slot: "morning", frequency: "daily" },
          { id: "dc-pm-correct", label: "Retinoid eye cream (as tolerated)", slot: "night", frequency: "alternate_days" },
          { id: "dc-lifestyle", label: "Screen cutoff and hydration consistency", slot: "lifestyle", frequency: "daily" },
        ],
      },
      {
        name: "Optimization",
        duration_days: 9,
        tasks: [
          { id: "dc-maint", label: "Maintain eye-care protocol + SPF", slot: "morning", frequency: "daily" },
          { id: "dc-weekly", label: "Weekly under-eye progress photo", slot: "weekly", frequency: "weekly" },
        ],
      },
    ],
  },
  beard_growth: {
    category: "beard_growth",
    phases: [
      {
        name: "Stabilization",
        duration_days: 7,
        tasks: [
          { id: "bg-cleanse", label: "Beard area cleanse", slot: "morning", frequency: "daily" },
          { id: "bg-oil", label: "Beard growth support oil", slot: "night", frequency: "daily" },
          { id: "bg-irritation", label: "Anti-ingrown and irritation control", slot: "lifestyle", frequency: "daily" },
        ],
      },
      {
        name: "Correction",
        duration_days: 14,
        tasks: [
          { id: "bg-massage", label: "Follicle stimulation massage", slot: "morning", frequency: "daily" },
          { id: "bg-derma", label: "Derma-roller session (if suitable)", slot: "weekly", frequency: "weekly" },
          { id: "bg-pm", label: "Night growth serum", slot: "night", frequency: "daily" },
        ],
      },
      {
        name: "Optimization",
        duration_days: 9,
        tasks: [
          { id: "bg-maint", label: "Maintenance growth + grooming protocol", slot: "morning", frequency: "daily" },
          { id: "bg-photo", label: "Weekly patch-density comparison", slot: "weekly", frequency: "weekly" },
        ],
      },
    ],
  },
  body_acne: {
    category: "body_acne",
    phases: [
      {
        name: "Stabilization",
        duration_days: 7,
        tasks: [
          { id: "ba-cleanser", label: "Body cleanser post-sweat", slot: "morning", frequency: "daily" },
          { id: "ba-bha", label: "Salicylic body spray/wash", slot: "night", frequency: "alternate_days" },
          { id: "ba-clothing", label: "Breathable fabric + friction control", slot: "lifestyle", frequency: "daily" },
        ],
      },
      {
        name: "Correction",
        duration_days: 14,
        tasks: [
          { id: "ba-am", label: "AM cleanse + lightweight moisturizer", slot: "morning", frequency: "daily" },
          { id: "ba-pm", label: "Targeted body-acne treatment", slot: "night", frequency: "daily" },
          { id: "ba-weekly", label: "Weekly gentle exfoliation", slot: "weekly", frequency: "weekly" },
        ],
      },
      {
        name: "Optimization",
        duration_days: 9,
        tasks: [
          { id: "ba-maint", label: "Maintenance cleanse cadence", slot: "morning", frequency: "daily" },
          { id: "ba-hygiene", label: "Post-workout hygiene compliance", slot: "lifestyle", frequency: "daily" },
        ],
      },
    ],
  },
  lip_care: {
    category: "lip_care",
    phases: [
      {
        name: "Stabilization",
        duration_days: 7,
        tasks: [
          { id: "lip-balm-am", label: "Barrier lip balm with SPF", slot: "morning", frequency: "daily" },
          { id: "lip-balm-pm", label: "Night occlusive lip repair", slot: "night", frequency: "daily" },
          { id: "lip-habit", label: "Avoid lip licking and irritants", slot: "lifestyle", frequency: "daily" },
        ],
      },
      {
        name: "Correction",
        duration_days: 14,
        tasks: [
          { id: "lip-hydrate", label: "Hydration target + humidifier strategy", slot: "lifestyle", frequency: "daily" },
          { id: "lip-gentle", label: "Gentle weekly exfoliation", slot: "weekly", frequency: "weekly" },
          { id: "lip-repair", label: "Ceramide/petrolatum repair layer", slot: "night", frequency: "daily" },
        ],
      },
      {
        name: "Optimization",
        duration_days: 9,
        tasks: [
          { id: "lip-maint", label: "Maintain SPF + overnight barrier protocol", slot: "morning", frequency: "daily" },
        ],
      },
    ],
  },
  anti_aging: {
    category: "anti_aging",
    phases: [
      {
        name: "Stabilization",
        duration_days: 7,
        tasks: [
          { id: "age-cleanse", label: "Gentle cleanser", slot: "morning", frequency: "daily" },
          { id: "age-antiox", label: "Antioxidant serum (AM)", slot: "morning", frequency: "daily" },
          { id: "age-spf", label: "Broad spectrum SPF 30+", slot: "morning", frequency: "daily" },
          { id: "age-moist", label: "Barrier moisturizer", slot: "night", frequency: "daily" },
        ],
      },
      {
        name: "Correction",
        duration_days: 14,
        tasks: [
          { id: "age-retinoid", label: "Retinoid night routine (as tolerated)", slot: "night", frequency: "alternate_days" },
          { id: "age-repair", label: "Peptide/ceramide recovery on non-retinoid nights", slot: "night", frequency: "alternate_days" },
          { id: "age-lifestyle", label: "Sleep + stress + UV protection compliance", slot: "lifestyle", frequency: "daily" },
        ],
      },
      {
        name: "Optimization",
        duration_days: 9,
        tasks: [
          { id: "age-maint", label: "Maintain antioxidant + retinoid cadence", slot: "morning", frequency: "daily" },
          { id: "age-weekly", label: "Weekly texture comparison photo", slot: "weekly", frequency: "weekly" },
        ],
      },
    ],
  },
};

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

export function generateDailyProtocolTasks(category: CategoryId, dayNumber: number) {
  const template = getProtocolTemplate(category);
  if (!template) return [] as ProtocolTask[];

  const normalizedDay = Math.max(1, dayNumber);
  const phase = getCurrentProtocolPhase(template, normalizedDay);

  return phase.tasks.filter((task) => {
    if (task.frequency === "daily") return true;
    if (task.frequency === "alternate_days") return normalizedDay % 2 === 0;
    if (task.frequency === "weekly") return normalizedDay % 7 === 0;
    return false;
  });
}

export function getProtocolDurationDays(template: ProtocolTemplate) {
  return template.phases.reduce((sum, phase) => sum + phase.duration_days, 0);
}

export { protocolTemplates };
