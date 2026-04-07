"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { Coupon } from "@/lib/creditService";
import { applyCouponToSubtotal, getAvailableCoupons, getBestAvailableCoupon, markCouponApplied, markCouponRedeemed } from "@/lib/couponService";
import { consumeActiveRewardUnlock, getRewardCountdownLabel } from "@/lib/rewardUnlockService";
import { useCartStore } from "@/lib/cartStore";
import { formatINR } from "@/lib/currency";
import { useRewardStore } from "@/stores/useRewardStore";

const STEPS = [
  { id: 1, label: "Information" },
  { id: 2, label: "Shipping" },
  { id: 3, label: "Payment" },
];

function getResultTimeline(days?: number) {
   if (days && days >= 45) return `${days}+ days of consistent use`;
   if (days && days >= 21) return `${days} days with daily adherence`;
   return "21 to 45 days with consistent use";
}

export default function CheckoutPage() {
  const { items } = useCartStore();
   const activeReward = useRewardStore((state) => state.activeReward);
   const timeRemaining = useRewardStore((state) => state.timeRemaining);
   const isExpiringSoon = useRewardStore((state) => state.isExpiringSoon);
   const initializeRewardStore = useRewardStore((state) => state.initialize);
   const syncReward = useRewardStore((state) => state.syncReward);
   const [currentStep, setCurrentStep] = useState(1);
   const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
   const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
   const [couponMessage, setCouponMessage] = useState<string | null>(null);
   const [discount, setDiscount] = useState(0);

   const subtotal = useMemo(
      () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      [items]
   );
   const shipping = subtotal >= 1000 ? 0 : 99;
   const total = Math.max(0, subtotal - discount + shipping);

   useEffect(() => {
      setAvailableCoupons(getAvailableCoupons());
   }, []);

   useEffect(() => initializeRewardStore(), [initializeRewardStore]);

   useEffect(() => {
      if (activeReward && timeRemaining > 0) {
         const rewardDiscount = Math.round(subtotal * (activeReward.discountPercent / 100));
         setActiveCoupon(null);
         setDiscount(rewardDiscount);
         setCouponMessage(`Reward auto-applied: ${activeReward.discountPercent}% off`);
         return;
      }

      if (!activeCoupon) {
         setDiscount(0);
         return;
      }
      const result = applyCouponToSubtotal(activeCoupon.code, subtotal);
      if (!result.ok) {
         setCouponMessage(result.reason || "Coupon unavailable");
         setActiveCoupon(null);
         setDiscount(0);
         return;
      }
      setDiscount(result.discount);
      setCouponMessage(`${activeCoupon.discountPercent}% coupon applied`);
   }, [activeCoupon, activeReward, subtotal, timeRemaining]);

  const handleNext = () => setCurrentStep((prev) => Math.min(3, prev + 1));
  const handleBack = () => setCurrentStep((prev) => Math.max(1, prev - 1));

   const handleApplyBestCoupon = () => {
      if (activeReward) {
         setCouponMessage(`Active reward already applied: ${activeReward.discountPercent}% off`);
         return;
      }

      const coupons = getAvailableCoupons();
      setAvailableCoupons(coupons);
      const best = getBestAvailableCoupon(subtotal);
      if (!best) {
         setCouponMessage("No active coupons available");
         setActiveCoupon(null);
         setDiscount(0);
         return;
      }
      setActiveCoupon(best);
      markCouponApplied(best.code);
      setCouponMessage(`${best.discountPercent}% coupon applied`);
   };

   const handlePay = () => {
      const orderId = `order_${Date.now()}`;
      if (activeReward) {
         consumeActiveRewardUnlock({
            orderId,
            productId: items[0]?.id || null,
            discountApplied: discount,
         });
         syncReward();
      } else if (activeCoupon) {
         markCouponRedeemed(activeCoupon.code, orderId, discount);
         setAvailableCoupons(getAvailableCoupons());
      }
      setActiveCoupon(null);
      setDiscount(0);
   };

  if (items.length === 0 && currentStep === 1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4EFE6] text-[#1F3D2B]">
        <h1 className="text-2xl font-bold">Your Regimen is Empty</h1>
        <Link href="/shop" className="mt-4 px-6 py-2 bg-[#2F6F57] text-white rounded-xl">
          Return to Apothecary
        </Link>
      </div>
    );
  }

  return (
    <div className="af-page-shell min-h-screen pb-20 pt-24 text-[#1F3D2B]">
       <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-6 space-y-4">
          <div className="af-page-hero px-5 py-6 md:px-6">
             <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                   <div className="af-badge-row mb-3">
                      <span className="af-badge-chip text-[#2F6F57]">Secure checkout</span>
                      <span className="af-badge-chip text-[#A46A2D]">Routine-backed products</span>
                   </div>
                   <h1 className="text-clinical-heading text-3xl font-extrabold tracking-tight md:text-4xl">Complete payment with your plan, rewards, and trust signals visible.</h1>
                   <p className="mt-3 max-w-xl text-sm leading-7 text-[#6B665D]">This checkout keeps the product logic visible so users understand what they are buying, why it fits the protocol, and when results should be expected.</p>
                </div>
                <div className="af-card-secondary p-4 text-sm text-[#5F5A51] lg:max-w-[280px]">
                   <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Live summary</p>
                   <p className="mt-2 font-semibold text-[#1F3D2B]">{items.length} items ready</p>
                   <p className="mt-1">Rewards, coupons, and shipping logic are already applied below.</p>
                </div>
             </div>
          </div>
          <div className="rounded-2xl border border-[#C8DACF] bg-[#E8EFEA] px-4 py-3 text-sm text-[#1F3D2B] flex flex-wrap items-center gap-4 justify-between">
             <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#2F6F57]" /> Secure checkout</span>
             <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#2F6F57]" /> Dermatologist recommended products</span>
             <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#2F6F57]" /> 30-day guarantee</span>
          </div>
       </div>
       <div className="mx-auto max-w-7xl px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
          
          {/* Left Column: Form */}
          <div>
            {/* Breadcrumb / Steps */}
            <div className="mb-8 flex items-center space-x-2 text-sm text-[#6B665D]">
               <Link href="/shop" className="hover:text-[#1F3D2B]">Shop</Link>
               <ChevronRight className="h-4 w-4" />
               {STEPS.map((step, idx) => (
                  <div key={step.id} className="flex items-center">
                     <span className={`${currentStep >= step.id ? "font-bold text-[#1F3D2B]" : ""}`}>{step.label}</span>
                     {idx < STEPS.length - 1 && <ChevronRight className="h-4 w-4 mx-2" />}
                  </div>
               ))}
            </div>

            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-2xl font-bold text-[#1F3D2B]">Contact Information</h2>
                <div className="af-card-secondary p-6 space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-[#6B665D] mb-1">Email Address</label>
                    <input type="email" placeholder="john@example.com" className="w-full p-3 rounded-xl border border-[#E2DDD4] focus:ring-1 focus:ring-[#2F6F57] outline-none" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs uppercase font-bold text-[#6B665D] mb-1">First Name</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-[#E2DDD4] focus:ring-1 focus:ring-[#2F6F57] outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs uppercase font-bold text-[#6B665D] mb-1">Last Name</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-[#E2DDD4] focus:ring-1 focus:ring-[#2F6F57] outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-[#6B665D] mb-1">Address</label>
                    <input type="text" className="w-full p-3 rounded-xl border border-[#E2DDD4] focus:ring-1 focus:ring-[#2F6F57] outline-none" />
                  </div>
                  <div className="flex gap-4">
                     <div className="flex-1">
                       <label className="block text-xs uppercase font-bold text-[#6B665D] mb-1">City</label>
                       <input type="text" className="w-full p-3 rounded-xl border border-[#E2DDD4] focus:ring-1 focus:ring-[#2F6F57] outline-none" />
                     </div>
                     <div className="w-24">
                       <label className="block text-xs uppercase font-bold text-[#6B665D] mb-1">Zip</label>
                       <input type="text" className="w-full p-3 rounded-xl border border-[#E2DDD4] focus:ring-1 focus:ring-[#2F6F57] outline-none" />
                     </div>
                  </div>
                </div>
                <button onClick={handleNext} className="w-full bg-[#1F3D2B] text-white font-bold py-4 rounded-xl hover:bg-[#2A5239] transition-colors flex justify-center items-center gap-2">
                   Continue to Shipping <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {currentStep === 2 && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-bold text-[#1F3D2B]">Shipping Method</h2>
                  <div className="af-card-secondary p-6 space-y-4">
                     <label className="flex items-center justify-between p-4 border border-[#2F6F57] bg-[#E8EFEA] rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                           <div className="h-5 w-5 rounded-full border-[5px] border-[#2F6F57] bg-white"></div>
                           <div>
                              <p className="font-bold text-[#1F3D2B]">Standard Medical Shipping</p>
                              <p className="text-xs text-[#6B665D]">3-5 Business Days</p>
                           </div>
                        </div>
                        <span className="font-bold text-[#1F3D2B]">{shipping === 0 ? "Free" : formatINR(shipping)}</span>
                     </label>
                     <label className="flex items-center justify-between p-4 border border-[#E2DDD4] hover:bg-[#F4EFE6] rounded-xl cursor-pointer opacity-60">
                        <div className="flex items-center gap-3">
                           <div className="h-5 w-5 rounded-full border border-[#E2DDD4] bg-white"></div>
                           <div>
                              <p className="font-bold text-[#1F3D2B]">Priority Overnight</p>
                              <p className="text-xs text-[#6B665D]">1 Business Day</p>
                           </div>
                        </div>
                        <span className="font-bold text-[#1F3D2B]">{formatINR(299)}</span>
                     </label>
                  </div>
                  <div className="flex item-center gap-4">
                     <button onClick={handleBack} className="flex-1 py-4 text-[#6B665D] font-bold hover:text-[#1F3D2B] transition-colors">Back</button>
                     <button onClick={handleNext} className="flex-[2] bg-[#1F3D2B] text-white font-bold py-4 rounded-xl hover:bg-[#2A5239] transition-colors flex justify-center items-center gap-2">
                        Continue to Payment <ChevronRight className="h-4 w-4" />
                     </button>
                  </div>
               </div>
            )}

            {currentStep === 3 && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-bold text-[#1F3D2B]">Secure Payment</h2>
                  <div className="af-card-secondary p-6 space-y-6">
                     <div className="flex items-center justify-between text-sm text-[#6B665D] bg-[#F4EFE6] p-3 rounded-lg border border-[#E2DDD4]">
                        <div className="flex items-center gap-2">
                           <Lock className="h-4 w-4" /> 
                           <span>All transactions are encrypted and secure.</span>
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <div>
                           <label className="block text-xs uppercase font-bold text-[#6B665D] mb-1">Card Number</label>
                           <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B665D]" />
                              <input type="text" placeholder="0000 0000 0000 0000" className="w-full p-3 pl-10 rounded-xl border border-[#E2DDD4] focus:ring-1 focus:ring-[#2F6F57] outline-none font-mono" />
                           </div>
                        </div>
                        <div className="flex gap-4">
                           <div className="flex-1">
                              <label className="block text-xs uppercase font-bold text-[#6B665D] mb-1">Expiration</label>
                              <input type="text" placeholder="MM / YY" className="w-full p-3 rounded-xl border border-[#E2DDD4] focus:ring-1 focus:ring-[#2F6F57] outline-none font-mono" />
                           </div>
                           <div className="flex-1">
                              <label className="block text-xs uppercase font-bold text-[#6B665D] mb-1">CVC</label>
                              <input type="text" placeholder="123" className="w-full p-3 rounded-xl border border-[#E2DDD4] focus:ring-1 focus:ring-[#2F6F57] outline-none font-mono" />
                           </div>
                        </div>
                        <div>
                           <label className="block text-xs uppercase font-bold text-[#6B665D] mb-1">Cardholder Name</label>
                           <input type="text" className="w-full p-3 rounded-xl border border-[#E2DDD4] focus:ring-1 focus:ring-[#2F6F57] outline-none" />
                        </div>
                     </div>
                  </div>
                  <div className="flex item-center gap-4">
                     <button onClick={handleBack} className="flex-1 py-4 text-[#6B665D] font-bold hover:text-[#1F3D2B] transition-colors">Back</button>
                     <button onClick={handlePay} className="flex-[2] bg-[#1F3D2B] text-white font-bold py-4 rounded-xl hover:bg-[#2A5239] transition-colors flex justify-center items-center gap-2 shadow-lg shadow-[#1F3D2B]/20">
                        <ShieldCheck className="h-4 w-4" /> Pay {formatINR(total)}
                     </button>
                  </div>
               </div>
            )}
          </div>
          
          {/* Right Column: Summary */}
          <div className="lg:sticky lg:top-24 h-fit space-y-6">
             <div className="af-card-primary p-6">
                <h3 className="text-lg font-bold text-[#1F3D2B] mb-4">Order Summary</h3>
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                   {items.map((item) => (
                                 <div key={item.id} className="af-card-subtle p-3">
                                     <div className="flex gap-3">
                                        <div className="relative h-16 w-16 rounded-lg bg-[#F4EFE6] border border-[#E2DDD4] flex-shrink-0">
                           {/* Using placeholder or catalog image if available */}
                            <Image 
                              src={item.imageUrl || ""} 
                              alt={item.name} 
                              fill 
                              className="object-cover rounded-lg"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            /> 
                                        </div>
                                        <div className="flex-1">
                                             <div className="flex items-start justify-between gap-3">
                                                <div>
                                                   <p className="font-bold text-[#1F3D2B] text-sm line-clamp-1">{item.name}</p>
                                                   <p className="text-xs text-[#6B665D]">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-bold text-[#1F3D2B] text-sm">{formatINR(item.price * item.quantity)}</p>
                                             </div>

                                             <div className="mt-2 rounded-lg border border-[#E2DDD4] bg-white px-3 py-2 text-[11px] text-[#4A453E]">
                                                <p><span className="font-semibold text-[#1F3D2B]">Why this product:</span> {item.recommendationReason || "Recommended for your current severity, routine adherence, and recovery stage."}</p>
                                                <p className="mt-1"><span className="font-semibold text-[#1F3D2B]">Results timeline:</span> {getResultTimeline(item.usageDays)}</p>
                                                <p className="mt-1"><span className="font-semibold text-[#1F3D2B]">Protocol fit:</span> {item.protocolTier || "Core Protocol"}</p>
                                             </div>
                                        </div>
                                     </div>
                      </div>
                   ))}
                </div>

                        <div className="mt-4 rounded-xl border border-[#E2DDD4] bg-[#F4EFE6] p-3 space-y-2">
                           <div className="flex items-center justify-between text-sm text-[#1F3D2B]">
                              <span>{activeReward ? "Active reward" : "Alpha Credits coupon"}</span>
                              <button
                                 type="button"
                                 onClick={handleApplyBestCoupon}
                                 className="text-[#2F6F57] font-semibold hover:text-[#1F3D2B]"
                              >
                                 {activeReward ? "Auto applied" : "Apply best"}
                              </button>
                           </div>
                           {activeReward ? (
                              <div className="text-sm text-[#1F3D2B]">
                                 <p className="font-semibold">{activeReward.discountPercent}% reward applied automatically</p>
                                 <p className="text-xs text-[#6B665D]">{getRewardCountdownLabel(activeReward.expiresAt)} · expires {new Date(activeReward.expiresAt).toLocaleString()}</p>
                                 {isExpiringSoon && <p className="mt-1 text-xs font-semibold text-[#C94F3D]">Expiring soon. Finish payment in the next 2 hours.</p>}
                              </div>
                           ) : activeCoupon ? (
                              <div className="text-sm text-[#1F3D2B]">
                                 <p className="font-semibold">{activeCoupon.discountPercent}% off applied</p>
                                 <p className="text-xs text-[#6B665D]">Code {activeCoupon.code} · expires {new Date(activeCoupon.expiresAt).toLocaleDateString()}</p>
                              </div>
                           ) : (
                              <p className="text-xs text-[#6B665D]">
                                 {availableCoupons.length > 0
                                    ? "Tap apply to use your best coupon."
                                    : "No active coupons. Earn Alpha Credits to unlock."}
                              </p>
                           )}
                           {couponMessage && <p className="text-xs text-[#C94F3D]">{couponMessage}</p>}
                        </div>
                
                <div className="border-t border-[#E2DDD4] pt-4 space-y-2">
                   <div className="flex justify-between text-sm text-[#6B665D]">
                      <span>Subtotal</span>
                      <span>{formatINR(subtotal)}</span>
                   </div>
                            {discount > 0 && (
                               <div className="flex justify-between text-sm text-[#2F6F57]">
                                  <span>{activeReward ? `Reward (${activeReward.discountPercent}%)` : `Coupon ${activeCoupon ? `(${activeCoupon.discountPercent}%)` : ""}`}</span>
                                  <span>- {formatINR(discount)}</span>
                               </div>
                            )}
                   <div className="flex justify-between text-sm text-[#6B665D]">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
                   </div>
                   <div className="flex justify-between text-lg font-bold text-[#1F3D2B] pt-2">
                      <span>Total</span>
                                 <span>{formatINR(total)}</span>
                   </div>
                </div>
             </div>
             
             <div className="rounded-xl border border-[#C8DACF] bg-[#E8EFEA] p-4 flex items-start gap-3 shadow-[0_12px_24px_rgba(47,111,87,0.08)]">
                <ShieldCheck className="h-6 w-6 text-[#2F6F57] flex-shrink-0" />
                <div>
                   <h4 className="font-bold text-[#1F3D2B] text-sm">Satisfaction Guarantee</h4>
                   <p className="text-xs text-[#4A453E] mt-1">If this regimen doesn’t match your skin needs within 30 days, we'll replace it for free.</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
