import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import MedicalCard from "@/components/ui/MedicalCard";

type Trend = "up" | "down" | "flat";

type HealthMetric = {
  title: string;
  score: number;
  trend: Trend;
  confidence: number;
  href: string;
};

type HealthOverviewGridProps = {
  items?: HealthMetric[];
};

const defaultItems: HealthMetric[] = [
  { title: "Skin Health", score: 78, trend: "up", confidence: 88, href: "/result" },
  { title: "Hair Density", score: 69, trend: "up", confidence: 81, href: "/result" },
  { title: "Lifestyle Score", score: 74, trend: "flat", confidence: 77, href: "/tracking" },
  { title: "Consistency %", score: 83, trend: "up", confidence: 92, href: "/dashboard" },
];

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") {
    return <ArrowUpRight className="h-4 w-4 text-clinical-success" aria-hidden="true" />;
  }
  if (trend === "down") {
    return <ArrowDownRight className="h-4 w-4 text-clinical-danger" aria-hidden="true" />;
  }
  return <Minus className="h-4 w-4 text-clinical-warning" aria-hidden="true" />;
}

export default function HealthOverviewGrid({ items = defaultItems }: HealthOverviewGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Link key={item.title} href={item.href} className="block">
          <MedicalCard className="h-full p-5">
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <p className="text-sm text-text-secondary">{item.title}</p>
                <p className="metric-number mt-2 text-4xl leading-none text-text-primary">{item.score}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <TrendIcon trend={item.trend} />
                  <span className="capitalize">{item.trend} trend</span>
                </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8E3DA]">
                    <div
                      className="h-full rounded-full bg-medical-gradient"
                      style={{ width: `${Math.max(8, Math.min(100, item.score))}%` }}
                      aria-hidden="true"
                    />
                  </div>
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>Confidence</span>
                  <span className="metric-number text-sm text-text-primary">{item.confidence}%</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-accent-cyan">
                  <span>View details</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </div>
            </div>
          </MedicalCard>
        </Link>
      ))}
    </div>
  );
}
