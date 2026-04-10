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
    <section className="rounded-[2rem] border border-[#d9d9de] bg-white p-6 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-[#0071e3]" />
        <h3 className="text-lg font-black text-[#111]">Motivation & Rewards</h3>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.4rem] border border-[#d9d9de] bg-[#FFF8EE] p-4">
          <p className="text-xs text-[#6e6e73]">Daily Streak</p>
          <p className="mt-1 text-2xl font-bold text-[#1d1d1f]"> {streakDays} days</p>
        </div>

        <div className="rounded-[1.4rem] border border-[#d9d9de] bg-[#FFF8EE] p-4">
          <p className="text-xs text-[#6e6e73]">Alpha Sikka</p>
          <p className="mt-1 text-2xl font-bold text-[#1d1d1f]">{balance} A$</p>
        </div>

        <div className="rounded-[1.4rem] border border-[#d9d9de] bg-[#FFF8EE] p-4">
          <p className="text-xs text-[#6e6e73]">Next Reward</p>
          <p className="mt-1 text-sm font-bold text-[#1d1d1f]">{bestUnlockedReward ? `${bestUnlockedReward.discountPercent}% product unlock ready` : nextReward ? `${nextReward.discountPercent}% product discount` : "All reward tiers active"}</p>
          <p className="mt-1 text-[11px] text-[#6e6e73]">{bestUnlockedReward ? `Featured pick: ${productLabel}` : nextReward ? `Unlock at ${nextTier} A$ - ${productLabel}` : `Featured pick: ${productLabel}`}</p>
        </div>
      </div>

      <div className="mt-3 rounded-[1.6rem] border border-[#d9d9de] bg-[#FFF8EE] p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">Reward Progress</p>
          {rewardProgress.next && (
            <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[#0071e3]/20 bg-[#0071e3]/10 px-3 py-1 text-xs font-black text-[#1d1d1f]">
              Only {rewardProgress.remaining} A$ more to unlock {rewardProgress.next.discountPercent}% OFF
            </span>
          )}
        </div>
        <div className="h-3.5 overflow-hidden rounded-full bg-[#E7E1D7] shadow-inner">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-[#6e6e73] to-[#0071e3] shadow-[0_0_10px_rgba(47,111,87,0.5)] transition-all duration-1000" 
            style={{ width: `${percent}%` }} 
          />
        </div>
        <div className="mt-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-[#0071e3]">{bestUnlockedReward ? `${balance} A$ ready to convert` : `${balance} / ${nextTier} A$`}</p>
            <p className="mt-0.5 text-[11px] font-medium text-[#6e6e73]">Complete {daysToNudge} more day(s) to boost momentum.</p>
          </div>
          <Link href={primaryHref} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#1d1d1f] to-[#0071e3] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-md transition-transform hover:scale-[1.02]">
            <span>{primaryLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

