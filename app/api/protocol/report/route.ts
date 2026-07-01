import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { isRateLimited } from "@/lib/server/rateLimit";
import { writeAuditLog } from "@/lib/server/auditLog";
import { fetchLatestProtocolReportForUser, fetchProtocolReportById, protocolRepoReady } from "@/lib/server/protocolRepository";
import { protocolReportSchema } from "@/types/protocolReport";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (!protocolRepoReady()) {
      return NextResponse.json({ ok: false, error: "protocol_storage_not_configured" }, { status: 500 });
    }

    if (isRateLimited(`protocol:report:${auth.userId}`, 90, 60_000)) {
      await writeAuditLog({ action: "protocol.report.read", userId: auth.userId, ok: false, route: "/api/protocol/report", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const reportId = request.nextUrl.searchParams.get("reportId") || "";
    const sourceVersion = request.nextUrl.searchParams.get("sourceVersion") || "v2";

    if (sourceVersion.length > 20) {
      return NextResponse.json({ ok: false, error: "invalid_query" }, { status: 400 });
    }

    const row = reportId
      ? await fetchProtocolReportById({
          reportId,
          userId: auth.userId,
          sourceVersion,
        })
      : await fetchLatestProtocolReportForUser({
          userId: auth.userId,
          sourceVersion,
        });

    if (!row) {
      await writeAuditLog({ action: "protocol.report.read", userId: auth.userId, ok: false, route: "/api/protocol/report", detail: "not_found_or_forbidden" });
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    await writeAuditLog({ action: "protocol.report.read", userId: auth.userId, ok: true, route: "/api/protocol/report" });

    const parsedPayload = protocolReportSchema.safeParse(row.report_payload);
    const payload = row.status === "ready" && parsedPayload.success ? parsedPayload.data : null;

    return NextResponse.json({
      ok: true,
      report: {
        id: row.id,
        sourceVersion: row.source_version,
        status: row.status,
        generatedAt: row.generated_at,
        createdAt: row.created_at,
        payload,
        metadata: {
          aiQualityScores: row.ai_quality_scores || null,
          protocolVersions: row.protocol_versions || null,
          clinicalProfileSchemaVersion: row.clinical_profile_schema_version || null,
          reportSchemaVersion: row.report_schema_version || null,
        },
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "protocol_report_fetch_failed" }, { status: 500 });
  }
}
