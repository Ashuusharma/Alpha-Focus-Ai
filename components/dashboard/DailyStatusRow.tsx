type DailyStatusRowProps = {
  completedToday: boolean;
  inProgress: boolean;
  attentionNeeded: boolean;
};

function statusText(value: boolean, positive = "Yes", negative = "No") {
  return value ? positive : negative;
}

export default function DailyStatusRow({ completedToday, inProgress, attentionNeeded }: DailyStatusRowProps) {
  return (
    <section className="grid grid-cols-12 gap-4">
      <article className="col-span-12 rounded-2xl bg-[#F7F4EE] p-5 sm:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] md:col-span-4">
        <p className="text-xs uppercase tracking-wide text-[#6E9F87]">Completed Today</p>
        <p className="mt-2 text-base sm:text-lg font-semibold text-[#1E4D3A]">{statusText(completedToday, "Yes", "Not yet")}</p>
      </article>
      <article className="col-span-12 rounded-2xl bg-[#F7F4EE] p-5 sm:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] md:col-span-4">
        <p className="text-xs uppercase tracking-wide text-[#6E9F87]">In Progress</p>
        <p className="mt-2 text-base sm:text-lg font-semibold text-[#1E4D3A]">{statusText(inProgress, "Active", "Idle")}</p>
      </article>
      <article className="col-span-12 rounded-2xl bg-[#F7F4EE] p-5 sm:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] md:col-span-4">
        <p className="text-xs uppercase tracking-wide text-[#6E9F87]">Attention Needed</p>
        <p className="mt-2 text-base sm:text-lg font-semibold text-[#1E4D3A]">{statusText(attentionNeeded, "Yes", "No")}</p>
      </article>
    </section>
  );
}
