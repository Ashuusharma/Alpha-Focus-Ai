import fs from 'fs';
const file = 'app/challenges/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
  if (view === "list") {
    return (
      <div className="flex flex-col h-full w-full bg-[#071318] min-h-screen animate-in fade-in duration-700">
        {/* Glow Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-green-500/5 blur-[120px] rounded-full opacity-30" />
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full opacity-30" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs font-bold text-green-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4" /> Clinical Programs
              </p>
              <h1 className="text-4xl lg:text-5xl font-bold text-white font-playfair tracking-wide text-shadow-glow">
                Discipline Accelerators
              </h1>
              <p className="text-zinc-400 mt-3 max-w-xl text-sm leading-relaxed">
                Structured habit-building trajectories engineered to repair specific symptoms over defined timelines.
              </p>
            </div>
            {/* Active Challenge Summary */}
            {activeChallengeId && progress && (
               <div className="bg-black/20 backdrop-blur-md border border-green-500/20 rounded-2xl p-5 shadow-2xl flex items-center gap-6 cursor-pointer hover:border-green-500/40 transition-all" onClick={() => {
                 const c = challenges.find((ch) => ch.id === activeChallengeId);
                 if (c) openChallenge(c);
               }}>
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-xl">
                    {challenges.find((ch) => ch.id === activeChallengeId)?.icon || "🔥"}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-green-400 uppercase tracking-wider font-bold mb-1">Active Now</p>
                    <p className="text-sm font-bold text-white truncate max-w-[150px]">{challenges.find((ch) => ch.id === activeChallengeId)?.title}</p>
                  </div>
                  <div className="flex items-center gap-4 border-l border-white/10 pl-4">
                     <div className="text-center">
                       <p className="text-lg font-bold text-orange-400 flex items-center gap-1"><Flame className="w-4 h-4"/>{progress.streak}</p>
                       <p className="text-[10px] text-zinc-500">Streak</p>
                     </div>
                     <div className="text-center">
                       <p className="text-lg font-bold text-yellow-400">{progress.totalXP}</p>
                       <p className="text-[10px] text-zinc-500">A$</p>
                     </div>
                  </div>
               </div>
            )}
          </div>

          {/* Catalog */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((challenge, idx) => {
              const isActive = activeChallengeId === challenge.id;
              const savedProgress = loadChallengeProgress(challenge.id);
              const pct = savedProgress
                ? Math.round((savedProgress.completedDays.length / challenge.totalDays) * 100)
                : 0;

              return (
                <div
                  key={challenge.id}
                  onClick={() => openChallenge(challenge)}
                  className={\`group relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer shadow-xl \${
                    isActive
                      ? "border-green-500/30 bg-green-500/5 shadow-[0_0_30px_rgba(74,222,128,0.1)]"
                      : "bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5"
                  }\`}
                >
                  <div className="p-6 h-full flex flex-col justify-between">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner relative overflow-hidden group-hover:scale-110 transition-transform">
                        <span className="relative z-10">{challenge.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors line-clamp-1">{challenge.title}</h2>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mb-3">{challenge.subtitle}</p>
                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-4">{challenge.description}</p>
                        
                        <div className="flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                          <span className="px-2 py-1 rounded bg-white/5 border border-white/5">{challenge.category}</span>
                          <span className="px-2 py-1 rounded bg-white/5 border border-white/5">{challenge.totalDays} Days</span>
                          <span className="px-2 py-1 rounded border border-yellow-500/20 text-yellow-400 bg-yellow-500/10 flex items-center gap-1">
                             <Circle className="w-3 h-3 fill-yellow-400"/>
                             Earn {challenge.totalDays * 10} A$
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Mini */}
                    {savedProgress && (
                      <div className="mt-6 pt-4 border-t border-white/5">
                        <div className="flex justify-between text-xs mb-2">
                           <span className="text-zinc-500 font-medium">Completion</span>
                           <span className="text-green-400 font-bold">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-green-400 rounded-full" style={{ width: \`\${pct}%\` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── DETAIL VIEW ────────────────────────────────
  if (!selectedChallenge) return null;

  const isActive = activeChallengeId === selectedChallenge.id;
  const inProgress = progress?.completedDays.length ? progress.completedDays.length > 0 : false;
  
  return (
    <div className="min-h-screen bg-[#071318] text-white relative overflow-hidden flex flex-col">
       <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 blur-[120px] rounded-full opacity-30" />
       </div>

       {/* Top Nav */}
       <div className="sticky top-0 z-30 bg-[#0a1a1f]/80 backdrop-blur-xl border-b border-white/5 shadow-lg">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
             <button onClick={() => setView("list")} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
               <ChevronLeft className="w-5 h-5"/> Back to Catalog
             </button>
             {isActive && progress && (
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-green-400 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
                     {progress.completedDays.length} / {selectedChallenge.totalDays} Days
                  </span>
                  <div className="w-24 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                     <div className="h-full bg-green-400" style={{ width: \`\${completionPercent}%\`}} />
                  </div>
                </div>
             )}
          </div>
       </div>

       <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Header Info Left Col */}
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-black/20 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-green-400 opacity-50" />
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-6 shadow-inner">
                   {selectedChallenge.icon}
                </div>
                <h1 className="text-3xl font-bold text-white leading-tight mb-2">{selectedChallenge.title}</h1>
                <p className="text-sm font-medium text-green-400 mb-6">{selectedChallenge.subtitle}</p>
                <div className="space-y-4 text-sm text-zinc-400">
                   <p>{selectedChallenge.description}</p>
                   <div className="pt-4 border-t border-white/5">
                     <div className="flex justify-between items-center py-2">
                        <span>Category</span>
                        <span className="text-white font-medium capitalize">{selectedChallenge.category}</span>
                     </div>
                     <div className="flex justify-between items-center py-2">
                        <span>Duration</span>
                        <span className="text-white font-medium">{selectedChallenge.totalDays} Days</span>
                     </div>
                     <div className="flex justify-between items-center py-2">
                        <span>Max Rewards</span>
                        <span className="text-yellow-400 font-bold">{selectedChallenge.totalDays * 10} A$</span>
                     </div>
                   </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                   {!inProgress ? (
                     <button onClick={() => startChallenge(selectedChallenge)} className="w-full bg-green-500 hover:bg-green-400 text-black py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(74,222,128,0.3)] transition-all">
                       Start Protocol
                     </button>
                   ) : !isActive ? (
                     <button onClick={() => setChallengeActive(selectedChallenge.id)} className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 py-4 rounded-xl font-bold transition-all">
                       Resume Program
                     </button>
                   ) : (
                     <button onClick={pauseActiveChallenge} className="w-full bg-black/40 hover:bg-white/5 text-zinc-400 border border-white/5 py-4 rounded-xl font-semibold transition-all">
                       Pause Protocol
                     </button>
                   )}

                   {inProgress && (
                      <button onClick={() => restartChallenge(selectedChallenge)} className="w-full text-xs text-red-400/50 hover:text-red-400 py-2 transition-colors">
                        Hard Reset Progress
                      </button>
                   )}
                </div>
             </div>
          </div>

          {/* Ladder / Roadmap Right Col */}
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-black/20 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col h-full">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 overflow-x-auto gap-4 hide-scrollbar">
                   {selectedChallenge.weeks.map((week, wIdx) => (
                      <button
                        key={wIdx}
                        onClick={() => setActiveWeek(wIdx)}
                        className={\`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border \${
                           activeWeek === wIdx 
                           ? "bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.1)]"
                           : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                        }\`}
                      >
                         Phase {week.weekNumber}
                      </button>
                   ))}
                </div>

                <div className="flex-1 space-y-4">
                   <div className="mb-6">
                      <h3 className="text-xl font-bold text-white">{selectedChallenge.weeks[activeWeek].theme}</h3>
                      <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Tasks to complete this phase</p>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedChallenge.weeks[activeWeek].tasks.map((task, tIdx) => {
                         const isDone = getDayStatus(task.day);
                         const isLocked = !isActive && !isDone;

                         return (
                            <button
                              key={task.day}
                              disabled={isLocked}
                              onClick={() => isActive && toggleDay(task.day, 10)}
                              className={\`relative text-left p-4 rounded-2xl border transition-all duration-300 overflow-hidden \${
                                 isDone 
                                   ? "bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(74,222,128,0.05)]"
                                   : isLocked
                                   ? "bg-black/40 border-white/5 opacity-50 cursor-not-allowed"
                                   : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                              }\`}
                            >
                               <div className="flex items-start gap-4">
                                  <div className={\`w-6 h-6 shrink-0 rounded-full flex items-center justify-center border \${
                                     isDone ? "bg-green-500 border-green-500 text-black" : "border-zinc-600 text-transparent"
                                  }\`}>
                                     {isDone && <CheckCircle2 className="w-4 h-4"/>}
                                  </div>
                                  <div className="flex-1">
                                     <div className="flex justify-between items-center mb-1">
                                        <span className={\`text-[10px] font-bold uppercase tracking-widest \${isDone? "text-green-400" : "text-zinc-500"}\`}>Day {task.day}</span>
                                        <span className="text-[10px] font-mono text-yellow-500 bg-yellow-500/10 px-1.5 rounded opacity-70">+10 A$</span>
                                     </div>
                                     <p className={\`text-sm font-medium \${isDone ? "text-white" : "text-zinc-300"}\`}>{task.action}</p>
                                  </div>
                               </div>
                            </button>
                         );
                      })}
                   </div>
                </div>

                {/* Next/Prev Week Controls */}
                <div className="mt-8 flex items-center justify-between pt-4 border-t border-white/5">
                   <button
                     disabled={activeWeek === 0}
                     onClick={() => setActiveWeek(prev => prev - 1)}
                     className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                   >
                      <ChevronLeft className="w-4 h-4"/> Prev Phase
                   </button>
                   <button
                     disabled={activeWeek >= selectedChallenge.weeks.length - 1}
                     onClick={() => setActiveWeek(prev => prev + 1)}
                     className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                   >
                      Next Phase <ChevronRight className="w-4 h-4"/>
                   </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
`;

const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('if (view === "list") {'));

if (startIdx !== -1) {
  const keep = lines.slice(0, startIdx);
  fs.writeFileSync(file, keep.join('\n') + '\n' + replacement.trim() + '\n');
  console.log("Success");
} else {
  console.error("Could not find start index");
}
