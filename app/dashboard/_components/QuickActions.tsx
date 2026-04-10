import Link from "next/link";
import { ArrowRight, Camera, ClipboardList, ShoppingCart, Trophy } from "lucide-react";

const actions = [
  { title: "Scan Again", href: "/image-analyzer", icon: Camera, helper: "Run new image analysis" },
  { title: "Update Assessment", href: "/assessment", icon: ClipboardList, helper: "Refresh condition context" },
  { title: "View Products", href: "/shop", icon: ShoppingCart, helper: "Open recommended products" },
  { title: "Start Challenge", href: "/challenges", icon: Trophy, helper: "Begin adherence program" },
];

export default function QuickActions() {
  return (
    <section className="af-card rounded-2xl p-6">
      <h3 className="text-lg font-bold text-[#1d1d1f]">Quick Actions</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} href={action.href} className="rounded-xl border border-[#d9d9de] bg-[#F8F6F3] p-4 hover:border-[#0071e3]/40 transition">
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-[#0071e3]" />
                <ArrowRight className="h-4 w-4 text-[#6e6e73]" />
              </div>
              <p className="mt-3 text-sm font-bold text-[#1d1d1f]">{action.title}</p>
              <p className="mt-1 text-xs text-[#6e6e73]">{action.helper}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
