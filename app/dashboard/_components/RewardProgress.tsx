import { Gift } from "lucide-react";

type RewardProgressProps = {
  balance: number;
};

const rewardTiers = [50, 100, 200, 350];

export default function RewardProgress({ balance }: RewardProgressProps) {
  const nextTier = rewardTiers.find((tier) => balance < tier) ?? rewardTiers[rewardTiers.length - 1];
  const percent = Math.max(0, Math.min(100, Math.round((balance / nextTier) * 100)));

  return (
    <section className="af-card rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-[#2F6F57]" />
        <h3 className="text-lg font-bold text-[#1F3D2B]">Streak & Alpha Sikka Rewards</h3>
      </div>
      <div className="mt-4 rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
        <p className="text-xs text-[#6B665D]">Current Balance</p>
        <p className="mt-1 text-2xl font-bold text-[#1F3D2B]">{balance} A$</p>
        <p className="mt-2 text-xs text-[#6B665D]">Next Reward: 10% discount at {nextTier} A$</p>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E7E1D7]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#8C6A5A] to-[#2F6F57]" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1 text-xs font-semibold text-[#2F6F57]">{balance} / {nextTier}</p>
      </div>
    </section>
  );
}