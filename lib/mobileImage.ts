const DEFAULT_MAX_WIDTH = 1440;
const DEFAULT_MAX_HEIGHT = 1920;
const DEFAULT_MAX_BYTES = 1_200_000;
const DEFAULT_START_QUALITY = 0.86;
const MIN_QUALITY = 0.55;

export function estimateDataUrlBytes(dataUrl: string) {
  const [, base64 = ""] = dataUrl.split(",");
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor(base64.length * 0.75) - padding);
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read the selected image."));
    image.src = source;
  });
}

export async function compressImageToDataUrl(
  source: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    maxBytes?: number;
    quality?: number;
  }
) {
  const image = await loadImage(source);
  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = options?.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  let quality = options?.quality ?? DEFAULT_START_QUALITY;

  const widthRatio = maxWidth / Math.max(1, image.width);
  const heightRatio = maxHeight / Math.max(1, image.height);
  const ratio = Math.min(1, widthRatio, heightRatio);
  const targetWidth = Math.max(1, Math.round(image.width * ratio));
  const targetHeight = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("This device could not prepare the image for upload.");
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  let compressed = canvas.toDataURL("image/jpeg", quality);
  while (estimateDataUrlBytes(compressed) > maxBytes && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, Number((quality - 0.08).toFixed(2)));
    compressed = canvas.toDataURL("image/jpeg", quality);
  }

  return compressed;
}