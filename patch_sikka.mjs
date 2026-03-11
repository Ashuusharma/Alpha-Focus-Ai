import fs from 'fs';
const lines = fs.readFileSync('app/alpha-credits/page.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('if (loading) {'));
if (start !== -1) {
    const keep = lines.slice(0, start);
    keep.push(`  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <h1 className="text-3xl font-bold text-white">Sign in required</h1>
        <p className="text-zinc-400">Please sign in to view your Alpha Sikka dashboard and rewards.</p>
        <Link href="/" className="px-6 py-2 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition-colors">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 w-full animate-in fade-in duration-700">
      
      {/* 1. BALANCE PROGRESS HERO */}
      <div className="bg-gradient-to-br from-[#0a1a1f] to-[#0d2a33] border border-green-500/20 rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-400">Alpha Sikka Dashboard</p>
          <div className="flex items-baseline gap-4">
             <h1 className="text-6xl font-bold text-white font-playfair">{formatAmount(snapshot.model.currentBalance)} <span className="text-3xl text-zinc-400">A$</span></h1>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-sm text-zinc-400">Tier: <strong className="text-white">{snapshot.tier.label}</strong></span>
             <span className="w-1 h-1 rounded-full bg-zinc-600" />
             <span className="text-sm text-zinc-400">Lifetime: {formatAmount(snapshot.model.totalEarned)} A$</span>
          </div>
          <p className="text-sm text-zinc-500 max-w-xl">Earn and redeem A$ based on consistent routines, verified progress, and program completion. No noise, just measured effort translating into meaningful value.</p>
        </div>

        <div className="relative z-10 w-full md:w-auto flex flex-col items-center">
           <div className="w-40 h-40 relative">
            <svg height="160" width="160" className="transform -rotate-90">
              <circle stroke="rgba(255,255,255,0.05)" fill="transparent" strokeWidth="8" r="72" cx="80" cy="80" />
              <circle stroke="#4ade80" fill="transparent" strokeWidth="8" strokeDasharray="452" style={{ strokeDashoffset: 452 - (rewardProgress.percent / 100) * 452 }} strokeLinecap="round" r="72" cx="80" cy="80" className="drop-shadow-[0_0_10px_rgba(74,222,128,0.5)] transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white">{rewardProgress.percent}%</span>
              <span className="text-[10px] uppercase tracking-wider text-green-400 mt-1">Progress</span>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-zinc-400">
            {rewardProgress.next ? \`Next Reward: \${rewardProgress.next.cost} A$\` : 'Highest Tier Unlocked'}
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      {/* 2. DAILY EARNINGS & GROWTH ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Earnings Progress */}
        <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-green-400" /> Daily Earnings</h3>
             <span className="text-xs text-zinc-500 uppercase tracking-widest">{dailyEarned}/{DAILY_CAP} A$ Today</span>
           </div>
           
           <div className="space-y-6 flex-1 flex flex-col justify-center">
             <div>
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-zinc-300 font-medium">Daily Routine Cap</span>
                 <span className="text-white font-bold">{Math.round((dailyEarned/DAILY_CAP)*100)}%</span>
               </div>
               <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                 <div className="h-full bg-gradient-to-r from-blue-500 to-green-400 rounded-full transition-all" style={{ width: \`\${(dailyEarned/DAILY_CAP)*100}%\`}}></div>
               </div>
             </div>
             
             <div>
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-zinc-300 font-medium">Challenge Milestones</span>
                 <span className="text-white font-bold">{programProgress.completedCount}/3</span>
               </div>
               <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                 <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all" style={{ width: \`\${(programProgress.completedCount/3)*100}%\`}}></div>
               </div>
             </div>

              <div>
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-zinc-300 font-medium">Program Progress</span>
                 <span className="text-white font-bold">{programProgress.percent}%</span>
               </div>
               <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                 <div className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all" style={{ width: \`\${programProgress.percent}%\`}}></div>
               </div>
             </div>
           </div>
        </div>

        {/* Growth Actions */}
        <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Growth Actions</h3>
           </div>
           
           <div className="space-y-3">
             {EARN_ACTIONS.slice(0, 4).map((action) => (
                <button
                  key={action.code}
                  onClick={() => handleEarn(action)}
                  className="w-full bg-black/20 hover:bg-black/40 border border-white/5 hover:border-green-500/30 transition-all rounded-2xl p-4 flex items-center justify-between group"
                >
                  <div className="text-left">
                    <p className="text-white font-medium group-hover:text-green-400 transition-colors">{action.label}</p>
                    <p className="text-xs text-zinc-500">{action.helper}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-4 h-4 text-green-400" />
                  </div>
                </button>
             ))}
           </div>
        </div>
      </div>

      {/* 3. REWARD LADDER */}
      <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BadgePercent className="w-6 h-6 text-green-400" /> Reward Ladder
          </h2>
          <p className="text-zinc-400 mt-2 text-sm">Redeem your discipline for clinically meaningful clinical store discounts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rewardCatalog.map((reward) => {
             const canRedeem = snapshot.model.currentBalance >= reward.cost;
             return (
               <div key={reward.id} className="relative bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between overflow-hidden group hover:border-green-500/50 transition-colors">
                  {canRedeem && <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[40px] pointer-events-none rounded-full" />}
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-zinc-300 font-semibold">{formatAmount(reward.cost)} A$</div>
                      {canRedeem && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                    </div>
                    <p className="text-4xl font-bold text-white mb-2">{reward.discountPercent}% OFF</p>
                    <p className="text-xs text-zinc-500">Max 20% cart discount. Valid 30 days.</p>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward.discountPercent, reward.cost)}
                    disabled={!canRedeem}
                    className={\`mt-8 w-full py-3 rounded-xl font-bold text-sm transition-all \${
                      canRedeem 
                      ? 'bg-green-500 hover:bg-green-400 text-black shadow-[0_0_15px_rgba(74,222,128,0.3)]' 
                      : 'bg-white/5 text-zinc-500 cursor-not-allowed'
                    }\`}
                  >
                    {canRedeem ? 'Redeem Reward' : \`Need \${reward.cost - snapshot.model.currentBalance} A$\`}
                  </button>
               </div>
             );
          })}
        </div>
      </div>

      {/* 4. CLINICAL LEDGER */}
      <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock3 className="w-6 h-6 text-zinc-400" /> Audit Ledger
            </h2>
            <p className="text-zinc-400 mt-2 text-sm">Transparent history of all Alpha Sikka transactions.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-zinc-500 border-b border-white/10">
              <tr>
                <th className="pb-4 font-medium pr-4">Date</th>
                <th className="pb-4 font-medium pr-4 w-full">Activity</th>
                <th className="pb-4 font-medium text-right pr-4">Earned</th>
                <th className="pb-4 font-medium text-right pr-4">Spent</th>
                <th className="pb-4 font-medium text-right font-bold">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-zinc-500">No transactions recorded. Complete your protocol to start earning.</td></tr>
              ) : (
                history.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 text-zinc-400 pr-4">{new Date(tx.timestamp).toLocaleDateString()}</td>
                    <td className="py-4 text-white font-medium pr-4">{tx.label}</td>
                    <td className="py-4 text-green-400 text-right pr-4">{tx.type === 'earn' ? \`+\${tx.amount}\` : '-'}</td>
                    <td className="py-4 text-red-400 text-right pr-4">{tx.type === 'spend' ? \`-\${tx.amount}\` : '-'}</td>
                    <td className="py-4 text-white font-bold text-right">{tx.balanceAfter}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
`);
    fs.writeFileSync('app/alpha-credits/page.tsx', keep.join('\n'));
}
