import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortfolioItem } from "@/lib/auth-types";
import { makeStableItemId } from "@/lib/portfolio-media";
import { processPortfolioImageFile } from "@/lib/portfolio/process-portfolio-image";

export const PORTFOLIO_BUCKET = "portfolio";

/** Raw video upload cap (storage bucket allows 50MB). */
export const MAX_PORTFOLIO_VIDEO_BYTES = 48 * 1024 * 1024;

export function isDataUrl(url: string): boolean {
  return url.startsWith("data:");
}

export function isRemoteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function extForVideo(file: File): string {
  const map: Record<string, string> = {
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };
  return map[file.type] ?? "mp4";
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

function publicUrlForPath(supabase: SupabaseClient, path: string): string {
  const { data } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPortfolioImageFile(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  const blob = await processPortfolioImageFile(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(PORTFOLIO_BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return publicUrlForPath(supabase, path);
}

export async function uploadPortfolioVideoFile(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  if (file.size > MAX_PORTFOLIO_VIDEO_BYTES) {
    throw new Error("videoTooLarge");
  }
  const path = `${userId}/${crypto.randomUUID()}.${extForVideo(file)}`;
  const { error } = await supabase.storage.from(PORTFOLIO_BUCKET).upload(path, file, {
    contentType: file.type || "video/mp4",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return publicUrlForPath(supabase, path);
}

export async function uploadPortfolioDataUrl(
  supabase: SupabaseClient,
  userId: string,
  dataUrl: string,
  kind: PortfolioItem["kind"],
): Promise<string> {
  const blob = await dataUrlToBlob(dataUrl);
  const path = `${userId}/${crypto.randomUUID()}.${kind === "image" ? "jpg" : "mp4"}`;
  const contentType =
    kind === "image"
      ? "image/jpeg"
      : blob.type.startsWith("video/")
        ? blob.type
        : "video/mp4";
  const { error } = await supabase.storage.from(PORTFOLIO_BUCKET).upload(path, blob, {
    contentType,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return publicUrlForPath(supabase, path);
}

/**
 * Ensures every item uses a short HTTPS storage URL (migrates legacy data: URLs on save).
 */
export async function preparePortfolioItemsForSave(
  supabase: SupabaseClient,
  userId: string,
  items: PortfolioItem[],
  onItemProgress?: (index: number, total: number) => void,
): Promise<PortfolioItem[]> {
  const out: PortfolioItem[] = [];
  const total = items.length;

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    onItemProgress?.(i, total);

    if (isRemoteUrl(item.url) && !isDataUrl(item.url)) {
      out.push(item);
      continue;
    }

    if (!isDataUrl(item.url)) {
      out.push(item);
      continue;
    }

    const url = await uploadPortfolioDataUrl(supabase, userId, item.url, item.kind);
    out.push({
      ...item,
      id: makeStableItemId(url, item.kind),
      url,
    });
  }

  return out;
}

export function portfolioItemsToUrlLists(items: PortfolioItem[]): {
  images: string[];
  videos: string[];
} {
  const images: string[] = [];
  const videos: string[] = [];
  for (const it of items) {
    if (it.kind === "video") videos.push(it.url);
    else images.push(it.url);
  }
  return { images, videos };
}

export function mapPortfolioUploadError(err: unknown): string {
  const code =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: string }).message ?? "")
      : "";
  const status =
    err && typeof err === "object" && "statusCode" in err
      ? String((err as { statusCode?: string | number }).statusCode ?? "")
      : "";

  if (code.includes("Bucket not found") || status === "404") {
    return "authMessages.portfolioStorageMissing";
  }
  if (code.includes("Payload too large") || status === "413") {
    return "authMessages.portfolioPayloadTooLarge";
  }
  if (code === "videoTooLarge") {
    return "dashboard.artistPostPage.videoFileTooLarge";
  }
  return "authMessages.portfolioUploadFailed";
}
