import type { Coupon, CouponRedemption, CreditSnapshot } from "@/lib/creditService";
import { getCreditSnapshot, mutateCreditState, spendCredits } from "@/lib/creditService";

const REWARD_CATALOG = [
  { id: "coupon_10", cost: 100, discountPercent: 10 },
  { id: "coupon_20", cost: 200, discountPercent: 20 },
  { id: "coupon_30", cost: 350, discountPercent: 30 },
  { id: "coupon_40", cost: 500, discountPercent: 40 },
  { id: "coupon_50", cost: 700, discountPercent: 50 },
  { id: "coupon_60", cost: 1000, discountPercent: 60 },
];

function markExpired(coupons: Coupon[]) {
  const now = Date.now();
  return coupons.map((coupon) => {
    const isExpired = new Date(coupon.expiresAt).getTime() < now;
    if (isExpired && coupon.status !== "redeemed" && coupon.status !== "expired") {
      return { ...coupon, status: "expired" as const };
    }
    return coupon;
  });
}

function getStateWithFreshCoupons(): CreditSnapshot {
  const snapshot = getCreditSnapshot();
  const hasExpired = snapshot.coupons.some((c) => new Date(c.expiresAt).getTime() < Date.now() && c.status !== "redeemed" && c.status !== "expired");
  if (!hasExpired) return snapshot;

  return mutateCreditState((draft) => {
    draft.coupons = markExpired(draft.coupons);
  });
}

export function getRewardCatalog() {
  return REWARD_CATALOG;
}

export function redeemReward(discountPercent: number) {
  const reward = REWARD_CATALOG.find((item) => item.discountPercent === discountPercent);
  if (!reward) return { ok: false, reason: "Invalid reward" } as const;

  const spend = spendCredits(reward.cost, { reason: `coupon_${discountPercent}` });
  if (!spend.ok) return spend;

  const now = new Date();
  const coupon: Coupon = {
    code: `AFOCUS-${discountPercent}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    discountPercent: reward.discountPercent,
    requiredCredits: reward.cost,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "issued",
  };

  const state = mutateCreditState((draft) => {
    draft.coupons = [coupon, ...markExpired(draft.coupons)].slice(0, 30);
  });

  return { ok: true, coupon, state } as const;
}

export function getAvailableCoupons() {
  const snapshot = getStateWithFreshCoupons();
  return snapshot.coupons.filter((c) => c.status === "issued" || c.status === "applied");
}

export function getBestAvailableCoupon(subtotal: number) {
  const available = getAvailableCoupons();
  if (available.length === 0) return null;
  return available
    .filter((c) => c.status === "issued" || c.status === "applied")
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .find((c) => subtotal * (c.discountPercent / 100) > 0) || null;
}

export function applyCouponToSubtotal(code: string, subtotal: number) {
  const snapshot = getStateWithFreshCoupons();
  const coupon = snapshot.coupons.find((c) => c.code === code);
  if (!coupon) return { ok: false, reason: "Coupon not found" } as const;
  if (coupon.status === "expired") return { ok: false, reason: "Coupon expired" } as const;
  if (coupon.status === "redeemed") return { ok: false, reason: "Coupon already used" } as const;

  const discount = Math.round(subtotal * (coupon.discountPercent / 100));
  const total = Math.max(0, subtotal - discount);

  return { ok: true, discount, total, coupon } as const;
}

export function markCouponApplied(code: string) {
  const snapshot = mutateCreditState((draft) => {
    draft.coupons = markExpired(draft.coupons).map((c) =>
      c.code === code ? { ...c, status: "applied", appliedAt: new Date().toISOString() } : c
    );
  });
  return snapshot;
}

export function markCouponRedeemed(code: string, orderId?: string, amountSaved?: number) {
  const snapshot = mutateCreditState((draft) => {
    const coupon = draft.coupons.find((c) => c.code === code);
    const now = new Date().toISOString();

    draft.coupons = markExpired(draft.coupons).map((c) =>
      c.code === code ? { ...c, status: "redeemed", redeemedAt: now, orderId } : c
    );

    const redemption: CouponRedemption = {
      couponCode: code,
      orderId,
      redeemedAt: now,
      discountPercent: coupon?.discountPercent || 0,
      amountSaved,
    };

    draft.redemptions = [redemption, ...draft.redemptions].slice(0, 50);
  });

  return snapshot;
}

export function getRedemptions() {
  return getStateWithFreshCoupons().redemptions;
}

export function getRewardProgress(balance: number) {
  const ladder = [...REWARD_CATALOG].sort((a, b) => a.cost - b.cost);
  const next = ladder.find((item) => item.cost > balance) || null;
  const previous = [...ladder].filter((item) => item.cost <= balance).pop();

  if (!next) {
    return { next: null, remaining: 0, percent: 100 } as const;
  }

  const floor = previous ? previous.cost : 0;
  const span = next.cost - floor;
  const progressed = Math.max(0, balance - floor);
  const percent = Math.min(100, Math.round((progressed / span) * 100));

  return { next, remaining: Math.max(0, next.cost - balance), percent } as const;
}
