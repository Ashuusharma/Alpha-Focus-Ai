import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { protocolGenerateSchema } from "@/lib/server/validators";
import { writeAuditLog } from "@/lib/server/auditLog";
import { isRateLimited } from "@/lib/server/rateLimit";
import { AnalysisResult } from "@/lib/analyzeImage";
import { buildClinicalProfileFromAssessmentAndAnalysis } from "@/lib/clinical/buildClinicalProfileFromAssessmentAndAnalysis";
import { buildProtocolInput } from "@/lib/protocol/contract";
import { generateProtocolWithOrchestrator } from "@/lib/ai/ProtocolOrchestrator";
import {
  insertProtocolGenerationJob,
  insertProtocolReport,
  protocolRepoReady,
  updateProtocolReport,
} from "@/lib/server/protocolRepository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (!protocolRepoReady()) {
      return NextResponse.json({ ok: false, error: "protocol_storage_not_configured" }, { status: 500 });
    }

    if (isRateLimited(`protocol:generate:${auth.userId}`, 12, 60_000)) {
      await writeAuditLog({ action: "protocol.generate", userId: auth.userId, ok: false, route: "/api/protocol/generate", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const payload = await request.json();
    const parsed = protocolGenerateSchema.safeParse(payload);
    if (!parsed.success) {
      await writeAuditLog({ action: "protocol.generate", userId: auth.userId, ok: false, route: "/api/protocol/generate", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const body = parsed.data;
    const answers = body.answers || {};

    const analysis: AnalysisResult | null = body.analysis
      ? {
          type: body.analysis.type as AnalysisResult["type"],
          confidence: Math.round(body.analysis.confidence),
          severity: body.analysis.severity,
          capturedPhotos: body.analysis.capturedPhotos,
          detectedIssues: body.analysis.detectedIssues,
          recommendations: [],
          tips: [],
          products: [],
          weeklyRoutines: [],
        }
      : null;

    const profile = buildClinicalProfileFromAssessmentAndAnalysis(answers, analysis, {
      userId: auth.userId,
      locale: body.locale || "en-IN",
      category: body.category,
      demographics: body.demographics,
      environment: body.environment,
      lifestyle: body.lifestyle,
      protocolContext: {
        toleranceMode: body.programContext?.toleranceMode,
        adherenceScore: body.programContext?.adherenceScore,
        relapseRiskScore: body.programContext?.relapseRiskScore,
        ownedProductIds: body.programContext?.ownedProductIds,
      },
      rewardContext: body.rewardContext,
    });

    const protocolInput = buildProtocolInput(profile);

    const reportRow = await insertProtocolReport({
      user_id: auth.userId,
      source_category: body.category,
      source_locale: body.locale || "en-IN",
      source_version: "v2",
      model_name: "pending",
      status: body.async !== false ? "queued" : "generating",
      clinical_profile: profile,
      protocol_input: protocolInput,
      report_payload: {},
      fallback_used: false,
    });

    const asyncMode = body.async !== false;

    const job = await insertProtocolGenerationJob({
      user_id: auth.userId,
      report_id: reportRow.id,
      status: "queued",
      priority: body.priority || 5,
      attempts: 0,
      max_attempts: 3,
      scheduled_for: new Date().toISOString(),
      input_payload: {
        profile,
        protocolInput,
      },
    });

    if (asyncMode) {
      await writeAuditLog({ action: "protocol.generate", userId: auth.userId, ok: true, route: "/api/protocol/generate", detail: "queued" });
      return NextResponse.json({
        ok: true,
        status: "queued",
        reportId: reportRow.id,
        jobId: job.id,
      });
    }

    await updateProtocolReport(reportRow.id, {
      status: "processing",
      modelName: "pending",
      fallbackUsed: false,
    });

    const generated = await generateProtocolWithOrchestrator(protocolInput);

    await updateProtocolReport(reportRow.id, {
      status: "ready",
      modelName: generated.model,
      fallbackUsed: generated.status !== "ok",
      reportPayload: generated.report,
      promptVersion: generated.promptVersion,
      cacheKey: generated.cacheKey,
      tokenUsage: generated.tokenUsage,
      costEstimate: generated.costEstimateUsd,
    });

    await writeAuditLog({ action: "protocol.generate", userId: auth.userId, ok: true, route: "/api/protocol/generate", detail: generated.status !== "ok" ? "fallback" : "ai" });

    return NextResponse.json({
      ok: true,
      status: "completed",
      reportId: reportRow.id,
      jobId: job.id,
      report: generated.report,
      source: generated.status !== "ok" ? "fallback" : "ai",
      orchestrator: {
        model: generated.model,
        promptVersion: generated.promptVersion,
        cacheHit: generated.cacheHit,
        tokenUsage: generated.tokenUsage,
        costEstimateUsd: generated.costEstimateUsd,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "protocol_generate_failed" }, { status: 500 });
  }
}
