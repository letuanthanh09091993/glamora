import { NextResponse } from "next/server";
import { fetchUserAccountById } from "@/lib/supabase/users-repository";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

export async function GET() {
  try {
    const supabase = await createRouteSupabase();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const acc = await fetchUserAccountById(supabase, user.id);
    if (!acc || acc.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      { count: totalUsers },
      { count: totalArtists },
      { count: totalBookings },
      { count: pendingVerifications },
    ] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "makeup_artist"),
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "makeup_artist")
        .eq("artist_verification_status", "pending"),
    ]);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activeUsers30d } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("last_login_at", since);

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      totalArtists: totalArtists ?? 0,
      totalBookings: totalBookings ?? 0,
      pendingVerifications: pendingVerifications ?? 0,
      activeUsers30d: activeUsers30d ?? 0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
