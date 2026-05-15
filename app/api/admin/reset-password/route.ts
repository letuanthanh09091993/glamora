import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchUserAccountById } from "@/lib/supabase/users-repository";
import { createServiceRoleSupabase } from "@/lib/supabase/server-admin-client";

async function createRouteSupabase() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Missing Supabase env");
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* ignore */
        }
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { targetUserId?: string; password?: string };
    const targetUserId = body.targetUserId?.trim();
    const password = body.password?.trim();
    if (!targetUserId || !password || password.length < 6) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

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

    const service = createServiceRoleSupabase();
    const { error } = await service.auth.admin.updateUserById(targetUserId, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
