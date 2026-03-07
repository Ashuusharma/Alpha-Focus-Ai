import { supabase } from "@/lib/supabaseClient";
import { CategoryId } from "@/lib/questions";

type UploadResult = {
  urls: string[];
  paths: string[];
  errors: string[];
};

function extFromMime(mimeType: string) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function uploadAnalyzerImagesToSupabase(params: {
  userId: string;
  category: CategoryId;
  images: string[];
  bucket?: string;
}): Promise<UploadResult> {
  const { userId, category, images, bucket = process.env.NEXT_PUBLIC_SUPABASE_ANALYZER_BUCKET || "analyzer-scans" } = params;

  const urls: string[] = [];
  const paths: string[] = [];
  const errors: string[] = [];
  const timestamp = Date.now();

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];

    try {
      const blob = await dataUrlToBlob(image);
      const ext = extFromMime(blob.type || "image/jpeg");
      const path = `${userId}/${category}/${timestamp}-${index + 1}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, blob, {
          contentType: blob.type || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        errors.push(`upload_${index + 1}: ${uploadError.message}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = publicUrlData?.publicUrl;

      if (publicUrl) {
        urls.push(publicUrl);
        paths.push(path);
      } else {
        errors.push(`public_url_${index + 1}: missing public URL`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown upload error";
      errors.push(`upload_${index + 1}: ${message}`);
    }
  }

  return { urls, paths, errors };
}