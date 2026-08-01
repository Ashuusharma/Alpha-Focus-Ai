import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";
import { buildRewardProductHref, getRewardFunnelState } from "@/lib/alphaRewardCommerce";

type RewardProgressProps = {
  balance: number;
  streakDays: number;
};

export default function RewardProgress({ balance, streakDays }: RewardProgressProps) {
  const { rewardProgress, nextReward, nextProduct, bestUnlockedReward, unlockedProduct } = getRewardFunnelState(balance);
  const nextTier = nextReward?.cost ?? balance;
  const percent = rewardProgress.percent;
  const daysToNudge = Math.max(1, 5 - (streakDays % 5));
  const primaryHref = bestUnlockedReward ? buildRewardProductHref(bestUnlockedReward.discountPercent) : nextReward ? buildRewardProductHref(nextReward.discountPercent) : "/shop";
  const primaryLabel = bestUnlockedReward ? `Shop ${bestUnlockedReward.discountPercent}% unlock` : nextReward ? `Preview ${nextReward.discountPercent}% target` : "Open shop";
  const productLabel = unlockedProduct?.name || nextProduct?.name || "protocol product";

  return (
    <section className="rounded-[2rem] border border-[var(--border-hairline)] bg-white p-6 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-[var(--accent-blue)]" />
        <h3 className="text-lg font-black text-[var(--ink)]">Motivation & Rewards</h3>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.4rem] border border-[var(--border-hairline)] bg-[var(--tint-warm)] p-4">
          <p className="text-xs text-[var(--ink-soft)]">Daily Streak</p>
          <p className="mt-1 text-2xl font-bold text-[var(--ink)]"> {streakDays} days</p>
        </div>

        <div className="rounded-[1.4rem] border border-[var(--border-hairline)] bg-[var(--tint-warm)] p-4">
          <p className="text-xs text-[var(--ink-soft)]">Alpha Sikka</p>
          <p className="mt-1 text-2xl font-bold text-[var(--ink)]">{balance} A$</p>
        </div>

        <div className="rounded-[1.4rem] border border-[var(--border-hairline)] bg-[var(--tint-warm)] p-4">
          <p className="text-xs text-[var(--ink-soft)]">Next Reward</p>
          <p className="mt-1 text-sm font-bold text-[var(--ink)]">{bestUnlockedReward ? `${bestUnlockedReward.discountPercent}% product unlock ready` : nextReward ? `${nextReward.discountPercent}% product discount` : "All reward tiers active"}</p>
          <p className="mt-1 text-[11px] text-[var(--ink-soft)]">{bestUnlockedReward ? `Featured pick: ${productLabel}` : nextReward ? `Unlock at ${nextTier} A$ - ${productLabel}` : `Featured pick: ${productLabel}`}</p>
        </div>
      </div>

      <div className="mt-3 rounded-[1.6rem] border border-[var(--border-hairline)] bg-[var(--tint-warm)] p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">Reward Progress</p>
          {rewardProgress.next && (
            <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[var(--accent-blue)]/20 bg-[var(--accent-blue)]/10 px-3 py-1 text-xs font-black text-[var(--ink)]">
              Only {rewardProgress.remaining} A$ more to unlock {rewardProgress.next.discountPercent}% OFF
            </span>
          )}
        </div>
        <div className="h-3.5 overflow-hidden rounded-full bg-[var(--border-hairline)] shadow-inner">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-[var(--ink-soft)] to-[var(--accent-blue)] shadow-[0_0_10px_rgba(47,111,87,0.5)] transition-all duration-1000" 
            style={{ width: `${percent}%` }} 
          />
        </div>
        <div className="mt-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-[var(--accent-blue)]">{bestUnlockedReward ? `${balance} A$ ready to convert` : `${balance} / ${nextTier} A$`}</p>
            <p className="mt-0.5 text-[11px] font-medium text-[var(--ink-soft)]">Complete {daysToNudge} more day(s) to boost momentum.</p>
          </div>
          <Link href={primaryHref} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--ink)] to-[var(--accent-blue)] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-md transition-transform hover:scale-[1.02]">
            <span>{primaryLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

