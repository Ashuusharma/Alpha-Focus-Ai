import Link from "next/link";
import { ArrowRight, Camera, HeartHandshake } from "lucide-react";

/**
 * "Follow-up" per the Phase 9C.6 IA spec asks for "when to rescan" and
 * "recovery reminders." Neither has a real backing field in the report
 * schema (no rescan-date, no reminder data) — rather than fabricate a
 * personalized date, this shows the same general clinical guidance every
 * user gets (honest, not a fake calculation) plus a real link to the one
 * place daily adherence is actually tracked. "Progress expectations" is
 * already covered in full by the Recovery Roadmap section above — not
 * duplicated here.
 */
export default function ProtocolFollowUp({ motivation }: { motivation: string }) {
  return (
    <section id="follow-up" className="af-hero-dark scroll-mt-24 p-6 text-center md:p-8">
      <HeartHandshake className="mx-auto h-6 w-6 text-[var(--accent-green)]" />
      <p className="mx-auto mt-3 max-w-xl text-sm text-white">{motivation}</p>

      <div className="mx-auto mt-5 flex max-w-xl flex-col items-center gap-4 border-t border-white/10 pt-5 sm:flex-row sm:justify-center sm:gap-6">
        <p className="flex items-center gap-2 text-xs text-[var(--text-secondary-dark)]">
          <Camera className="h-3.5 w-3.5 shrink-0" />
          Rescan every 1-2 weeks in consistent lighting to keep this plan accurate as your progress changes.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
        >
          Track today&apos;s progress <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
