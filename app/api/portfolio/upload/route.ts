import { NextResponse } from "next/server";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import {
  ensurePortfolioStorageBucket,
  PORTFOLIO_BUCKET_ID,
} from "@/lib/portfolio/ensure-portfolio-storage";
import { MAX_PORTFOLIO_VIDEO_BYTES } from "@/lib/portfolio/portfolio-media-upload";
import { appendArtistPortfolioMediaRow } from "@/lib/supabase/users-repository";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function extForVideo(mime: string): string {
  const map: Record<string, string> = {
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };
  return map[mime] ?? "mp4";
}

/**
 * 1) Insert file into storage (new object path each time, upsert: false).
 * 2) Append one row to public.artist_portfolios (INSERT, not upsert on user_id).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteSupabase();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const authRow = await fetchDbAuthRow(supabase, user.id);
    if (!authRow.row || authRow.row.role !== "makeup_artist") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    await ensurePortfolioStorageBucket();

    const form = await request.formData();
    const file = form.get("file");
    const kindRaw = form.get("kind");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
    }

    const kind = kindRaw === "video" ? "video" : "image";
    const isImage = kind === "image" || file.type.startsWith("image/");
    const isVideo = kind === "video" || file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json({ ok: false, error: "Invalid file type" }, { status: 400 });
    }

    if (isVideo && file.size > MAX_PORTFOLIO_VIDEO_BYTES) {
      return NextResponse.json({ ok: false, error: "Video too large", code: "VIDEO_TOO_LARGE" }, { status: 400 });
    }

    if (isImage && file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ ok: false, error: "Image too large", code: "IMAGE_TOO_LARGE" }, { status: 400 });
    }

    const ext = isImage ? "jpg" : extForVideo(file.type);
    const contentType = isImage ? "image/jpeg" : file.type || "video/mp4";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const body = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from(PORTFOLIO_BUCKET_ID).upload(path, body, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      console.error("[PORTFOLIO UPLOAD ERROR]", {
        stage: "storage.objects.insert",
        bucket: PORTFOLIO_BUCKET_ID,
        path,
        userId: user.id,
        error: uploadError,
      });
      const msg = uploadError.message ?? "Upload failed";
      const code = msg.includes("Bucket not found")
        ? "BUCKET_NOT_FOUND"
        : msg.includes("row-level security")
          ? "STORAGE_RLS_DENIED"
          : "UPLOAD_FAILED";
      return NextResponse.json({ ok: false, error: msg, code }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(PORTFOLIO_BUCKET_ID).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const appended = await appendArtistPortfolioMediaRow(supabase, user.id, {
      url: publicUrl,
      kind: isImage ? "image" : "video",
    });

    if (!appended.ok) {
      return NextResponse.json(
        { ok: false, error: "Failed to save portfolio row", code: "DB_INSERT_FAILED" },
        { status: 500 },
      );
    }

    console.log("[PORTFOLIO DEBUG] inserted row", appended.item.id, appended.item.url);

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      path,
      portfolioItem: appended.item,
    });
  } catch (e) {
    console.error("[PORTFOLIO UPLOAD ERROR]", { stage: "api.portfolio.upload", error: e });
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ ok: false, error: msg, code: "INTERNAL" }, { status: 500 });
  }
}
