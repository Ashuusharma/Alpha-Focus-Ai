export interface ProductCatalogItem {
  name: string;
  type: string;
  imageUrl: string;
  buyUrl: string;
  brand?: string;
  sku?: string;
  tags?: string[];
}

function normalizeProductKey(value: string): string {
  return value.trim().toLowerCase();
}

export const PRODUCT_CATALOG_DATA: ProductCatalogItem[] = [
  {
    name: "CeraVe Foaming Cleanser",
    type: "Cleanser",
    imageUrl: "https://images.unsplash.com/photo-1556228578-dd6ad651f184?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.cerave.com/",
    brand: "CeraVe",
    sku: "CER-FOAM-CLS",
    tags: ["acne", "oily", "cleanser"],
  },
  {
    name: "Paul's Choice BHA Liquid",
    type: "Exfoliant",
    imageUrl: "https://images.unsplash.com/photo-1571781418606-70265b9cce90?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.paulaschoice.com/",
    brand: "Paula's Choice",
    sku: "PC-BHA-LQD",
    tags: ["acne", "blackheads", "exfoliant"],
  },
  {
    name: "La Roche-Posay Effaclar Duo",
    type: "Treatment",
    imageUrl: "https://images.unsplash.com/photo-1611080541599-8c6dbde6ed28?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.laroche-posay.us/",
    brand: "La Roche-Posay",
    sku: "LRP-EFF-DUO",
    tags: ["acne", "spot", "treatment"],
  },
  {
    name: "The Ordinary Retinol 0.5%",
    type: "Serum",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://theordinary.com/",
    brand: "The Ordinary",
    sku: "TO-RET-05",
    tags: ["aging", "wrinkles", "serum"],
  },
  {
    name: "Neutrogena Hydro Boost",
    type: "Moisturizer",
    imageUrl: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.neutrogena.com/",
    brand: "Neutrogena",
    sku: "NEU-HYD-BOOST",
    tags: ["hydration", "barrier", "moisturizer"],
  },
  {
    name: "EltaMD UV Clear SPF 46",
    type: "Sunscreen",
    imageUrl: "https://images.unsplash.com/photo-1556228724-4c63f1f7fdb0?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://eltamd.com/",
    brand: "EltaMD",
    sku: "ELT-UV-CLEAR-46",
    tags: ["spf", "uv", "sunscreen"],
  },
  {
    name: "The Inkey List Caffeine Eye Cream",
    type: "Eye Cream",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.theinkeylist.com/",
    brand: "The Inkey List",
    sku: "TIL-CAF-EYE",
    tags: ["dark_circles", "eye", "puffiness"],
  },
  {
    name: "Ole Henriksen Banana Bright",
    type: "Eye Cream",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://olehenriksen.com/",
    brand: "Ole Henriksen",
    sku: "OH-BAN-BRIGHT",
    tags: ["dark_circles", "brightening", "eye"],
  },
  {
    name: "Cold Compress Mask",
    type: "Tool",
    imageUrl: "https://images.unsplash.com/photo-1631730359585-38a4935cbec4?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Cold+Compress+Mask+official+product",
    brand: "Generic",
    sku: "GEN-COLD-MASK",
    tags: ["dark_circles", "cooling", "tool"],
  },
  {
    name: "Retinol Correxion Serum",
    type: "Serum",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Retinol+Correxion+Serum+official+product",
    brand: "Generic",
    sku: "GEN-RET-SER",
    tags: ["aging", "retinol", "serum"],
  },
  {
    name: "Triple Peptide Cream",
    type: "Moisturizer",
    imageUrl: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Triple+Peptide+Cream+official+product",
    brand: "Generic",
    sku: "GEN-PEP-CREAM",
    tags: ["aging", "peptides", "moisturizer"],
  },
  {
    name: "Daily Defense SPF 50",
    type: "Sunscreen",
    imageUrl: "https://images.unsplash.com/photo-1556228724-4c63f1f7fdb0?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Daily+Defense+SPF+50+official+product",
    brand: "Generic",
    sku: "GEN-SPF-50",
    tags: ["uv", "spf", "protection"],
  },
  {
    name: "Caffeine Scalp Tonic",
    type: "Tonic",
    imageUrl: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Caffeine+Scalp+Tonic+official+product",
    brand: "Generic",
    sku: "GEN-CAF-TONIC",
    tags: ["hair_loss", "scalp", "tonic"],
  },
  {
    name: "Ketoconazole Shampoo",
    type: "Shampoo",
    imageUrl: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Ketoconazole+Shampoo+official+product",
    brand: "Generic",
    sku: "GEN-KETO-SHAM",
    tags: ["dandruff", "scalp", "shampoo"],
  },
  {
    name: "Hair Nutrition Complex",
    type: "Supplement",
    imageUrl: "https://images.unsplash.com/photo-1579165466949-3180a3d056d3?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Hair+Nutrition+Complex+official+product",
    brand: "Generic",
    sku: "GEN-HAIR-SUPP",
    tags: ["hair_loss", "nutrition", "supplement"],
  },
  {
    name: "Anti-Dandruff Control Shampoo",
    type: "Shampoo",
    imageUrl: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Anti-Dandruff+Control+Shampoo+official+product",
    brand: "Generic",
    sku: "GEN-ANTI-DAN",
    tags: ["dandruff", "shampoo", "itch"],
  },
  {
    name: "Scalp Exfoliating Serum",
    type: "Serum",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Scalp+Exfoliating+Serum+official+product",
    brand: "Generic",
    sku: "GEN-SCALP-SER",
    tags: ["dandruff", "scalp", "serum"],
  },
  {
    name: "Soothing Scalp Mist",
    type: "Mist",
    imageUrl: "https://images.unsplash.com/photo-1616627454822-4e9f884f5f36?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Soothing+Scalp+Mist+official+product",
    brand: "Generic",
    sku: "GEN-SCALP-MIST",
    tags: ["dandruff", "soothing", "mist"],
  },
  {
    name: "Beard Growth Serum",
    type: "Serum",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Beard+Growth+Serum+official+product",
    brand: "Generic",
    sku: "GEN-BEARD-SER",
    tags: ["beard_patchy", "growth", "serum"],
  },
  {
    name: "Nourishing Beard Oil",
    type: "Oil",
    imageUrl: "https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Nourishing+Beard+Oil+official+product",
    brand: "Generic",
    sku: "GEN-BEARD-OIL",
    tags: ["beard_patchy", "oil", "conditioning"],
  },
  {
    name: "Soft Beard Wash",
    type: "Cleanser",
    imageUrl: "https://images.unsplash.com/photo-1556228578-dd6ad651f184?q=80&w=1200&auto=format&fit=crop",
    buyUrl: "https://www.google.com/search?q=Soft+Beard+Wash+official+product",
    brand: "Generic",
    sku: "GEN-BEARD-WASH",
    tags: ["beard_patchy", "cleanser", "wash"],
  },
];

export function parseProductCatalogJson(input: string): ProductCatalogItem[] {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!Array.isArray(parsed)) return [];

    const output: ProductCatalogItem[] = [];

    parsed
      .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
      .forEach((entry) => {
        const name = typeof entry.name === "string" ? entry.name.trim() : "";
        const type = typeof entry.type === "string" ? entry.type.trim() : "";
        const imageUrl = typeof entry.imageUrl === "string" ? entry.imageUrl.trim() : "";
        const buyUrl = typeof entry.buyUrl === "string" ? entry.buyUrl.trim() : "";

        if (!name || !type || !imageUrl || !buyUrl) return;

        const item: ProductCatalogItem = { name, type, imageUrl, buyUrl };

        if (typeof entry.brand === "string" && entry.brand.trim()) {
          item.brand = entry.brand.trim();
        }
        if (typeof entry.sku === "string" && entry.sku.trim()) {
          item.sku = entry.sku.trim();
        }
        if (Array.isArray(entry.tags)) {
          const tags = entry.tags
            .filter((tag): tag is string => typeof tag === "string")
            .map((tag) => tag.trim())
            .filter(Boolean);
          if (tags.length > 0) item.tags = tags;
        }

        output.push(item);
      });

    return output;
  } catch {
    return [];
  }
}

export function getProductCatalogData(overrideJson?: string): ProductCatalogItem[] {
  if (!overrideJson) return PRODUCT_CATALOG_DATA;

  const overrides = parseProductCatalogJson(overrideJson);
  if (overrides.length === 0) return PRODUCT_CATALOG_DATA;

  const merged = new Map<string, ProductCatalogItem>();
  PRODUCT_CATALOG_DATA.forEach((item) => merged.set(normalizeProductKey(item.name), item));
  overrides.forEach((item) => merged.set(normalizeProductKey(item.name), item));
  return Array.from(merged.values());
}

export function findProductCatalogItemByName(
  productName: string,
  overrideJson?: string
): ProductCatalogItem | null {
  const key = normalizeProductKey(productName);
  if (!key) return null;

  const catalog = getProductCatalogData(overrideJson);
  const match = catalog.find((item) => normalizeProductKey(item.name) === key);
  return match || null;
}