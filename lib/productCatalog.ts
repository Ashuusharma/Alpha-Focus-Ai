import { findProductCatalogItemByName } from "@/lib/productCatalogData";

export interface ProductCatalogMeta {
  imageUrl: string;
  buyUrl: string;
}

function normalizeProductKey(value: string): string {
  return value.trim().toLowerCase();
}

const DEFAULT_IMAGE_BY_TYPE: Record<string, string> = {
  cleanser: "https://images.unsplash.com/photo-1556228578-dd6ad651f184?q=80&w=1200&auto=format&fit=crop",
  exfoliant: "https://images.unsplash.com/photo-1571781418606-70265b9cce90?q=80&w=1200&auto=format&fit=crop",
  treatment: "https://images.unsplash.com/photo-1611080541599-8c6dbde6ed28?q=80&w=1200&auto=format&fit=crop",
  serum: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200&auto=format&fit=crop",
  moisturizer: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1200&auto=format&fit=crop",
  sunscreen: "https://images.unsplash.com/photo-1556228724-4c63f1f7fdb0?q=80&w=1200&auto=format&fit=crop",
  "eye cream": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop",
  tonic: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?q=80&w=1200&auto=format&fit=crop",
  shampoo: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=1200&auto=format&fit=crop",
  supplement: "https://images.unsplash.com/photo-1579165466949-3180a3d056d3?q=80&w=1200&auto=format&fit=crop",
  oil: "https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?q=80&w=1200&auto=format&fit=crop",
  tool: "https://images.unsplash.com/photo-1631730359585-38a4935cbec4?q=80&w=1200&auto=format&fit=crop",
  mist: "https://images.unsplash.com/photo-1616627454822-4e9f884f5f36?q=80&w=1200&auto=format&fit=crop",
};

export function resolveProductMeta(
  productName: string,
  productType: string,
  explicit?: { imageUrl?: string; buyUrl?: string },
  overrideJson?: string
): ProductCatalogMeta {
  const match = findProductCatalogItemByName(productName, overrideJson);

  const imageUrl =
    explicit?.imageUrl ||
    match?.imageUrl ||
    DEFAULT_IMAGE_BY_TYPE[normalizeProductKey(productType)] ||
    "/images/report-fallback.svg";

  const buyUrl =
    explicit?.buyUrl ||
    match?.buyUrl ||
    `https://www.google.com/search?q=${encodeURIComponent(productName + " official product")}`;

  return { imageUrl, buyUrl };
}

export function resolveProductImage(
  productName: string,
  productType: string,
  explicitImageUrl?: string,
  overrideJson?: string
): string {
  return resolveProductMeta(productName, productType, { imageUrl: explicitImageUrl }, overrideJson).imageUrl;
}

export function resolveProductBuyUrl(
  productName: string,
  explicitBuyUrl?: string,
  overrideJson?: string
): string {
  return resolveProductMeta(productName, "", { buyUrl: explicitBuyUrl }, overrideJson).buyUrl;
}
