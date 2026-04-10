"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMounted } from "@/app/hooks/useMounted";
import { useCartStore, type CartItem } from "@/lib/cartStore";
import { applyCouponToSubtotal, getBestAvailableCoupon, markCouponApplied } from "@/lib/couponService";
import { getCreditSnapshot } from "@/lib/creditService";
import { getActiveUserName } from "@/lib/userScopedStorage";
import { Info } from "lucide-react";

function formatCurrency(value: number) {
  return `Rs ${Math.max(0, Math.round(value))}`;
}

type UpsellCard = {
  id: string;
  name: string;
  price: number;
  concern: string;
  reason: string;
  matchPercent: number;
  imageUrl?: string;
};

const CLINICAL_UPSELLS: UpsellCard[] = [
  {
    id: "upsell-scalp-serum",
    name: "Scalp Recovery Serum",
    price: 999,
    concern: "dandruff",
    reason: "Supports scalp barrier recovery and reduces recurrent flakes.",
    matchPercent: 93,
    imageUrl: "/images/question-fallback.svg",
  },
  {
    id: "upsell-anti-inflammatory-cleanser",
    name: "Barrier Calm Cleanser",
    price: 799,
    concern: "inflammation",
    reason: "Calms redness and irritation while preserving skin microbiome.",
    matchPercent: 91,
    imageUrl: "/images/question-fallback.svg",
  },
  {
    id: "upsell-night-repair",
    name: "Night Repair Complex",
    price: 1299,
    concern: "acne",
    reason: "Improves overnight repair and helps prevent post-inflammatory marks.",
    matchPercent: 90,
    imageUrl: "/images/question-fallback.svg",
  },
  {
    id: "upsell-hair-density-tonic",
    name: "Hair Density Tonic",
    price: 1499,
    concern: "hairfall",
    reason: "Complements anti-hairfall protocols by supporting follicle vitality.",
    matchPercent: 92,
    imageUrl: "/images/question-fallback.svg",
  },
  {
    id: "upsell-spf-shield",
    name: "Clinical SPF Shield",
    price: 899,
    concern: "pigmentation",
    reason: "Protects against UV-triggered pigmentation rebound.",
    matchPercent: 89,
    imageUrl: "/images/question-fallback.svg",
  },
];

function normalizeConcern(text?: string) {
  const source = (text || "").toLowerCase();
  if (source.includes("dandruff") || source.includes("scalp")) return "dandruff";
  if (source.includes("inflam") || source.includes("redness") || source.includes("sensitive")) return "inflammation";
  if (source.includes("acne") || source.includes("breakout") || source.includes("oil")) return "acne";
  if (source.includes("hairfall") || source.includes("hair loss") || source.includes("thinning")) return "hairfall";
  if (source.includes("pigment") || source.includes("tan") || source.includes("dark spot")) return "pigmentation";
  return "inflammation";
}

function derivePrimaryConcern(items: CartItem[]) {
  if (items.length === 0) return "inflammation";
  const firstConcern = items.find((item) => item.recommendedConcern)?.recommendedConcern;
  if (firstConcern) return normalizeConcern(firstConcern);
  const nameJoined = items.map((item) => item.name).join(" ");
  return normalizeConcern(nameJoined);
}

function deriveMatchPercent(item: CartItem) {
  const base = item.improvementImpactPct ?? 14;
  return Math.max(78, Math.min(98, 74 + Math.round(base)));
}

function buildClinicalUpsells(items: CartItem[]) {
  const concern = derivePrimaryConcern(items);
  const inCartIds = new Set(items.map((item) => item.id));
  const primary = CLINICAL_UPSELLS.filter((card) => card.concern === concern && !inCartIds.has(card.id));
  const fallback = CLINICAL_UPSELLS.filter((card) => !inCartIds.has(card.id));
  const merged = [...primary, ...fallback];
  const dedup = new Map<string, UpsellCard>();
  merged.forEach((item) => {
    if (!dedup.has(item.id)) dedup.set(item.id, item);
  });
  return Array.from(dedup.values()).slice(0, 3);
}

function CartHeader({
  count,
  subtotal,
  onClose,
}: {
  count: number;
  subtotal: number;
  onClose: () => void;
}) {
  return (
    <div className="border-b border-[#E7E1D7] px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-[#1d1d1f]">Your Clinical Cart</h3>
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#eef5ff] px-2 text-xs font-semibold text-[#0071e3]">
            {count}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close cart"
          className="rounded-lg border border-[#DFD8CD] bg-white px-2.5 py-1.5 text-sm font-medium text-[#5F7A69] hover:shadow-sm"
        >
          x
        </button>
      </div>
      <p className="mt-1 text-xs text-[#6A7F71]">Subtotal: {formatCurrency(subtotal)}  -  Clinical recommendations optimized</p>
    </div>
  );
}

function RecommendationReason({ reason }: { reason: string }) {
  return (
    <div className="mt-2 rounded-lg border border-[#E8E3DA] bg-[#FBF9F5] px-3 py-2">
      <p className="text-[11px] text-[#5F7A69]">Why recommended</p>
      <p className="text-xs text-[#4F6558]">{reason}</p>
    </div>
  );
}

function CartItemsList({
  items,
  onRemove,
  onQty,
}: {
  items: CartItem[];
  onRemove: (id: string) => void;
  onQty: (id: string, qty: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="px-5 py-6 text-sm text-[#5F7A69]">
        Your clinical cart is empty. Add protocol products to begin guided checkout.
      </div>
    );
  }

  return (
    <div className="space-y-4 px-5 py-5">
      {items.map((item) => {
        const matchPercent = deriveMatchPercent(item);
        const reason = item.recommendationReason || "Recommended for inflammation control";
        const discountedPrice = item.price;
        const hasSavings = false;

        return (
          <div key={`${item.userId || "guest"}-${item.id}`} className="rounded-xl border border-[#E6DED2] bg-[#FAF8F3] p-4 shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-start gap-3">
              <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl border border-[#d9d9de] bg-white">
                <img
                  src={item.imageUrl || "/images/question-fallback.svg"}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-1 top-1 inline-flex rounded-full bg-[#0071e3] px-2 py-0.5 text-[10px] font-semibold text-white">
                  {matchPercent}% Match
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1d1d1f]">{item.name}</p>
                    <p className="mt-0.5 text-xs text-[#6A7F71]">{item.protocolTier || "Core Protocol"}</p>
                    <p className="mt-1 text-xs text-[#4F6558]">{reason}</p>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="rounded-lg border border-[#E3DBCF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#6A7F71]"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => onQty(item.id, Math.max(1, item.quantity - 1))}
                    className="h-7 w-7 rounded-lg border border-[#DDD5C8] bg-white text-sm text-[#4F6558]"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-sm font-medium text-[#1d1d1f]">{item.quantity}</span>
                  <button
                    onClick={() => onQty(item.id, item.quantity + 1)}
                    className="h-7 w-7 rounded-lg border border-[#DDD5C8] bg-white text-sm text-[#4F6558]"
                  >
                    +
                  </button>

                  <div className="ml-auto text-right">
                    <p className="text-sm font-semibold text-[#1d1d1f]">{formatCurrency(discountedPrice * item.quantity)}</p>
                    {hasSavings && (
                      <span className="inline-flex rounded-full bg-[#eef5ff] px-2 py-0.5 text-[10px] font-semibold text-[#0071e3]">
                        Saving {formatCurrency((item.price - discountedPrice) * item.quantity)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <RecommendationReason reason={reason} />
          </div>
        );
      })}
    </div>
  );
}

function ClinicalUpsellSection({
  upsells,
  onQuickAdd,
}: {
  upsells: UpsellCard[];
  onQuickAdd: (item: UpsellCard) => void;
}) {
  if (upsells.length === 0) return null;

  return (
    <div className="border-t border-[#E7E1D7] px-5 py-4">
      <h4 className="text-sm font-semibold text-[#1d1d1f]">Recommended to Improve Results Faster</h4>
      <div className="mt-3 space-y-3">
        {upsells.map((item) => (
          <div key={item.id} className="rounded-xl border border-[#E6DED2] bg-white p-3">
            <div className="flex items-start gap-3">
              <img
                src={item.imageUrl || "/images/question-fallback.svg"}
                alt={item.name}
                className="h-14 w-14 rounded-lg border border-[#d9d9de] object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-[#1d1d1f]">{item.name}</p>
                  <span className="rounded-full bg-[#eef5ff] px-2 py-0.5 text-[10px] font-semibold text-[#0071e3]">{item.matchPercent}%</span>
                </div>
                <p className="mt-1 text-xs text-[#5F7A69]">{formatCurrency(item.price)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    title={item.reason}
                    className="inline-flex items-center gap-1 rounded-full border border-[#D9D2C6] px-2 py-1 text-[11px] font-medium text-[#5F7A69]"
                  >
                    <Info className="h-3 w-3" />
                    Why recommended
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickAdd(item)}
                    className="ml-auto rounded-full bg-[#0071e3] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#005bbf]"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RewardsDiscountSection({
  availableCredits,
  eligibleDiscount,
  appliedCouponCode,
  onApplyBest,
}: {
  availableCredits: number;
  eligibleDiscount: number;
  appliedCouponCode: string | null;
  onApplyBest: () => void;
}) {
  return (
    <div className="border-t border-[#E7E1D7] px-5 py-4">
      <h4 className="text-sm font-semibold text-[#1d1d1f]">Rewards & Discount</h4>
      <div className="mt-2 rounded-xl border border-[#E6DED2] bg-[#FBF9F5] p-3">
        <p className="text-xs text-[#5F7A69]">Available Credits: <span className="font-semibold text-[#1d1d1f]">{availableCredits} A$</span></p>
        <p className="mt-1 text-xs text-[#5F7A69]">Eligible Discount: <span className="font-semibold text-[#1d1d1f]">{eligibleDiscount}%</span></p>
        <button
          type="button"
          onClick={onApplyBest}
          className="mt-3 w-full rounded-xl border border-[#d9d9de] bg-[#eef5ff] px-3 py-2 text-xs font-semibold text-[#0071e3] hover:bg-[#dce9ff]"
        >
          Apply Best Available Discount
        </button>
        {appliedCouponCode && (
          <span className="mt-2 inline-flex rounded-full bg-[#0071e3] px-2.5 py-1 text-[10px] font-semibold text-white">
            Applied coupon: {appliedCouponCode}
          </span>
        )}
      </div>
    </div>
  );
}

function OrderSummary({
  subtotal,
  discount,
  tax,
  shipping,
  total,
}: {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}) {
  return (
    <div className="space-y-2 border-t border-[#E7E1D7] px-5 pt-4 text-sm">
      <div className="flex items-center justify-between text-[#5F7A69]">
        <span>Subtotal</span>
        <span className="font-medium text-[#1d1d1f]">{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between text-[#5F7A69]">
        <span>Discount</span>
        <span className="font-medium text-[#1d1d1f]">-{formatCurrency(discount)}</span>
      </div>
      <div className="flex items-center justify-between text-[#5F7A69]">
        <span>Estimated Tax</span>
        <span className="font-medium text-[#1d1d1f]">{formatCurrency(tax)}</span>
      </div>
      <div className="flex items-center justify-between text-[#5F7A69]">
        <span>Shipping</span>
        <span className="font-medium text-[#1d1d1f]">{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-[#E7E1D7] pt-2 text-[#1d1d1f]">
        <span className="font-semibold">Total</span>
        <span className="text-base font-bold">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

function CheckoutCTA({
  disabled,
  onCheckout,
  onContinueShopping,
}: {
  disabled: boolean;
  onCheckout: () => void;
  onContinueShopping: () => void;
}) {
  return (
    <div className="px-5 pb-4 pt-4">
      <button
        disabled={disabled}
        onClick={onCheckout}
        className="w-full rounded-xl bg-[#0071e3] px-4 py-3 text-sm font-semibold text-[#F4F1EB] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Proceed to Secure Checkout
      </button>
      <button
        type="button"
        onClick={onContinueShopping}
        className="mt-2 w-full rounded-xl border border-[#DAD3C7] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f]"
      >
        Continue Shopping
      </button>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#5F7A69]">
        <span className="rounded-full border border-[#E6DED2] px-2 py-1">Secure Payment</span>
        <span className="rounded-full border border-[#E6DED2] px-2 py-1">Encrypted</span>
        <span className="rounded-full border border-[#E6DED2] px-2 py-1">30-Day Support</span>
      </div>
    </div>
  );
}

export default function ProfessionalCartDrawer({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const mounted = useMounted();
  const router = useRouter();

  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState(0);

  const isControlled = typeof open === "boolean";
  const drawerOpen = isControlled ? !!open : isOpen;
  const handleClose = onClose ?? closeCart;

  const activeUserId = (getActiveUserName() || "guest").trim() || "guest";

  const userItems = useMemo(
    () => items.filter((item) => (((item.userId || "guest").trim() || "guest") === activeUserId)),
    [activeUserId, items]
  );

  const subtotal = useMemo(
    () => userItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [userItems]
  );

  const upsells = useMemo(() => buildClinicalUpsells(userItems), [userItems]);

  const bestCoupon = useMemo(() => getBestAvailableCoupon(subtotal), [subtotal, appliedCouponCode]);

  const eligibleDiscount = bestCoupon?.discountPercent ?? 0;

  const tax = Math.round(Math.max(0, subtotal - appliedDiscountAmount) * 0.05);
  const shipping = subtotal >= 499 || subtotal === 0 ? 0 : 49;
  const total = Math.max(0, subtotal - appliedDiscountAmount) + tax + shipping;

  useEffect(() => {
    const snapshot = getCreditSnapshot();
    setAvailableCredits(snapshot.model.currentBalance || 0);
  }, [drawerOpen]);

  useEffect(() => {
    if (subtotal <= 0) {
      setAppliedCouponCode(null);
      setAppliedDiscountAmount(0);
      return;
    }

    if (!appliedCouponCode) return;
    const applied = applyCouponToSubtotal(appliedCouponCode, subtotal);
    if (!applied.ok) {
      setAppliedCouponCode(null);
      setAppliedDiscountAmount(0);
      return;
    }

    setAppliedDiscountAmount(applied.discount);
  }, [appliedCouponCode, subtotal]);

  if (!mounted) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/35 transition-opacity duration-[250ms] ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={handleClose}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 h-full w-full sm:w-[460px] sm:max-w-[480px] transform bg-[#F4F1EB] shadow-[0_18px_36px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-label="Cart drawer"
      >
        <div className="flex h-full flex-col">
          <CartHeader count={userItems.length} subtotal={subtotal} onClose={handleClose} />

          <div className="h-full overflow-y-auto">
            <CartItemsList items={userItems} onRemove={removeItem} onQty={updateQty} />

            <ClinicalUpsellSection
              upsells={upsells}
              onQuickAdd={(upsell) => {
                addItem({
                  id: upsell.id,
                  name: upsell.name,
                  price: upsell.price,
                  quantity: 1,
                  imageUrl: upsell.imageUrl,
                  recommendationReason: upsell.reason,
                  recommendedConcern: upsell.concern,
                  improvementImpactPct: Math.max(12, Math.round((upsell.matchPercent - 70) / 2)),
                  protocolTier: "Clinical Booster",
                });
              }}
            />

            <RewardsDiscountSection
              availableCredits={availableCredits}
              eligibleDiscount={eligibleDiscount}
              appliedCouponCode={appliedCouponCode}
              onApplyBest={() => {
                if (!bestCoupon) return;
                markCouponApplied(bestCoupon.code);
                const applied = applyCouponToSubtotal(bestCoupon.code, subtotal);
                if (!applied.ok) return;
                setAppliedCouponCode(bestCoupon.code);
                setAppliedDiscountAmount(applied.discount);
              }}
            />
          </div>

          <OrderSummary subtotal={subtotal} discount={appliedDiscountAmount} tax={tax} shipping={shipping} total={total} />
          <CheckoutCTA
            disabled={userItems.length === 0}
            onCheckout={() => {
              router.push("/checkout");
              handleClose();
            }}
            onContinueShopping={() => {
              router.push("/shop");
              handleClose();
            }}
          />
        </div>
      </aside>
    </>
  );
}


