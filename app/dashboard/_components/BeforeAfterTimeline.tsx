"use client";

type TimelinePhoto = {
  label: "Day 1" | "Day 14" | "Day 30";
  date: string | null;
  imageUrl: string | null;
};

type BeforeAfterTimelineProps = {
  categoryLabel: string;
  photos: TimelinePhoto[];
};

function formatDate(input: string | null) {
  if (!input) return "Not available";
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString();
}

export default function BeforeAfterTimeline({ categoryLabel, photos }: BeforeAfterTimelineProps) {
  return (
    <section className="rounded-[2rem] border border-[#E2DDD3] bg-white p-6 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8C6A5A]">Before / After Timeline</p>
          <h3 className="text-lg font-black text-[#111]">{categoryLabel} Visual Recovery Milestones</h3>
        </div>
        <p className="text-xs text-[#6B665D]">Day 1, Day 14, Day 30</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {photos.map((item) => (
          <article key={item.label} className="rounded-[1.4rem] border border-[#E2DDD3] bg-[#FFF8EE] p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#1F3D2B]">{item.label}</p>
              <p className="text-[11px] text-[#6B665D]">{formatDate(item.date)}</p>
            </div>

            <div className="mt-2 overflow-hidden rounded-lg border border-[#DCD5C8] bg-white">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={`${item.label} timeline`}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-40 items-center justify-center bg-[#F2EDE4] text-xs text-[#8C877D]">
                  Photo not uploaded yet
                </div>
              )}
            </div>

            <p className="mt-2 text-xs text-[#6B665D]">
              {item.label === "Day 1" ? "Baseline record" : item.label === "Day 14" ? "Mid-program checkpoint" : "Outcome review + maintenance handoff"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
