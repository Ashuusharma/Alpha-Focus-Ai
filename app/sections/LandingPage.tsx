"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText, ShieldCheck, Sparkles, Stethoscope, Upload } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type LandingPageProps = {
  onStart: () => void;
  onLogin: () => void;
  onNavigate: (path: string) => void;
};

export default function LandingPage({ onStart, onLogin, onNavigate }: LandingPageProps) {
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [engaged, setEngaged] = useState(false);
  const [showInstallCta, setShowInstallCta] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const markEngaged = () => setEngaged(true);
    window.addEventListener("pointerdown", markEngaged, { once: true });
    window.addEventListener("keydown", markEngaged, { once: true });
    window.addEventListener("scroll", markEngaged, { once: true });

    return () => {
      window.removeEventListener("pointerdown", markEngaged);
      window.removeEventListener("keydown", markEngaged);
      window.removeEventListener("scroll", markEngaged);
    };
  }, []);

  useEffect(() => {
    if (!deferredInstallPrompt || !engaged) {
      setShowInstallCta(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowInstallCta(true);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [deferredInstallPrompt, engaged]);

  useEffect(() => {
    const handleInstalled = () => {
      setDeferredInstallPrompt(null);
      setShowInstallCta(false);
    };

    window.addEventListener("appinstalled", handleInstalled);
    return () => window.removeEventListener("appinstalled", handleInstalled);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try {
      await deferredInstallPrompt.userChoice;
    } finally {
      setDeferredInstallPrompt(null);
      setShowInstallCta(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EB] text-[#1E4D3A]">
      <main className="mx-auto w-full max-w-7xl space-y-14 px-6 py-16 md:space-y-16 md:py-20">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#99c9ff] bg-[#E8E3DA] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#0071e3]">
              <Sparkles className="h-3.5 w-3.5" />
              Clinical Wellness Intelligence
            </p>
            <h1 className="text-5xl leading-[1.08] text-[#1E4D3A] md:text-6xl">Build the Most Confident Version of Yourself</h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#0071e3] md:text-lg">
              Evidence-driven dermatology intelligence designed for modern men committed to long-term skin and scalp health.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onStart} className="rounded-xl bg-medical-gradient px-6 py-3 text-sm font-semibold text-[#F4F1EB] shadow-[0_8px_20px_rgba(47,111,87,0.2)]">
                Start Your Free Skin Scan
              </button>
              <button onClick={() => onNavigate("/assessment")} className="rounded-xl border border-[#D9D2C7] bg-white px-6 py-3 text-sm font-semibold text-[#0071e3] shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
                Answer Questions
              </button>
              <button onClick={onLogin} className="rounded-xl border border-[#D9D2C7] bg-[#F4F1EB] px-6 py-3 text-sm font-semibold text-[#0071e3]">
                Sign In
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-[#F7F4EE] p-6 shadow-[0_8px_22px_rgba(0,0,0,0.05)]">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#6E9F87]">Clinical Snapshot</p>
                <p className="mt-2 text-4xl font-semibold text-[#1E4D3A]">Alpha Score 78</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs text-[#6E9F87]">Clinical Confidence</p>
                  <p className="mt-1 text-lg font-semibold">82%</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs text-[#6E9F87]">Primary Concern</p>
                  <p className="mt-1 text-lg font-semibold">Scalp Dryness</p>
                </div>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs text-[#6E9F87]">Trend</p>
                <svg viewBox="0 0 320 90" className="mt-2 h-20 w-full" role="img" aria-label="weekly trend">
                  <polyline fill="none" stroke="#0071e3" strokeWidth="2" points="6,72 52,68 98,63 144,58 190,51 236,45 282,38 314,32" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-[#d9d9de] bg-white p-4 md:grid-cols-3">
          {[
            "Nature-Informed Dermatology",
            "Clinical-Grade AI Guidance",
            "Structured, Measurable Progress",
          ].map((item) => (
            <div key={item} className="inline-flex items-center gap-2 rounded-xl bg-[#F7F4EE] px-3 py-2 text-sm text-[#0071e3]">
              <CheckCircle2 className="h-4 w-4" />
              {item}
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-[#d9d9de] bg-white p-6 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
          <h2 className="text-2xl">How It Works</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-[#F7F4EE] p-4">
              <Upload className="h-5 w-5 text-[#0071e3]" />
              <p className="mt-2 font-semibold">Scan</p>
              <p className="text-sm text-[#0071e3]">Upload a clear face or scalp image for baseline assessment.</p>
            </div>
            <div className="rounded-xl bg-[#F7F4EE] p-4">
              <Stethoscope className="h-5 w-5 text-[#0071e3]" />
              <p className="mt-2 font-semibold">Clinical Review</p>
              <p className="text-sm text-[#0071e3]">AI evaluates concern severity, confidence, and contributing factors.</p>
            </div>
            <div className="rounded-xl bg-[#F7F4EE] p-4">
              <FileText className="h-5 w-5 text-[#0071e3]" />
              <p className="mt-2 font-semibold">Personalized Protocol</p>
              <p className="text-sm text-[#0071e3]">Receive a structured plan with routine, ingredients, and follow-up.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Alpha Score", "78"],
            ["Clinical Confidence", "82%"],
            ["Primary Concern", "Scalp Dryness"],
            ["Recovery", "68%"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#d9d9de] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.03)]">
              <div className="mb-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#6E9F87]" /><p className="text-xs text-[#6E9F87]">{label}</p></div>
              <p className="text-lg font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-[#d9d9de] bg-white p-6 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
          <h2 className="text-2xl">Your Structured Clinical Report</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#d9d9de]">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F7F4EE] text-[#6E9F87]">
                <tr>
                  <th className="px-4 py-3 text-left">Report ID</th>
                  <th className="px-4 py-3 text-left">Primary Diagnosis</th>
                  <th className="px-4 py-3 text-left">Severity</th>
                  <th className="px-4 py-3 text-left">Confidence</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#d9d9de]">
                  <td className="px-4 py-3">AF-10384</td>
                  <td className="px-4 py-3">Scalp Barrier Stress</td>
                  <td className="px-4 py-3"><span className="rounded-full border border-[#E0CE97] bg-[#F4EED7] px-2.5 py-1 text-xs font-semibold text-[#6e6e73]">Moderate</span></td>
                  <td className="px-4 py-3">82%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button onClick={() => onNavigate("/assessment")} className="mt-4 rounded-xl border border-[#D9D2C7] bg-[#F4F1EB] px-5 py-2.5 text-sm font-semibold text-[#0071e3]">Answer Questions</button>
        </section>

        <section className="rounded-2xl border border-[#d9d9de] bg-white p-6 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
          <h2 className="text-2xl">Transformation Journey</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-[#F7F4EE] p-4"><p className="font-semibold">Week 1-2</p><p className="text-sm text-[#0071e3]">Stabilization</p></div>
            <div className="rounded-xl bg-[#F7F4EE] p-4"><p className="font-semibold">Week 3-6</p><p className="text-sm text-[#0071e3]">Visible Improvement</p></div>
            <div className="rounded-xl bg-[#F7F4EE] p-4"><p className="font-semibold">Maintenance</p><p className="text-sm text-[#0071e3]">Strengthening</p></div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d9d9de] bg-white p-6 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
          <h2 className="text-2xl">Adherence & Outcomes</h2>
          <p className="mt-2 text-[#0071e3]">Adherence improves measurable outcomes. Consistency across routine, hydration, and sleep drives stronger recovery trends.</p>
        </section>

        <section className="rounded-2xl border border-[#d9d9de] bg-white p-6 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
          <h2 className="text-2xl">Privacy & Safety</h2>
          <div className="mt-4 grid gap-2 text-sm text-[#0071e3]">
            <p className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Your scan data is encrypted and never sold.</p>
            <p className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Clinical guidance is evidence-informed and structured.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d9d9de] bg-white p-8 text-center shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
          <h2 className="text-[2rem]">Begin Your Clinical Assessment</h2>
          <p className="mt-2 text-[#0071e3]">Start with your first scan and receive a structured report in minutes.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button onClick={onStart} className="rounded-xl bg-medical-gradient px-7 py-3 text-sm font-semibold text-[#F4F1EB]">Start Your Free Skin Scan</button>
            {showInstallCta ? (
              <button onClick={handleInstallClick} className="rounded-xl bg-premium-button-gradient px-7 py-3 text-sm font-semibold text-[#1E4D3A]">Install App</button>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}


