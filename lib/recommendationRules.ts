import { CategoryId } from "./questions";

/* ================= TYPES ================= */

export interface Product {
  id: string;
  name: string;
  description: string;
  usage: string;
  frequency: string;
  why: string;

  // 🆕 Product intelligence
  price: number;
  rating: number; // 1–5
  reviews: number;
  badge?: "Best Seller" | "Recommended" | "New";
  shopifyHandle?: string;
}

export interface Recommendation {
  id: string;
  category: CategoryId;
  title: string;
  cause: string;
  solution: string;
  steps: string[];
  products: Product[];
}

/* ================= RULE ENGINE ================= */

export const recommendationRules: Recommendation[] = [
  /* ================= HAIR CARE ================= */
  {
    id: "hair-fall",
    category: "hairCare",
    title: "Hair Fall & Weak Roots",
    cause:
      "Hair fall is commonly caused by weak follicles, scalp inflammation, stress, poor nutrition, or excess oil buildup.",
    solution:
      "Strengthen hair roots, improve scalp circulation, and maintain a clean, balanced scalp environment.",
    steps: [
      "Wash scalp with a gentle shampoo to remove buildup",
      "Apply growth tonic to stimulate follicles",
      "Avoid excessive heat styling",
      "Maintain a protein-rich diet",
    ],
    products: [
      {
        id: "hair-growth-tonic",
        name: "Hair Growth Tonic",
        description: "Improves blood circulation and strengthens roots",
        usage: "Massage into scalp",
        frequency: "Daily at night",
        why:
          "Increases nutrient delivery to hair follicles, reducing hair fall over time",
        price: 899,
        rating: 4.6,
        reviews: 1284,
        badge: "Best Seller",
        shopifyHandle: "hair-growth-tonic",
      },
      {
        id: "anti-dandruff-shampoo",
        name: "Anti-Dandruff Shampoo",
        description: "Controls flakes and scalp inflammation",
        usage: "Use while shampooing",
        frequency: "2–3 times a week",
        why:
          "A clean scalp prevents follicle blockage and reduces hair weakening",
        price: 499,
        rating: 4.4,
        reviews: 942,
        badge: "Recommended",
        shopifyHandle: "anti-dandruff-shampoo",
      },
    ],
  },

  /* ================= SKIN CARE ================= */
  {
    id: "oily-acne-skin",
    category: "skinCare",
    title: "Oily Skin & Acne",
    cause:
      "Excess oil production clogs pores, leading to acne, blackheads, and inflammation.",
    solution:
      "Control oil production, cleanse pores deeply, and maintain hydration balance.",
    steps: [
      "Cleanse face twice daily",
      "Use oil-free moisturizer",
      "Avoid harsh scrubs",
      "Apply sunscreen daily",
    ],
    products: [
      {
        id: "oil-free-face-wash",
        name: "Oil-Free Face Wash",
        description: "Removes excess oil without drying skin",
        usage: "Massage on wet face and rinse",
        frequency: "Morning & night",
        why:
          "Controls sebum while maintaining skin barrier",
        price: 399,
        rating: 4.5,
        reviews: 1876,
        badge: "Best Seller",
        shopifyHandle: "oil-free-face-wash",
      },
      {
        id: "gel-moisturizer",
        name: "Gel Moisturizer",
        description: "Hydrates without clogging pores",
        usage: "Apply after cleansing",
        frequency: "Twice daily",
        why:
          "Prevents overproduction of oil caused by dehydration",
        price: 449,
        rating: 4.3,
        reviews: 1120,
        shopifyHandle: "gel-moisturizer",
      },
    ],
  },

  /* ================= BEARD CARE ================= */
  {
    id: "patchy-beard",
    category: "beardCare",
    title: "Patchy Beard Growth",
    cause:
      "Uneven beard growth is often due to genetics, poor blood flow, or dry skin.",
    solution:
      "Nourish beard follicles and improve skin hydration.",
    steps: [
      "Wash beard regularly",
      "Massage beard oil daily",
      "Avoid aggressive trimming",
    ],
    products: [
      {
        id: "beard-growth-oil",
        name: "Beard Growth Oil",
        description: "Promotes thicker and healthier beard",
        usage: "Massage into beard skin",
        frequency: "Daily",
        why:
          "Improves blood circulation and nourishes dormant follicles",
        price: 599,
        rating: 4.7,
        reviews: 860,
        badge: "Recommended",
        shopifyHandle: "beard-growth-oil",
      },
    ],
  },

  /* ================= BODY CARE ================= */
  {
    id: "body-odor",
    category: "bodyCare",
    title: "Body Odor",
    cause:
      "Body odor results from bacteria breaking down sweat on the skin.",
    solution:
      "Reduce bacteria and control sweat production.",
    steps: [
      "Shower daily",
      "Use antibacterial body wash",
      "Apply deodorant after drying skin",
    ],
    products: [
      {
        id: "antibacterial-body-wash",
        name: "Antibacterial Body Wash",
        description: "Removes odor-causing bacteria",
        usage: "Use while showering",
        frequency: "Daily",
        why:
          "Targets bacteria at the source instead of masking odor",
        price: 349,
        rating: 4.2,
        reviews: 530,
        shopifyHandle: "antibacterial-body-wash",
      },
    ],
  },

  /* ================= HEALTH CARE ================= */
  {
    id: "low-energy",
    category: "healthCare",
    title: "Low Energy Levels",
    cause:
      "Poor sleep, stress, and nutritional deficiencies reduce energy.",
    solution:
      "Improve sleep quality and nutritional intake.",
    steps: [
      "Sleep 7–8 hours daily",
      "Stay hydrated",
      "Consume balanced meals",
    ],
    products: [
      {
        id: "daily-multivitamin",
        name: "Daily Multivitamin",
        description: "Supports overall energy and immunity",
        usage: "Take with water",
        frequency: "Once daily",
        why:
          "Fills nutritional gaps that cause fatigue",
        price: 699,
        rating: 4.6,
        reviews: 2100,
        badge: "Best Seller",
        shopifyHandle: "daily-multivitamin",
      },
    ],
  },

  /* ================= FITNESS ================= */
  {
    id: "fat-loss",
    category: "fitness",
    title: "Fat Loss & Conditioning",
    cause:
      "Sedentary lifestyle and excess calorie intake lead to fat gain.",
    solution:
      "Increase physical activity and metabolism.",
    steps: [
      "Exercise at least 4 times a week",
      "Combine strength and cardio training",
      "Maintain calorie control",
    ],
    products: [
      {
        id: "protein-supplement",
        name: "Protein Supplement",
        description: "Supports muscle recovery",
        usage: "Mix with water or milk",
        frequency: "Post-workout",
        why:
          "Improves muscle repair and boosts metabolism",
        price: 1299,
        rating: 4.5,
        reviews: 1750,
        badge: "Recommended",
        shopifyHandle: "protein-supplement",
      },
    ],
  },

  /* ================= FRAGRANCE ================= */
  {
    id: "long-lasting-fragrance",
    category: "fragrance",
    title: "Long-Lasting Fragrance",
    cause:
      "Fragrance fades due to dry skin and incorrect application.",
    solution:
      "Apply fragrance on hydrated pulse points.",
    steps: [
      "Moisturize skin before applying",
      "Apply on pulse points",
      "Avoid rubbing fragrance",
    ],
    products: [
      {
        id: "eau-de-parfum",
        name: "Eau De Parfum",
        description: "Long-lasting premium fragrance",
        usage: "Spray on pulse points",
        frequency: "Daily",
        why:
          "Higher oil concentration increases longevity",
        price: 1999,
        rating: 4.8,
        reviews: 980,
        badge: "New",
        shopifyHandle: "eau-de-parfum",
      },
    ],
  },
];
