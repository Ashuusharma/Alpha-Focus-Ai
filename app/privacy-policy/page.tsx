"use client";

import { ArrowLeft, LockKeyhole, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="af-page-shell min-h-screen text-[#1d1d1f] px-4 py-10">
      <main className="af-page-frame mx-auto max-w-4xl space-y-6">
        <section className="af-page-hero p-6 md:p-8">
          <div className="relative z-10 space-y-5">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[#6e6e73] hover:text-[#1d1d1f]">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="af-page-kicker">
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacy Overview
            </span>
            <div className="max-w-3xl">
              <h1 className="text-clinical-heading text-4xl font-extrabold tracking-tight">How Alpha Focus collects, uses, stores, and deletes user data.</h1>
              <p className="mt-3 text-sm leading-7 text-[#6e6e73]">This page now matches the premium shell, but it stays plainspoken: what we collect, why we collect it, how we secure it, and how users can remove it.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Profile + logs</p>
                <p className="mt-2 text-base font-semibold text-[#1d1d1f]">Used for personalization</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Security</p>
                <p className="mt-2 text-base font-semibold text-[#1d1d1f]">Authenticated APIs and env-based secrets</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Deletion</p>
                <p className="mt-2 text-base font-semibold text-[#1d1d1f]">Controlled from Data Settings</p>
              </div>
            </div>
          </div>
        </section>

        <section className="af-card-secondary p-6">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#0071e3]" />
            <h2 className="text-2xl font-semibold">What Data We Collect</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-[#5F5A51]">
            <li>Profile information (name, optional city)</li>
            <li>Lifestyle logs (sleep, hydration, mood)</li>
            <li>Scan metadata and score history</li>
            <li>Permission preferences and consent choices</li>
          </ul>
        </section>

        <section className="af-card-secondary p-6">
          <div className="mb-3 flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-[#0071e3]" />
            <h2 className="text-2xl font-semibold">Why We Collect It</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-[#5F5A51]">
            <li>Personalize routine suggestions and alerts</li>
            <li>Generate climate and lifestyle adjusted recommendations</li>
            <li>Track progress over time and report improvements</li>
          </ul>
        </section>

        <section className="af-card-secondary p-6">
          <div className="mb-3 flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-[#0071e3]" />
            <h2 className="text-2xl font-semibold">Storage & Security</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-[#5F5A51]">
            <li>Data is stored locally and/or in secured backend systems</li>
            <li>Use HTTPS, environment-based secrets, and authenticated APIs in production</li>
            <li>Only required data is retained to deliver product features</li>
          </ul>
        </section>

        <section className="af-card-secondary p-6">
          <div className="mb-3 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-[#A04F39]" />
            <h2 className="text-2xl font-semibold">Data Deletion</h2>
          </div>
          <p className="text-[#5F5A51]">Users can remove tracked data from Data Settings via the "Delete All Data" action.</p>
        </section>
      </main>
    </div>
  );
}


