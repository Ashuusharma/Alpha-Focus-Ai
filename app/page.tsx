"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { 
  ArrowRight, Activity, ShieldCheck, Brain, TrendingUp,
  Lock, Microscope, Camera, CloudRain, CalendarCheck, Zap,
  Repeat, Star, ChevronRight, CheckCircle2, LayoutDashboard, Target,
  UserCheck, Stethoscope, Droplets
} from "lucide-react";
import Container from "@/app/result/_components/Container";
import { motion, useInView } from "framer-motion";

// Custom hook for animated counting numbers
function useCountUp({ end, duration = 2000, start = 0, trigger = true }: { end: number, duration?: number, start?: number, trigger?: boolean }) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (!trigger) return;
    
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = time - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // easeOutQuart
      const easeOutQuart = 1 - Math.pow(1 - percentage, 4);
      setCount(Math.floor(start + (end - start) * easeOutQuart));

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start, trigger]);

  return count;
}

export default function Home() {
  const statsRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: "-100px" });

  // Protocol Section Animation Triggers
  const protocolRef = useRef(null);
  const isProtocolInView = useInView(protocolRef, { once: true, margin: "-100px" });
  
  const protocolMetric1 = useCountUp({ end: 12, duration: 2000, trigger: isProtocolInView });
  const protocolMetric2 = useCountUp({ end: 8, duration: 2000, trigger: isProtocolInView });
  const protocolMetric3 = useCountUp({ end: 15, duration: 2000, trigger: isProtocolInView });

  const heroScore = useCountUp({ end: 84, duration: 2500 });
  const heroConfidence = useCountUp({ end: 92, duration: 2500 });
  const heroRecovery = useCountUp({ end: 78, duration: 2500 });

  const week1Score = useCountUp({ end: 52, start: 30, duration: 2000, trigger: isStatsInView });
  const week4Score = useCountUp({ end: 63, start: 40, duration: 2500, trigger: isStatsInView });
  const week8Score = useCountUp({ end: 78, start: 50, duration: 3000, trigger: isStatsInView });

  return (
    <main className="af-page-shell min-h-screen text-[#ffffff] selection:bg-[#0071e3] selection:text-white">
      
      {/*  1. HERO SECTION (Authority + Transformation) */}
      <section className="nv-section-dark relative pt-16 pb-24 lg:pt-28 lg:pb-36 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ffffff]/6 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
            {/* Left: Headline & CTA */}
            <div className="space-y-8 relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent text-[#2997ff] text-xs font-bold uppercase tracking-wider border border-[#2997ff]"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Clinical-Grade AI Framework</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="apple-hero-title text-white"
              >
                Build the Most <br />
                <span className="text-[#ffffff] inline-block mt-2 relative">
                  Confident Version
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 9.5C65.5 -1.5 220.5 -1.5 297.5 9.5" stroke="#2997ff" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                </span> <br />
                <span className="mt-2 inline-block">of Yourself</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="apple-body text-[#a7a7a7] max-w-lg leading-relaxed"
              >
                Clinical-grade AI designed to analyze, structure, and optimize your skin, scalp, and lifestyle - with measurable weekly improvement.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Link
                  href="/image-analyzer"
                  className="relative overflow-hidden min-h-[52px] px-8 py-3.5 rounded-xl bg-[#0071e3] text-white font-semibold text-base transition-all duration-300 flex items-center justify-center gap-3 group active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Clinical Assessment
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out sm:rounded-xl" />
                </Link>
                <Link
                  href="/ai-demo"
                  className="min-h-[52px] px-8 py-3.5 rounded-xl bg-transparent border border-[#2997ff] text-[#2997ff] font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  View Sample Report
                </Link>
              </motion.div>
            </div>

            {/* Right: Clinical Snapshot Card (Dynamic) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative lg:ml-10"
            >
              <div className="absolute inset-0 bg-[#0071e3]/5 rounded-3xl blur-2xl transform translate-x-4 translate-y-4" />
              
              <div className="relative bg-white rounded-3xl p-8 border border-[#d9d9de] shadow-[0_20px_60px_rgba(31,61,43,0.08)]">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#f5f5f7]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <h3 className="text-sm font-bold text-[#6e6e73] uppercase tracking-wider">Clinical Snapshot</h3>
                    </div>
                    <p className="text-xs text-[#6e6e73] font-medium">Real-Time Tracker</p>
                  </div>
                  <div className="p-3 bg-[#F8F6F0] rounded-xl border border-[#d9d9de]">
                    <Target className="w-6 h-6 text-[#0071e3]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-5 rounded-2xl bg-[#F8F6F0] border border-[#d9d9de] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-sm text-[#6e6e73] font-medium mb-2">Alpha Score</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-4xl font-extrabold text-[#1d1d1f] font-mono tracking-tight">{heroScore}</p>
                      <p className="text-sm font-bold text-[#99c9ff]">/100</p>
                    </div>
                  </div>
                  
                  <div className="p-5 rounded-2xl bg-[#F8F6F0] border border-[#d9d9de]">
                    <p className="text-sm text-[#6e6e73] font-medium mb-2">Confidence</p>
                    <p className="text-4xl font-extrabold text-[#0071e3] font-mono tracking-tight">{heroConfidence}%</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-[#6e6e73]">Recovery Rate</span>
                      <span className="text-[#1d1d1f] font-bold">{heroRecovery}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#d9d9de] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${heroRecovery}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-[#6e6e73] to-[#0071e3] rounded-full" 
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[#6e6e73]/20 bg-[#6e6e73]/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#6e6e73] font-semibold uppercase mb-1">Active Concern</p>
                      <p className="text-sm font-bold text-[#1d1d1f]">Follicle Miniaturization</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#6e6e73] font-semibold uppercase mb-1">Severity</p>
                      <p className="text-sm font-bold text-[#D97757]">Moderate</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-bold text-[#6e6e73] uppercase">30-Day Projection</p>
                      <span className="text-xs font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-1 rounded-md">+14% Growth</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-16 w-full">
                       {[35, 40, 42, 48, 55, 62, 68, 75, 80, 84].map((h, i) => (
                         <div key={i} className="flex-1 flex flex-col justify-end group cursor-crosshair">
                           <motion.div 
                             initial={{ height: 0 }}
                             animate={{ height: `${h}%` }}
                             transition={{ duration: 0.8, delay: 0.5 + (i * 0.05) }}
                             className={`w-full rounded-t-sm transition-colors duration-300 ${i === 9 ? 'bg-[#0071e3]' : 'bg-[#99c9ff] group-hover:bg-[#0071e3]/60'}`} 
                           />
                         </div>
                       ))}
                    </div>
                  </div>
                  
                  <div className="w-full pt-1.5">
                    <button className="w-full py-3 bg-[#1d1d1f] text-white rounded-xl text-sm font-bold hover:bg-[#0071e3] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg ring-offset-2 hover:ring-2 ring-[#0071e3]">
                       <Zap className="w-4 h-4 text-yellow-400 fill-current" />
                       Execute PM Routine (+5 Alpha Sikka)
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/*  2. TRUST & AUTHORITY STRIP */}
      <section className="nv-section-white py-6 overflow-hidden">
        <Container>
          <div className="flex flex-wrap justify-center sm:justify-between items-center gap-6 lg:gap-8 text-[#1d1d1f] text-sm font-semibold tracking-wide">
            <span className="flex items-center gap-2 whitespace-nowrap">
              <CheckCircle2 className="w-4 h-4 text-[#0071e3]" />
              Dermatology-Informed Framework
            </span>
            <span className="flex items-center gap-2 whitespace-nowrap">
              <CheckCircle2 className="w-4 h-4 text-[#0071e3]" />
              Structured Clinical Protocols
            </span>
            <span className="hidden md:flex items-center gap-2 whitespace-nowrap">
              <CheckCircle2 className="w-4 h-4 text-[#0071e3]" />
              AI-Driven Progress Tracking
            </span>
            <span className="flex items-center gap-2 whitespace-nowrap">
              <Lock className="w-4 h-4 text-[#0071e3]" />
              Data Privacy Protected
            </span>
          </div>
        </Container>
      </section>

      {/* Journey Navigator */}
      <section className="py-14 bg-[#F8F6F0] border-b border-[#d9d9de]">
        <Container>
          <div className="rounded-3xl border border-[#d9d9de] bg-white p-6 md:p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#6e6e73]">Execution Map</p>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mt-1">Follow The Transformation Sequence</h2>
              </div>
              <Link href="/dashboard" className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005bbf] transition-colors">
                Open Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <Link href="/image-analyzer" className="rounded-xl border border-[#d9d9de] bg-[#F8F6F3] p-4 hover:border-[#0071e3]/40 transition-colors">
                <p className="text-[11px] uppercase tracking-wider text-[#6e6e73]">Step 1</p>
                <p className="font-semibold text-[#1d1d1f] mt-1">Analyze Face</p>
                <p className="text-xs text-[#6e6e73] mt-1">Capture validated baseline images.</p>
              </Link>
              <Link href="/assessment" className="rounded-xl border border-[#d9d9de] bg-[#F8F6F3] p-4 hover:border-[#0071e3]/40 transition-colors">
                <p className="text-[11px] uppercase tracking-wider text-[#6e6e73]">Step 2</p>
                <p className="font-semibold text-[#1d1d1f] mt-1">Answer Assessment</p>
                <p className="text-xs text-[#6e6e73] mt-1">Map lifestyle and root-cause drivers.</p>
              </Link>
              <Link href="/result" className="rounded-xl border border-[#d9d9de] bg-[#F8F6F3] p-4 hover:border-[#0071e3]/40 transition-colors">
                <p className="text-[11px] uppercase tracking-wider text-[#6e6e73]">Step 3</p>
                <p className="font-semibold text-[#1d1d1f] mt-1">Execute Protocol</p>
                <p className="text-xs text-[#6e6e73] mt-1">Follow clinical routine and timing.</p>
              </Link>
              <Link href="/shop" className="rounded-xl border border-[#d9d9de] bg-[#F8F6F3] p-4 hover:border-[#0071e3]/40 transition-colors">
                <p className="text-[11px] uppercase tracking-wider text-[#6e6e73]">Step 4</p>
                <p className="font-semibold text-[#1d1d1f] mt-1">Optimize Stack</p>
                <p className="text-xs text-[#6e6e73] mt-1">Choose products aligned to your report.</p>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/*  3. WHAT MAKES ALPHA FOCUS DIFFERENT (CORE STRENGTH) */}
      <section className="py-24 lg:py-32 bg-white relative">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1d1d1f] tracking-tight">
              This Is Not Just Grooming. <br className="hidden sm:block" />
              <span className="text-[#0071e3]">This Is Structured Progress.</span>
            </h2>
            <p className="text-[#6e6e73] text-lg lg:text-xl">
              Generic advice fails because it thrives on chaos. We replace trial-and-error with a measurable clinical framework engineered for male optimization.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             {[
               { 
                 title: "Clinical Intelligence", 
                 desc: "Our diagnostic engine analyzes 14+ discrete visual markers, calculating exact severity scores to establish your unvarnished health baseline.", 
                 icon: Brain,
                 tag: "Analysis"
               },
               { 
                 title: "Routine Engineering", 
                 desc: "Psychologically-backed habit loops. We don't just sell protocols; we engineer the behavioral streaks required to actually execute them consistently.", 
                 icon: LayoutDashboard,
                 tag: "Behavior"
               },
               { 
                 title: "Measurable Transformation", 
                 desc: "Feelings are subjective; data is not. Track specific percentage improvements weekly. Know exactly what's working and automatically adapt what isn't.", 
                 icon: TrendingUp,
                 tag: "Results"
               },
             ].map((pillar, i) => (
                <div key={i} className="group flex flex-col items-start bg-[#F8F6F0] p-8 rounded-3xl border border-[#d9d9de] hover:shadow-[0_12px_40px_rgba(31,61,43,0.06)] hover:border-[#99c9ff] transition-all duration-300">
                  <div className="w-14 h-14 bg-white border border-[#d9d9de] rounded-2xl flex items-center justify-center text-[#0071e3] mb-6 shadow-sm group-hover:scale-110 group-hover:bg-[#0071e3] group-hover:text-white transition-all">
                    <pillar.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#6e6e73] mb-3">{pillar.tag}</span>
                  <h3 className="text-xl font-bold text-[#1d1d1f] mb-4">{pillar.title}</h3>
                  <p className="text-[#5C665F] leading-relaxed flex-1">{pillar.desc}</p>
                </div>
             ))}
          </div>
        </Container>
      </section>

      {/*  4. TRANSFORMATION ENGINE SECTION */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-[#f5f5f7] to-[#ededf2] relative border-t border-[#d9d9de]">
        <Container>
          <div className="max-w-3xl mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1d1d1f] mb-6">Your 90-Day <br className="hidden sm:block"/> Confidence Protocol</h2>
            <p className="text-[#6e6e73] text-lg lg:text-xl">Transformation is a science. We divide your journey into three distinct clinical phases, tracking exact metric improvements along the way.</p>
          </div>

          <motion.div 
            ref={protocolRef}
            initial="hidden"
            animate={isProtocolInView ? "visible" : "hidden"}
            variants={{
              visible: { opacity: 1, transition: { staggerChildren: 0.3 } },
              hidden: { opacity: 0 }
            }}
            className="grid lg:grid-cols-3 gap-8 relative z-10"
          >
            {/* Connection Line Desktop */}
            <div className="hidden lg:block absolute top-[15%] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-[#d9d9de] via-[#99c9ff] to-[#d9d9de] -z-10" />

            {[
              { 
                phase: "Phase 1", 
                name: "Stabilize", 
                timeline: "Days 1-30",
                desc: "Arrest negative progression. Focus on reducing inflammation, halting hair shed, and balancing the acid mantle.",
                value: protocolMetric1,
                label: "Hydration Base",
                color: "from-[#6e6e73]/10 to-transparent",
                borderColor: "border-[#6e6e73]/20",
                badgeColor: "bg-[#6e6e73]/10 text-[#6e6e73]",
                icon: CloudRain
              },
              { 
                phase: "Phase 2", 
                name: "Correct", 
                timeline: "Days 31-60",
                desc: "Targeted intervention. Active clinical ingredients compound daily to reverse root causes of damage and aging.",
                value: protocolMetric2,
                label: "Follicle Density",
                color: "from-[#0071e3]/10 to-transparent",
                borderColor: "border-[#0071e3]/20",
                badgeColor: "bg-[#0071e3]/10 text-[#0071e3]",
                icon: Microscope
              },
              { 
                phase: "Phase 3", 
                name: "Optimize", 
                timeline: "Days 61-90+",
                desc: "Peak aesthetic state. Fortify the newly built biological foundations for permanent, low-friction maintenance.",
                value: protocolMetric3,
                label: "Alpha Score",
                color: "from-[#1d1d1f]/10 to-transparent",
                borderColor: "border-[#1d1d1f]/20",
                badgeColor: "bg-[#1d1d1f]/10 text-[#1d1d1f]",
                icon: Star
              }
            ].map((step, i) => (
              <motion.div 
                key={i} 
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.3, duration: 0.8 } }
                }}
                whileHover={{ y: -12, transition: { duration: 0.3 } }}
                className={`relative bg-white p-8 rounded-[2rem] border border-[#d9d9de] shadow-[0_10px_40px_rgba(31,61,43,0.05)] hover:shadow-[0_25px_60px_rgba(31,61,43,0.12)] hover:border-[#99c9ff] transition-all duration-300 group flex flex-col`}
              >
                {/* Decorative BG Gradient */}
                <div className={`absolute top-0 left-0 w-full h-[140px] bg-gradient-to-b ${step.color} rounded-t-[2rem] opacity-60`} />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-8">
                    <span className={`px-4 py-1.5 ${step.badgeColor} text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm`}>
                      {step.phase}
                    </span>
                    <span className="text-sm font-bold text-[#6e6e73] bg-[#F8F6F0] px-3 py-1 rounded-full border border-[#d9d9de]">{step.timeline}</span>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                       <div className="p-2 rounded-lg bg-white shadow-sm border border-[#d9d9de] text-[#0071e3]">
                          <step.icon className="w-5 h-5" />
                       </div>
                       <h3 className="text-3xl font-bold text-[#1d1d1f]">{step.name}</h3>
                    </div>
                    <div className="h-1 w-12 bg-[#0071e3] rounded-full opacity-20 group-hover:w-full group-hover:opacity-100 transition-all duration-500" />
                  </div>

                  <p className="text-[#5C665F] text-lg mb-8 leading-relaxed flex-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    {step.desc}
                  </p>
                  
                  <div className={`mt-auto p-5 rounded-2xl border ${step.borderColor} bg-[#F8F6F0]/50 backdrop-blur-sm flex items-center justify-between group-hover:bg-white group-hover:shadow-md transition-all duration-300`}>
                    <span className="text-sm font-bold text-[#1d1d1f] tracking-tight">Expected Avg.</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[#0071e3] font-mono tracking-tighter">+{step.value}%</span>
                      <span className="text-xs font-bold text-[#0071e3] uppercase">{step.label}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/*  5. LIVE USER JOURNEY EXAMPLE */}
      <section className="py-24 lg:py-32 bg-white" ref={statsRef}>
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-[#F8F6F0] rounded-3xl p-6 sm:p-10 border border-[#d9d9de] shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
                {/* Abstract grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(31,61,43,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(31,61,43,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-[#d9d9de]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#0071e3] rounded-full flex items-center justify-center text-white font-bold font-mono">
                        A.L.
                      </div>
                      <div>
                        <p className="font-bold text-[#1d1d1f]">Anand L.</p>
                        <p className="text-xs text-[#6e6e73]">Protocol: Deep Repair</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-1 rounded">
                        <TrendingUp className="w-3 h-3" />
                        Verified Data
                      </span>
                    </div>
                  </div>

                  {/* Dashboard Stats */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#d9d9de] shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#ededf2] flex items-center justify-center text-[#6e6e73] font-bold text-xs">W1</div>
                        <span className="font-bold text-[#6e6e73]">Baseline Scan</span>
                      </div>
                      <span className="text-xl font-mono font-bold text-[#1d1d1f]">{week1Score}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#d9d9de] shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#ededf2] flex items-center justify-center text-[#6e6e73] font-bold text-xs">W4</div>
                        <span className="font-bold text-[#6e6e73]">Mid-Protocol</span>
                      </div>
                      <span className="text-xl font-mono font-bold text-[#1d1d1f]">{week4Score}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0071e3] rounded-xl border border-[#1A4735] shadow-lg transform scale-[1.02] ml-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xs">W8</div>
                        <span className="font-bold text-white">Full Stabilization</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#99c9ff]">+50%</span>
                        <span className="text-2xl font-mono font-bold text-white">{week8Score}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-[#1d1d1f]">The Math of Self-Improvement</h2>
              <p className="text-lg text-[#6e6e73] leading-relaxed">
                We track progression ruthlessly. When you adhere to your assigned Alpha protocol, biology follows suit.
              </p>
              <p className="text-lg text-[#6e6e73] leading-relaxed">
                This isn't a miraculous overnight cure. This is compound interest applied to your physical appearance and daily habits, resulting in an undeniable upward trend within 8 weeks.
              </p>
              <div className="pt-4">
                <Link href="/image-analyzer" className="inline-flex font-bold text-[#0071e3] hover:text-[#1d1d1f] items-center gap-2 group transition-colors">
                  Establish Your Baseline Today
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/*  6. BEHAVIORAL LOOP SECTION (Engagement) */}
      <section className="py-24 lg:py-32 bg-[linear-gradient(180deg,#f5eee2_0%,#ebe1d2_100%)] text-[#1d1d1f] relative overflow-hidden border-y border-[#e0d5c4]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(169,203,183,0.28),transparent_70%)] opacity-80" />
        
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-20 relative z-10">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-[#1d1d1f]">Built to Keep You Accountable</h2>
            <p className="text-[#6e6e73] text-lg lg:text-xl">
              Knowledge without execution is worthless. We engineered an entire behavioral ecosystem to guarantee you stick to the plan.
            </p>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-4">
               {[
                 { name: "Assessment", icon: Camera },
                 { name: "AI Report", icon: Brain },
                 { name: "Routine", icon: CheckCircle2 },
                 { name: "Progress", icon: TrendingUp },
                 { name: "Rewards", icon: Star },
                 { name: "Reassessment", icon: Repeat }
               ].map((step, i, arr) => (
                 <div key={i} className="flex flex-col items-center text-center relative group">
                   <div className="w-16 h-16 rounded-2xl bg-[linear-gradient(180deg,#fffdf9_0%,#eee5d8_100%)] border border-[#d7ccbb] flex items-center justify-center mb-4 text-[#0071e3] shadow-[0_18px_40px_rgba(120,97,67,0.12)] group-hover:scale-110 group-hover:bg-[#0071e3] group-hover:text-white transition-all duration-300">
                     <step.icon className="w-7 h-7" />
                   </div>
                   <h4 className="font-bold text-sm uppercase tracking-wide text-[#1d1d1f]">{step.name}</h4>
                   {i !== arr.length - 1 && (
                     <div className="hidden lg:block absolute top-[2rem] right-[-30%] w-[60%] h-[2px] bg-gradient-to-r from-[#c4b59d] to-transparent" />
                   )}
                 </div>
               ))}
             </div>
             
             <div className="mt-20 bg-[rgba(255,250,243,0.86)] border border-[#d8ccba] rounded-3xl p-8 lg:p-10 backdrop-blur-sm text-center max-w-3xl mx-auto shadow-[0_22px_60px_rgba(120,97,67,0.12)]">
               <p className="text-[#6e6e73] mb-3 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                 <Star className="w-4 h-4 text-yellow-400" />
                 The Alpha Sikka Economy
               </p>
               <p className="text-lg lg:text-xl leading-relaxed text-[#5F5A51]">
                 Every time you log a routine or improve a metric, you earn <strong className="text-[#1d1d1f]">Alpha Sikka</strong>. Use these proprietary credits to unlock premium clinical products and advanced analysis. Good habits literally fund your transformation.
               </p>
             </div>
          </div>
        </Container>
      </section>

      {/*  7. SCIENCE & DATA SECTION */}
      <section className="py-24 lg:py-32 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-5xl font-bold text-[#1d1d1f] mb-6">Powered by <br className="hidden lg:block"/> Multi-Signal Analysis</h2>
              <p className="text-lg text-[#6e6e73] mb-12 leading-relaxed">
                Most advice relies on casually looking in the mirror. Alpha Focus processes multiple distinct data vectors simultaneously to output precise clinical truth.
              </p>
              
              <div className="space-y-8">
                {[
                  { title: "Assessment Inputs", desc: "Cross-referencing your lifestyle inputs (sleep, water, stress) against visual outcomes.", icon: Activity },
                  { title: "Photo Density Mapping", desc: "Pixel-by-pixel photographic analysis diagnosing acne, wrinkles, and pigment density.", icon: Camera },
                  { title: "Environmental Stress Analysis", desc: "Live API integration tracking local UV index, humidity, and pollution for dynamic protocol adjustment.", icon: CloudRain },
                  { title: "Routine Adherence Tracking", desc: "Algometric scoring of your compliance rates to identify behavioral drop-off zones.", icon: CalendarCheck }
                ].map((item, i) => (
                  <div key={i} className="flex gap-5 group">
                    <div className="flex-shrink-0 w-14 h-14 bg-[#F8F6F0] rounded-2xl flex items-center justify-center text-[#0071e3] shadow-sm border border-[#d9d9de] group-hover:bg-[#0071e3] group-hover:text-white group-hover:scale-105 transition-all">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1d1d1f] text-xl mb-2">{item.title}</h4>
                      <p className="text-[#5C665F] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:ml-8">
              <div className="aspect-square bg-[#F8F6F0] rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] -z-10 blur-[120px] opacity-80" />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6 pt-12">
                  <div className="bg-white p-8 rounded-3xl border border-[#d9d9de] shadow-[0_20px_50px_rgba(31,61,43,0.06)] hover:-translate-y-1 transition-transform">
                    <Microscope className="w-10 h-10 text-[#0071e3] mb-6" />
                    <p className="font-extrabold text-4xl text-[#1d1d1f] mb-2 font-mono tracking-tight">12M+</p>
                    <p className="text-xs text-[#6e6e73] font-bold uppercase tracking-widest leading-relaxed">Data Points<br/>Trained</p>
                  </div>
                  <div className="bg-[linear-gradient(180deg,#fffdf9_0%,#f0e7da_100%)] p-8 rounded-3xl border border-[#e2d8c9] text-[#1d1d1f] shadow-[0_20px_50px_rgba(120,97,67,0.1)] hover:-translate-y-1 transition-transform">
                    <UserCheck className="w-10 h-10 text-[#0071e3] mb-6" />
                    <p className="font-extrabold text-4xl mb-2 font-mono tracking-tight">94%</p>
                    <p className="text-xs text-[#6e6e73] font-bold uppercase tracking-widest leading-relaxed">Protocol<br/>Completion</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-[linear-gradient(135deg,#dfeadf_0%,#c9dacd_100%)] p-8 rounded-3xl border border-[#b8c9ba] text-[#1d1d1f] shadow-[0_20px_50px_rgba(47,111,87,0.14)] hover:-translate-y-1 transition-transform">
                    <Stethoscope className="w-10 h-10 text-[#0071e3] mb-6" />
                    <p className="font-extrabold text-4xl mb-2 font-mono tracking-tight">24/7</p>
                    <p className="text-xs text-[#345847] font-bold uppercase tracking-widest leading-relaxed">Live Protocol<br/>Adaptation</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-[#d9d9de] shadow-[0_20px_50px_rgba(31,61,43,0.06)] hover:-translate-y-1 transition-transform">
                    <Droplets className="w-10 h-10 text-[#0071e3] mb-6" />
                    <p className="font-extrabold text-4xl text-[#1d1d1f] mb-2 font-mono tracking-tight">3</p>
                    <p className="text-xs text-[#6e6e73] font-bold uppercase tracking-widest leading-relaxed">Clinical Action<br/>Tiers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/*  8. SOCIAL PROOF */}
      <section className="py-16 bg-[#f5f5f7] border-t border-[#d9d9de]">
        <Container>
          <div className="text-center">
            <p className="text-sm font-bold text-[#6e6e73] uppercase tracking-widest flex items-center justify-center gap-4">
              <span className="h-[1px] w-8 bg-[#6e6e73]/30"></span>
              Men across India improving structured confidence
              <span className="h-[1px] w-8 bg-[#6e6e73]/30"></span>
            </p>
          </div>
        </Container>
      </section>

      {/*  9. FINAL CTA BLOCK */}
      <section className="py-32 lg:py-40 bg-[linear-gradient(180deg,#f4ecdf_0%,#e9dece_100%)] text-[#1d1d1f] overflow-hidden relative border-t border-[#e0d5c4]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(169,203,183,0.3),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,97,67,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(120,97,67,0.045)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
        
        <Container>
           <div className="max-w-4xl mx-auto text-center relative z-10">
             <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 tracking-tight leading-tight">
               Start Your Structured <br/>Transformation Today
             </h2>
             <p className="text-[#6e6e73] text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
               Stop guessing. Get exact clinical data on your physical health and a scientifically engineered routine to optimize it.
             </p>
             <Link
               href="/image-analyzer"
               className="relative overflow-hidden inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-[#0071e3] text-white font-bold text-xl hover:bg-[#005bbf] hover:scale-105 active:scale-[0.98] transition-all duration-300 shadow-[0_16px_40px_rgba(47,111,87,0.24)] hover:shadow-[0_20px_52px_rgba(47,111,87,0.32)] group"
             >
               <span className="relative z-10 flex items-center gap-3">
                 Begin Clinical Assessment
                 <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
               </span>
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
             </Link>
             <p className="mt-10 text-sm text-[#6e6e73] opacity-90 flex items-center justify-center gap-2 font-medium tracking-wide">
               <Lock className="w-4 h-4" />
               100% Private & Secure. No credit card required.
             </p>
           </div>
        </Container>
      </section>
    </main>
  );
}


