import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { protocolGenerateSchema } from "@/lib/server/validators";
import { writeAuditLog } from "@/lib/server/auditLog";
import { isRateLimited } from "@/lib/server/rateLimit";
import { AnalysisResult } from "@/lib/analyzeImage";
import { buildClinicalProfileFromAssessmentAndAnalysis } from "@/lib/clinical/buildClinicalProfileFromAssessmentAndAnalysis";
import { buildProtocolInput } from "@/lib/protocol/contract";
import { generateProtocolWithOrchestrator } from "@/lib/ai/ProtocolOrchestrator";
import { evaluateProtocolQuality } from "@/lib/protocol/qualityEvaluation";
import { buildProtocolVersions } from "@/lib/protocol/versioning";
import { CLINICAL_PROFILE_SCHEMA_VERSION } from "@/types/clinicalProfile";
import { PROTOCOL_REPORT_SCHEMA_VERSION } from "@/types/protocolReport";
import {
  countPendingProtocolJobsForUser,
  insertProtocolGenerationJob,
  insertProtocolReport,
  protocolRepoReady,
  updateProtocolReport,
} from "@/lib/server/protocolRepository";

export const runtime = "nodejs";

function hasFinalInput(body: {
  finalSubmission?: boolean;
  answers?: Record<string, string>;
  analysis?: { detectedIssues?: Array<unknown> } | null;
}) {
  if (body.finalSubmission) return true;
  const answerCount = Object.keys(body.answers || {}).length;
  const issueCount = body.analysis?.detectedIssues?.length || 0;
  return answerCount >= 8 || issueCount > 0;
}

export async function POST(request: NextRequest) {
  try {
    console.info("[protocol.generate] route_entry", {
      method: request.method,
      path: request.nextUrl.pathname,
      hasAuthorizationHeader: Boolean(request.headers.get("authorization")?.trim()),
    });

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

    if (!hasFinalInput(body)) {
      await writeAuditLog({ action: "protocol.generate", userId: auth.userId, ok: false, route: "/api/protocol/generate", detail: "final_input_required" });
      return NextResponse.json({ ok: false, error: "final_input_required" }, { status: 400 });
    }

    const pendingJobs = await countPendingProtocolJobsForUser(auth.userId);
    if (pendingJobs >= 3) {
      await writeAuditLog({ action: "protocol.generate", userId: auth.userId, ok: false, route: "/api/protocol/generate", detail: "queue_busy" });
      return NextResponse.json({ ok: false, error: "queue_busy" }, { status: 429 });
    }

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

    console.info("[protocol.generate] before_insertProtocolReport", {
      userId: auth.userId,
      category: body.category || null,
      asyncMode: body.async !== false,
    });

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
      ai_quality_scores: {
        coverage: 0,
        consistency: 0,
        productMatch: 0,
        routineCompleteness: 0,
        indianAdaptation: 0,
        safetyRules: 0,
        promptConfidence: 0,
        missingInformation: 100,
        personalizationDepth: 0,
        explainabilityScore: 0,
      },
      protocol_versions: protocolInput.protocolVersions,
      clinical_profile_schema_version: CLINICAL_PROFILE_SCHEMA_VERSION,
      report_schema_version: PROTOCOL_REPORT_SCHEMA_VERSION,
    });

    console.info("[protocol.generate] after_insertProtocolReport", {
      reportId: reportRow.id,
      userId: auth.userId,
    });

    const asyncMode = body.async !== false;

    if (asyncMode) {
      console.info("[protocol.generate] before_insertProtocolGenerationJob", {
        reportId: reportRow.id,
        userId: auth.userId,
        priority: body.priority || 5,
      });

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

      console.info("[protocol.generate] after_insertProtocolGenerationJob", {
        reportId: reportRow.id,
        jobId: job.id,
        userId: auth.userId,
      });

      await writeAuditLog({ action: "protocol.generate", userId: auth.userId, ok: true, route: "/api/protocol/generate", detail: "queued" });
      return NextResponse.json({
        ok: true,
        status: "queued",
        reportId: reportRow.id,
        jobId: job.id,
        progress: 0,
        queuePosition: pendingJobs + 1,
        estimatedWait: (pendingJobs + 1) * 30,
        reportStatus: "queued",
      });
    }

    await updateProtocolReport(reportRow.id, {
      status: "processing",
      modelName: "pending",
      fallbackUsed: false,
    });

    const generated = await generateProtocolWithOrchestrator(protocolInput);
    const quality = evaluateProtocolQuality({ protocolInput, report: generated.report });
    const protocolVersions = buildProtocolVersions(
      generated.promptVersion,
      protocolInput.knowledgePack?.version,
      CLINICAL_PROFILE_SCHEMA_VERSION,
      PROTOCOL_REPORT_SCHEMA_VERSION
    );

    await updateProtocolReport(reportRow.id, {
      status: "ready",
      modelName: generated.model,
      fallbackUsed: generated.status !== "ok",
      reportPayload: generated.report,
      promptVersion: generated.promptVersion,
      cacheKey: generated.cacheKey,
      tokenUsage: generated.tokenUsage,
      costEstimate: generated.costEstimateUsd,
      aiQualityScores: quality,
      protocolVersions,
      clinicalProfileSchemaVersion: CLINICAL_PROFILE_SCHEMA_VERSION,
      reportSchemaVersion: PROTOCOL_REPORT_SCHEMA_VERSION,
    });

    await writeAuditLog({ action: "protocol.generate", userId: auth.userId, ok: true, route: "/api/protocol/generate", detail: generated.status !== "ok" ? "fallback" : "ai" });

    return NextResponse.json({
      ok: true,
      status: "completed",
      reportId: reportRow.id,
      jobId: null,
      progress: 100,
      reportStatus: "ready",
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
    console.error("[protocol.generate] unhandled_error", {
      error,
      message: error instanceof Error ? error.message : "unknown_error",
      stack: error instanceof Error ? error.stack : null,
    });
    return NextResponse.json({ ok: false, error: "protocol_generate_failed" }, { status: 500 });
  }
}
