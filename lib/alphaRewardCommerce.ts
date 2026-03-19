import { getRewardCatalog, getRewardProgress } from "@/lib/couponService";
import { PRODUCT_CATALOG_DATA, type ProductCatalogItem } from "@/lib/productCatalogData";

const FEATURED_PRODUCT_BY_DISCOUNT: Record<number, string> = {
  10: "CER-FOAM-CLS",
  20: "LRP-EFF-DUO",
  30: "ELT-UV-CLEAR-46",
  40: "TO-RET-05",
  50: "PC-BHA-LQD",
  60: "NEU-HYD-BOOST",
};

export function getRewardFeaturedProduct(discountPercent: number): ProductCatalogItem | null {
  const sku = FEATURED_PRODUCT_BY_DISCOUNT[discountPercent];
  if (!sku) return null;
  return PRODUCT_CATALOG_DATA.find((product) => product.sku === sku) || null;
}

export function buildRewardProductHref(discountPercent: number) {
  const product = getRewardFeaturedProduct(discountPercent);
  if (!product) {
    return "/shop";
  }

  return `/shop/${encodeURIComponent(product.sku || product.name)}?source=alpha-wallet&reward=${discountPercent}`;
}

export function getRewardFunnelState(balance: number) {
  const rewardProgress = getRewardProgress(balance);
  const nextReward = rewardProgress.next;
  const nextProduct = nextReward ? getRewardFeaturedProduct(nextReward.discountPercent) : null;
  const unlockedRewards = getRewardCatalog().filter((reward) => reward.cost <= balance);
  const bestUnlockedReward = unlockedRewards[unlockedRewards.length - 1] || null;
  const unlockedProduct = bestUnlockedReward ? getRewardFeaturedProduct(bestUnlockedReward.discountPercent) : null;

  return {
    rewardProgress,
    nextReward,
    nextProduct,
    bestUnlockedReward,
    unlockedProduct,
  };
}