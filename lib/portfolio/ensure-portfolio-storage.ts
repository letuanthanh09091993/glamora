import { createServiceRoleSupabase } from "@/lib/supabase/server-admin-client";

export const PORTFOLIO_BUCKET_ID = "portfolio";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

const FILE_SIZE_LIMIT = 52_428_800;

export function hasPortfolioServiceRole(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Server-only: create public `portfolio` bucket when service role is configured.
 * If service role is missing, returns ok+skipped (upload uses user session; bucket must exist via SQL/dashboard).
 */
export async function ensurePortfolioStorageBucket(): Promise<{
  ok: boolean;
  created: boolean;
  skipped?: boolean;
  error?: string;
  code?: string;
}> {
  if (!hasPortfolioServiceRole()) {
    return { ok: true, created: false, skipped: true };
  }

  try {
    const admin = createServiceRoleSupabase();
    const { data: buckets, error: listError } = await admin.storage.listBuckets();
    if (listError) {
      console.error("[portfolio storage] listBuckets", listError);
      return { ok: false, created: false, error: listError.message, code: "BUCKET_LIST_FAILED" };
    }

    const exists = buckets?.some((b) => b.id === PORTFOLIO_BUCKET_ID || b.name === PORTFOLIO_BUCKET_ID);
    if (exists) {
      return { ok: true, created: false };
    }

    const { error: createError } = await admin.storage.createBucket(PORTFOLIO_BUCKET_ID, {
      public: true,
      fileSizeLimit: FILE_SIZE_LIMIT,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });

    if (createError) {
      const msg = createError.message ?? "";
      if (msg.toLowerCase().includes("already exists")) {
        return { ok: true, created: false };
      }
      console.error("[portfolio storage] createBucket", createError);
      return { ok: false, created: false, error: msg, code: "BUCKET_CREATE_FAILED" };
    }

    return { ok: true, created: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[portfolio storage] ensure failed", e);
    return { ok: false, created: false, error: msg, code: "BUCKET_SETUP_FAILED" };
  }
}
