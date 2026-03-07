import { supabase } from "@/lib/supabaseClient";
import { CategoryId } from "@/lib/questions";

export type TimelineSnapshot = {
  id: string;
  scan_date: string;
  severity_snapshot: number;
  inflammation_snapshot: number;
  image_url?: string | null;
};

export type TimelineDelta = {
  from_scan_date: string;
  to_scan_date: string;
  severity_delta: number;
  inflammation_delta: number;
  improvement_message: string;
};

export type ProgressTimeline = {
  category: string;
  snapshots: TimelineSnapshot[];
  deltas: TimelineDelta[];
};

function deltaMessage(severityDelta: number, inflammationDelta: number) {
  const severityText = severityDelta < 0
    ? `Severity improved ${Math.abs(severityDelta)} points`
    : severityDelta > 0
      ? `Severity worsened ${severityDelta} points`
      : "Severity stable";

  const inflammationText = inflammationDelta < 0
    ? `inflammation down ${Math.abs(inflammationDelta)} points`
    : inflammationDelta > 0
      ? `inflammation up ${inflammationDelta} points`
      : "inflammation stable";

  return `${severityText}; ${inflammationText}.`;
}

export async function getProgressTimeline(userId: string, category: CategoryId): Promise<ProgressTimeline> {
  const { data } = await supabase
    .from("photo_scans")
    .select("id,scan_date,severity_snapshot,inflammation_snapshot,image_url")
    .eq("user_id", userId)
    .eq("analyzer_category", category)
    .not("severity_snapshot", "is", null)
    .order("scan_date", { ascending: false })
    .limit(5);

  const snapshots = ((data || []) as TimelineSnapshot[])
    .sort((a, b) => new Date(a.scan_date).getTime() - new Date(b.scan_date).getTime());

  const deltas: TimelineDelta[] = [];
  for (let index = 1; index < snapshots.length; index += 1) {
    const previous = snapshots[index - 1];
    const current = snapshots[index];

    const severityDelta = (current.severity_snapshot || 0) - (previous.severity_snapshot || 0);
    const inflammationDelta = (current.inflammation_snapshot || 0) - (previous.inflammation_snapshot || 0);

    deltas.push({
      from_scan_date: previous.scan_date,
      to_scan_date: current.scan_date,
      severity_delta: severityDelta,
      inflammation_delta: inflammationDelta,
      improvement_message: deltaMessage(severityDelta, inflammationDelta),
    });
  }

  return {
    category,
    snapshots,
    deltas,
  };
}
