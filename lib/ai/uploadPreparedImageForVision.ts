import "server-only";
import { prepareImageForVision, PrepareImageForVisionOptions } from "@/lib/ai/prepareImageForVision";

export type UploadPreparedImageInput = {
  buffer: Buffer;
  userId: string;
  category: string;
  bucket?: string;
  prepareOptions?: PrepareImageForVisionOptions;
};

export type UploadPreparedImageResult = {
  uploadedUrl: string;
  mimeType: "image/jpeg";
  compressedBytes: number;
  originalBytes: number;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
};

export type ImageUploadErrorDetails = {
  stage: "prepare" | "config" | "upload";
  reason: string;
  httpStatus: number | null;
};

// Thrown when preparation or the Storage upload fails. Same typed-error
// pattern as VisionAnalysisError / PrepareImageError.
export class ImageUploadError extends Error {
  readonly stage: ImageUploadErrorDetails["stage"];
  readonly reason: string;
  readonly httpStatus: number | null;

  constructor(details: ImageUploadErrorDetails) {
    super(details.reason);
    this.name = "ImageUploadError";
    this.stage = details.stage;
    this.reason = details.reason;
    this.httpStatus = details.httpStatus;
  }
}

const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_ANALYZER_BUCKET || "analyzer-scans";
const UPLOAD_TIMEOUT_MS = Number(process.env.VISION_UPLOAD_TIMEOUT_MS || 20_000);

function getSupabaseServerConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) {
    throw new ImageUploadError({ stage: "config", reason: "supabase_service_config_missing", httpStatus: null });
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), serviceKey };
}

/**
 * Prepares an image for vision analysis (prepareImageForVision) and uploads
 * the compressed JPEG to Supabase Storage using the service role key. Does
 * NOT call any vision model. Standalone — not wired into any route yet; the
 * existing client-side upload flow (lib/photoStorage.ts) is untouched.
 */
export async function uploadPreparedImageForVision(
  input: UploadPreparedImageInput
): Promise<UploadPreparedImageResult> {
  let prepared: Awaited<ReturnType<typeof prepareImageForVision>>;
  try {
    prepared = await prepareImageForVision(input.buffer, input.prepareOptions);
  } catch (error) {
    throw new ImageUploadError({
      stage: "prepare",
      reason: error instanceof Error ? error.message : "image_preparation_failed",
      httpStatus: null,
    });
  }

  const { baseUrl, serviceKey } = getSupabaseServerConfig();
  const bucket = input.bucket || DEFAULT_BUCKET;
  const path = `${input.userId}/${input.category}/${Date.now()}-vision.jpg`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": prepared.mimeType,
      },
      body: new Blob([new Uint8Array(prepared.buffer)], { type: prepared.mimeType }),
      signal: controller.signal,
    });
  } catch (error) {
    throw new ImageUploadError({
      stage: "upload",
      reason: error instanceof Error ? error.message : "upload_request_failed",
      httpStatus: null,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ImageUploadError({
      stage: "upload",
      reason: `upload_http_${response.status}: ${body.slice(0, 300)}`,
      httpStatus: response.status,
    });
  }

  const uploadedUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;

  return {
    uploadedUrl,
    mimeType: prepared.mimeType,
    compressedBytes: prepared.metadata.compressedBytes,
    originalBytes: prepared.metadata.originalBytes,
    originalWidth: prepared.metadata.originalWidth,
    originalHeight: prepared.metadata.originalHeight,
    outputWidth: prepared.metadata.outputWidth,
    outputHeight: prepared.metadata.outputHeight,
  };
}
