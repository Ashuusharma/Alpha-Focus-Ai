import { ProtocolInput } from "@/lib/protocol/contract";
import { ClinicalProfile } from "@/types/clinicalProfile";
import { ProtocolReport } from "@/types/protocolReport";

type SupabaseConfig = {
  baseUrl: string;
  serviceKey: string;
};

type ProtocolReportRowInsert = {
  user_id: string;
  source_category?: string;
  source_locale: string;
  source_version: string;
  model_name?: string;
  status: "generating" | "ready" | "failed" | "archived";
  clinical_profile: ClinicalProfile;
  protocol_input: ProtocolInput;
  report_payload: Record<string, unknown>;
  fallback_used: boolean;
  generated_at?: string;
};

type ProtocolJobInsert = {
  user_id: string;
  report_id?: string;
  status: "queued" | "processing" | "completed" | "failed" | "retry_scheduled" | "cancelled";
  priority: number;
  attempts: number;
  max_attempts: number;
  scheduled_for: string;
  input_payload: Record<string, unknown>;
};

function getConfig(): SupabaseConfig | null {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !serviceKey) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), serviceKey };
}

function headers(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function request<T>(config: SupabaseConfig, path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${config.baseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...headers(config.serviceKey),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase request failed: ${res.status} ${detail}`);
  }

  return (await res.json()) as T;
}

export function protocolRepoReady(): boolean {
  return Boolean(getConfig());
}

export async function insertProtocolReport(row: ProtocolReportRowInsert): Promise<{ id: string }> {
  const config = getConfig();
  if (!config) throw new Error("supabase_not_configured");

  const data = await request<Array<{ id: string }>>(config, "protocol_reports?select=id", {
    method: "POST",
    body: JSON.stringify(row),
  });

  const first = data[0];
  if (!first?.id) throw new Error("protocol_report_insert_failed");
  return first;
}

export async function insertProtocolGenerationJob(row: ProtocolJobInsert): Promise<{ id: string }> {
  const config = getConfig();
  if (!config) throw new Error("supabase_not_configured");

  const data = await request<Array<{ id: string }>>(config, "protocol_generation_jobs?select=id", {
    method: "POST",
    body: JSON.stringify(row),
  });

  const first = data[0];
  if (!first?.id) throw new Error("protocol_job_insert_failed");
  return first;
}

export async function fetchNextQueuedProtocolJob(): Promise<null | {
  id: string;
  user_id: string;
  report_id: string | null;
  attempts: number;
  max_attempts: number;
  input_payload: Record<string, unknown>;
}> {
  const config = getConfig();
  if (!config) throw new Error("supabase_not_configured");

  const nowIso = new Date().toISOString();
  const path = [
    "protocol_generation_jobs",
    "?select=id,user_id,report_id,attempts,max_attempts,input_payload,status,scheduled_for",
    "&status=in.(queued,retry_scheduled)",
    `&scheduled_for=lte.${encodeURIComponent(nowIso)}`,
    "&order=priority.asc,scheduled_for.asc,created_at.asc",
    "&limit=1",
  ].join("");

  const rows = await request<Array<{
    id: string;
    user_id: string;
    report_id: string | null;
    attempts: number;
    max_attempts: number;
    input_payload: Record<string, unknown>;
  }>>(config, path, { method: "GET" });

  return rows[0] || null;
}

export async function markProtocolJobProcessing(jobId: string, attempts: number): Promise<void> {
  const config = getConfig();
  if (!config) throw new Error("supabase_not_configured");

  await request<Array<{ id: string }>>(
    config,
    `protocol_generation_jobs?id=eq.${jobId}&select=id`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "processing",
        attempts: attempts + 1,
        started_at: new Date().toISOString(),
        locked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    }
  );
}

export async function markProtocolJobCompleted(jobId: string, report: ProtocolReport): Promise<void> {
  const config = getConfig();
  if (!config) throw new Error("supabase_not_configured");

  await request<Array<{ id: string }>>(
    config,
    `protocol_generation_jobs?id=eq.${jobId}&select=id`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "completed",
        output_payload: report,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    }
  );
}

export async function markProtocolJobFailed(jobId: string, error: string, attempts: number, maxAttempts: number): Promise<void> {
  const config = getConfig();
  if (!config) throw new Error("supabase_not_configured");

  const shouldRetry = attempts < maxAttempts;
  const retryAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

  await request<Array<{ id: string }>>(
    config,
    `protocol_generation_jobs?id=eq.${jobId}&select=id`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: shouldRetry ? "retry_scheduled" : "failed",
        error_message: error.slice(0, 800),
        failed_at: shouldRetry ? null : new Date().toISOString(),
        scheduled_for: shouldRetry ? retryAt : undefined,
        updated_at: new Date().toISOString(),
      }),
    }
  );
}

export async function updateProtocolReport(reportId: string, input: {
  status: "generating" | "ready" | "failed" | "archived";
  modelName: string;
  fallbackUsed: boolean;
  reportPayload: ProtocolReport;
}): Promise<void> {
  const config = getConfig();
  if (!config) throw new Error("supabase_not_configured");

  await request<Array<{ id: string }>>(
    config,
    `protocol_reports?id=eq.${reportId}&select=id`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: input.status,
        model_name: input.modelName,
        fallback_used: input.fallbackUsed,
        report_payload: input.reportPayload,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    }
  );
}
