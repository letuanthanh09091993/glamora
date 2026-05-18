"use client";

import type { PortfolioItem } from "@/lib/auth-types";
import { makeStableItemId } from "@/lib/portfolio-media";
import { processPortfolioImageFile } from "@/lib/portfolio/process-portfolio-image";

type UploadApiResponse =
  | { ok: true; url: string }
  | { ok: false; error?: string; code?: string };

let setupPromise: Promise<boolean> | null = null;

/** Ensures the portfolio bucket exists (server creates it with service role). */
export async function ensurePortfolioStorageReady(): Promise<boolean> {
  if (!setupPromise) {
    setupPromise = fetch("/api/portfolio/setup-storage", { method: "POST", credentials: "include" })
      .then(async (res) => {
        const data = (await res.json()) as { ok?: boolean };
        return res.ok && Boolean(data.ok);
      })
      .catch(() => false)
      .finally(() => {
        setupPromise = null;
      });
  }
  return setupPromise;
}

async function postFile(file: File | Blob, kind: "image" | "video", filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", file, filename);
  form.append("kind", kind);

  const res = await fetch("/api/portfolio/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });

  const data = (await res.json()) as UploadApiResponse;
  if (!res.ok || !data.ok || !("url" in data) || !data.url) {
    const err = new Error("error" in data && data.error ? data.error : "Upload failed");
    if ("code" in data && data.code) {
      (err as Error & { code?: string }).code = data.code;
    }
    throw err;
  }
  return data.url;
}

export async function uploadPortfolioImageViaApi(userId: string, file: File): Promise<string> {
  void userId;
  await ensurePortfolioStorageReady();
  const blob = await processPortfolioImageFile(file);
  return postFile(blob, "image", "portfolio.jpg");
}

export async function uploadPortfolioVideoViaApi(userId: string, file: File): Promise<string> {
  void userId;
  await ensurePortfolioStorageReady();
  return postFile(file, "video", file.name || "portfolio.mp4");
}

/** Migrates any legacy data: URLs to storage via API before save. */
export async function preparePortfolioItemsForSaveViaApi(
  items: PortfolioItem[],
  onItemProgress?: (index: number, total: number) => void,
): Promise<PortfolioItem[]> {
  const out: PortfolioItem[] = [];
  const total = items.length;

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    onItemProgress?.(i, total);

    if (item.url.startsWith("http://") || item.url.startsWith("https://")) {
      if (!item.url.startsWith("data:")) {
        out.push(item);
        continue;
      }
    }

    if (!item.url.startsWith("data:")) {
      out.push(item);
      continue;
    }

    const blob = await fetch(item.url).then((r) => r.blob());
    const url = await postFile(
      blob,
      item.kind,
      item.kind === "image" ? "legacy.jpg" : "legacy.mp4",
    );
    out.push({
      ...item,
      id: makeStableItemId(url, item.kind),
      url,
    });
  }

  return out;
}

export function mapPortfolioApiError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const code = err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";

  if (
    code === "STORAGE_RLS_DENIED" ||
    message.includes("row-level security")
  ) {
    return "authMessages.portfolioRlsDenied";
  }
  if (
    code === "BUCKET_NOT_FOUND" ||
    code === "BUCKET_SETUP_FAILED" ||
    message.includes("Bucket not found") ||
    message.includes("SERVICE_ROLE")
  ) {
    return "authMessages.portfolioStorageMissing";
  }
  if (code === "VIDEO_TOO_LARGE" || message.includes("Video too large")) {
    return "dashboard.artistPostPage.videoFileTooLarge";
  }
  if (code === "IMAGE_TOO_LARGE") {
    return "dashboard.artistPostPage.imageTooLarge";
  }
  if (message.includes("Bucket not found")) {
    return "authMessages.portfolioStorageMissing";
  }
  return "authMessages.portfolioUploadFailed";
}
