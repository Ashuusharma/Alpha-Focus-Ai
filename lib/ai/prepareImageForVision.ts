import "server-only";

// Loaded lazily (not as a static top-level import) because sharp's native
// binding throws synchronously at module-evaluation time when it can't load
// for the current platform/Node version. A static import would make that
// failure happen while Next.js loads the route's module graph, before any
// try/catch in this file (or in a caller) ever runs — defeating the
// catch-and-fall-back-to-Galaxy contract this module exists to support.
// Loading it inside an async function turns that failure into an ordinary
// Promise rejection at call time instead.
type SharpFactory = typeof import("sharp")["default"];
let sharpModulePromise: Promise<SharpFactory> | null = null;

async function loadSharp(): Promise<SharpFactory> {
  if (!sharpModulePromise) {
    sharpModulePromise = import("sharp").then((mod) => mod.default);
  }
  return sharpModulePromise;
}

export type PrepareImageForVisionOptions = {
  maxDimension?: number;
  quality?: number;
};

export type PrepareImageForVisionMetadata = {
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  originalBytes: number;
  compressedBytes: number;
  /** compressedBytes / originalBytes — e.g. 0.3 means compressed to 30% of the original size. */
  compressionRatio: number;
  resized: boolean;
  normalizedOrientation: boolean;
};

export type PrepareImageForVisionResult = {
  buffer: Buffer;
  mimeType: "image/jpeg";
  metadata: PrepareImageForVisionMetadata;
};

export type PrepareImageErrorDetails = {
  stage: "decode" | "process";
  reason: string;
  originalBytes: number | null;
};

// Thrown when prepareImageForVision cannot decode or process the input.
// Mirrors VisionAnalysisError's shape: a typed, structured error rather than
// a bare Error, so a caller can log or branch on `stage` without string-matching.
export class PrepareImageError extends Error {
  readonly stage: PrepareImageErrorDetails["stage"];
  readonly reason: string;
  readonly originalBytes: number | null;

  constructor(details: PrepareImageErrorDetails) {
    super(details.reason);
    this.name = "PrepareImageError";
    this.stage = details.stage;
    this.reason = details.reason;
    this.originalBytes = details.originalBytes;
  }
}

const DEFAULT_MAX_DIMENSION = 1024;
const DEFAULT_JPEG_QUALITY = 82;

// EXIF orientation values 5-8 involve a 90/270-degree transpose, so the
// logical (correctly displayed) width/height are swapped relative to the
// raw stored pixel dimensions sharp's metadata() reports.
function resolveLogicalDimensions(rawWidth: number | undefined, rawHeight: number | undefined, orientation: number) {
  const swapped = orientation >= 5 && orientation <= 8;
  const width = (swapped ? rawHeight : rawWidth) ?? 0;
  const height = (swapped ? rawWidth : rawHeight) ?? 0;
  return { width, height };
}

async function readMetadataOrThrow(input: Buffer, originalBytes: number) {
  try {
    const sharp = await loadSharp();
    return await sharp(input).metadata();
  } catch (error) {
    throw new PrepareImageError({
      stage: "decode",
      reason: error instanceof Error ? error.message : "unable_to_decode_image",
      originalBytes,
    });
  }
}

async function processImageOrThrow(input: Buffer, originalBytes: number, maxDimension: number, quality: number) {
  try {
    const sharp = await loadSharp();
    return await sharp(input)
      .rotate() // normalize EXIF orientation, then strip the orientation tag
      .toColorspace("srgb")
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, progressive: true })
      // .withMetadata() is deliberately NOT called — sharp strips EXIF/ICC
      // metadata from the output by default, satisfying the "strip metadata" requirement.
      .toBuffer({ resolveWithObject: true });
  } catch (error) {
    throw new PrepareImageError({
      stage: "process",
      reason: error instanceof Error ? error.message : "unable_to_process_image",
      originalBytes,
    });
  }
}

/**
 * Prepares a raw image buffer for submission to a vision model: normalizes
 * EXIF orientation, converts to sRGB, strips metadata, downsizes to fit within
 * maxDimension on its longest side (never upscaling), and re-encodes as
 * progressive JPEG. Completely standalone — no route, OpenAI, or Supabase imports.
 */
export async function prepareImageForVision(
  input: Buffer,
  options?: PrepareImageForVisionOptions
): Promise<PrepareImageForVisionResult> {
  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options?.quality ?? DEFAULT_JPEG_QUALITY;
  const originalBytes = input.length;

  if (originalBytes === 0) {
    throw new PrepareImageError({ stage: "decode", reason: "empty_input_buffer", originalBytes: 0 });
  }

  const rawMetadata = await readMetadataOrThrow(input, originalBytes);
  const orientation = rawMetadata.orientation ?? 1;
  const { width: originalWidth, height: originalHeight } = resolveLogicalDimensions(
    rawMetadata.width,
    rawMetadata.height,
    orientation
  );
  const normalizedOrientation = orientation !== 1;

  const { data: buffer, info } = await processImageOrThrow(input, originalBytes, maxDimension, quality);

  const outputWidth = info.width;
  const outputHeight = info.height;
  const compressedBytes = buffer.length;
  const compressionRatio = originalBytes > 0 ? Number((compressedBytes / originalBytes).toFixed(4)) : 0;
  const resized = outputWidth !== originalWidth || outputHeight !== originalHeight;

  return {
    buffer,
    mimeType: "image/jpeg",
    metadata: {
      originalWidth,
      originalHeight,
      outputWidth,
      outputHeight,
      originalBytes,
      compressedBytes,
      compressionRatio,
      resized,
      normalizedOrientation,
    },
  };
}
