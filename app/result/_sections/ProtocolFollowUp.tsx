import { HeartHandshake } from "lucide-react";

export default function ProtocolFollowUp({ motivation }: { motivation: string }) {
  return (
    <section id="follow-up" className="af-hero-dark scroll-mt-24 p-6 text-center md:p-8">
      <HeartHandshake className="mx-auto h-6 w-6 text-[var(--accent-green)]" />
      <p className="mx-auto mt-3 max-w-xl text-sm text-white">{motivation}</p>
    </section>
  );
}
