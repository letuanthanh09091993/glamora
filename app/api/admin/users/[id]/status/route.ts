import { NextResponse } from "next/server";
import { fetchUserAccountById } from "@/lib/supabase/users-repository";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

type Body = { account_status?: "active" | "suspended" };

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createRouteSupabase();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor = await fetchUserAccountById(supabase, user.id);
    if (!actor || actor.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: targetId } = await context.params;
    if (!targetId) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const body = (await request.json()) as Body;
    const nextStatus = body.account_status;
    if (nextStatus !== "active" && nextStatus !== "suspended") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (targetId === user.id && nextStatus === "suspended") {
      return NextResponse.json({ error: "Cannot suspend self" }, { status: 400 });
    }

    const { error } = await supabase
      .from("users")
      .update({ account_status: nextStatus })
      .eq("id", targetId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, account_status: nextStatus });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
