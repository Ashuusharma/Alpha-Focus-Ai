import fs from 'fs';
const file = 'app/result/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md px-6 py-5 text-sm text-zinc-400">Generating deterministic clinical report...</div>
      </div>
    );
  }

  if (error || !clinical) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-3xl bg-[#0a1a1f] border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)] p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-white">Clinical Report Unavailable</h1>
          <p className="text-sm text-zinc-400">{error || "No report found."}</p>
          <button
            onClick={() => router.push("/image-analyzer")}
            className="inline-flex items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-6 py-3 text-sm font-semibold transition-colors"
          >
            Restart Flow
          </button>
        </div>
      </div>
    );
  }

  if (clinical.report_payload?.insufficient_data || clinical.assessment_completeness < 60) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-2xl w-full rounded-3xl bg-[#0a1a1f] border border-yellow-500/20 shadow-[0_0_40px_rgba(234,179,8,0.1)] p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Insufficient structured data</h1>
          <p className="text-sm text-zinc-400">Complete a valid photo scan and at least 60% category assessment to unlock report generation.</p>
          <button
            onClick={() => router.push(\`/assessment?category=\${clinical.category}\`)}
            className="rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 px-6 py-3 text-sm font-semibold transition-colors"
          >
            Continue Assessment
          </button>
        </div>
      </div>
    );
  }

  const overview = clinical.report_payload?.clinical_overview;
  const protocol = clinical.report_payload?.protocol_30_day;
  const schedule = clinical.report_payload?.routine_schedule;
  const productLogic = clinical.report_payload?.product_logic;
  const performance = clinical.report_payload?.performance_metrics;
  const isPlusOrPro = plan === "plus" || plan === "pro";
  const isPro = plan === "pro";
  const shouldAdjustProtocol = Boolean(
    isPlusOrPro
    && progress
    && progress.streak_days >= 3
    && progress.current_phase === "Phase 1: Stabilization"
    && progress.recovery_rate > 5
  );

  return (
    <div className="space-y-8 pb-12 w-full animate-in fade-in duration-700 max-w-6xl mx-auto">

      {/* HEADER HERO */}
      <div className="relative bg-gradient-to-br from-[#0a1a1f] to-[#0d2a33] border border-green-500/20 rounded-3xl overflow-hidden shadow-2xl p-8 lg:p-12 text-center lg:text-left flex flex-col lg:flex-row items-center gap-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-green-500/30 bg-green-500/10 text-xs font-bold uppercase tracking-wider text-green-400">
             <Activity className="w-3.5 h-3.5" />
             Clinical Report Generated
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white font-playfair leading-tight">
            {overview?.primary_condition || "Baseline Assessment"}
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            {overview?.clinical_description || clinical.report_payload?.what_this_means}
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 w-full lg:w-auto">
          <div className="bg-black/40 border border-white/5 backdrop-blur-md rounded-2xl p-5 flex flex-col items-center justify-center">
             <span className="text-3xl font-bold text-white mb-1">{clinical.severity_score}/10</span>
             <span className="text-[10px] uppercase tracking-wider text-zinc-500">Severity Score</span>
          </div>
          <div className="bg-black/40 border border-white/5 backdrop-blur-md rounded-2xl p-5 flex flex-col items-center justify-center">
             <span className="text-3xl font-bold text-green-400 mb-1">{overview?.confidence_pct || 90}%</span>
             <span className="text-[10px] uppercase tracking-wider text-zinc-500">Algorithm Confidence</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COL: SCANS & METRICS */}
        <div className="space-y-6 lg:col-span-1">
          {/* Risk Level */}
          <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl">
             <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Prognosis Matrix</h3>
             <div className="space-y-6">
               <div>
                 <div className="flex justify-between items-end mb-2">
                   <span className="text-sm text-white">Recovery Probability</span>
                   <span className="text-xl font-bold text-blue-400">{clinical.recovery_probability}%</span>
                 </div>
                 <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-400 rounded-full" style={{ width: \`\${clinical.recovery_probability}%\` }} />
                 </div>
               </div>
               <div>
                 <div className="flex justify-between items-end mb-2">
                   <span className="text-sm text-white">Risk if Ignored</span>
                   <span className="text-xs font-bold text-orange-400 uppercase px-2 py-1 rounded bg-orange-400/10 border border-orange-400/20">{overview?.risk_level || clinical.risk_level || "Moderate"}</span>
                 </div>
                 <p className="text-xs text-zinc-500 mt-2">{clinical.report_payload?.risk_if_ignored}</p>
               </div>
               {performance && (
                 <div className="pt-4 border-t border-white/5">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Projected Turnaround</span>
                      <span className="text-white font-bold">{performance.projected_recovery_days} days</span>
                   </div>
                 </div>
               )}
             </div>
          </div>

          {/* Root Cause Map */}
          <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl">
             <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                Root Cause Map
                <Activity className="w-4 h-4" />
             </h3>
             <div className="space-y-5">
               {clinical.root_cause_map?.map((rc, i) => (
                  <div key={i} className="group cursor-default">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm text-white font-medium capitalize">{rc.domain.replace(/_/g, " ")}</span>
                      <span className="text-xs text-zinc-500">{rc.impact_pct}% Impact</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-1000 ease-out group-hover:opacity-80" style={{ width: \`\${rc.impact_pct}%\` }} />
                    </div>
                  </div>
               ))}
             </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-col gap-3">
             <button onClick={() => router.push("/dashboard")} className="w-full bg-green-500 text-black py-4 rounded-xl font-bold shadow-[0_0_15px_rgba(74,222,128,0.2)] hover:shadow-[0_0_25px_rgba(74,222,128,0.4)] transition-all">
               Start Protocol Schedule
             </button>
             <button onClick={() => router.push("/assessment")} className="w-full bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20 py-4 rounded-xl font-semibold transition-all">
               Recalibrate Assessment
             </button>
          </div>
        </div>

        {/* RIGHT COL: PROTOCOLS & PRODUCTS */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* 30 Day Protocol Timeline */}
           <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-green-400" />
                 30-Day Phased Protocol
               </h3>
             </div>
             
             <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                
                {/* Phase 1 */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-[#0a1a1f] bg-green-500 absolute left-0 md:left-1/2 -translate-x-1/2 -translate-y-4 md:-translate-y-0 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] bg-black/20 hover:bg-black/30 border border-green-500/20 p-5 rounded-2xl transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 mb-1 block">Phase 1: Stabilization</span>
                    <p className="text-sm text-zinc-300">{protocol?.phase_1 || "Reduce immediate stressors and establish baseline hygiene routines."}</p>
                  </div>
                </div>
                
                {/* Phase 2 */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-[#0a1a1f] bg-zinc-700 absolute left-0 md:left-1/2 -translate-x-1/2 -translate-y-4 md:-translate-y-0"></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] bg-black/20 hover:bg-black/30 border border-white/5 p-5 rounded-2xl transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Phase 2: Transition</span>
                    <p className="text-sm text-zinc-400">{protocol?.phase_2 || "Introduce targeted actives and increment routine complexity."}</p>
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-[#0a1a1f] bg-zinc-700 absolute left-0 md:left-1/2 -translate-x-1/2 -translate-y-4 md:-translate-y-0"></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] bg-black/20 hover:bg-black/30 border border-white/5 p-5 rounded-2xl transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Phase 3: Optimization</span>
                    <p className="text-sm text-zinc-400">{protocol?.phase_3 || "Maintain peak outcomes through balanced maintenance dosing."}</p>
                  </div>
                </div>

             </div>
           </div>

           {/* Routine Schedules */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/5 rounded-3xl p-6">
                 <div className="flex items-center gap-3 mb-4 text-orange-200">
                   <Sun className="w-5 h-5" /> <h4 className="font-bold">AM Protocol</h4>
                 </div>
                 <p className="text-sm text-zinc-400">{schedule?.morning || "Morning protection and mitigation protocol."}</p>
              </div>
              <div className="bg-gradient-to-b from-black/20 to-transparent border border-white/5 rounded-3xl p-6">
                 <div className="flex items-center gap-3 mb-4 text-indigo-300">
                   <Moon className="w-5 h-5" /> <h4 className="font-bold">PM Protocol</h4>
                 </div>
                 <p className="text-sm text-zinc-400">{schedule?.night || "Nighttime restorative and recovery protocol."}</p>
              </div>
           </div>

           {/* Clinical Product Logic (If any) */}
           {productLogic && (
             <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-6 lg:p-8">
               <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                 <ShoppingBag className="w-5 h-5 text-blue-400" /> Clinical Arsenal Logic
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                   <span className="text-[10px] uppercase text-zinc-500 block mb-1">Target Symptom</span>
                   <span className="text-sm text-white font-medium">{productLogic.target_symptom}</span>
                 </div>
                 <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                   <span className="text-[10px] uppercase text-zinc-500 block mb-1">Why Recommended</span>
                   <span className="text-sm text-white font-medium">{productLogic.why_recommended}</span>
                 </div>
                 <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                   <span className="text-[10px] uppercase text-zinc-500 block mb-1">Expectation</span>
                   <span className="text-sm text-green-400 font-medium">{productLogic.timeline_expectation}</span>
                 </div>
               </div>
               
               <div className="mt-6 flex justify-end">
                 <button onClick={() => router.push("/shop")} className="text-sm font-bold text-white hover:text-green-400 transition-colors flex items-center gap-2">
                   View Curated Products <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
}
`;

const startIdx = content.indexOf('  if (loading) {');
if (startIdx !== -1) {
  content = content.substring(0, startIdx) + replacement.trim();
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.error("Could not find start index");
}
