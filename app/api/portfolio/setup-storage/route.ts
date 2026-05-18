import { NextResponse } from "next/server";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import {
  ensurePortfolioStorageBucket,
  hasPortfolioServiceRole,
} from "@/lib/portfolio/ensure-portfolio-storage";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

/** Creates the `portfolio` bucket when service role is available; otherwise no-op. */
export async function POST() {
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

    if (!hasPortfolioServiceRole()) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message:
          "Service role not set — skipping auto bucket create. Run supabase/migrations/20250519120000_portfolio_storage_bucket.sql in the Supabase SQL editor, or add SUPABASE_SERVICE_ROLE_KEY to .env.local.",
      });
    }

    const result = await ensurePortfolioStorageBucket();
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error ?? "Could not create portfolio bucket",
          code: result.code ?? "BUCKET_SETUP_FAILED",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, created: result.created, skipped: result.skipped });
  } catch (e) {
    console.error("[portfolio setup-storage]", e);
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
