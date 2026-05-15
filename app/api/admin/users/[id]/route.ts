import { NextResponse } from "next/server";
import { fetchUserAccountById } from "@/lib/supabase/users-repository";
import { createServiceRoleSupabase } from "@/lib/supabase/server-admin-client";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

    const { id: targetId } = await context.params;
    if (!targetId) return NextResponse.json({ error: "Bad request" }, { status: 400 });
    if (targetId === user.id) {
      return NextResponse.json({ error: "Cannot delete self" }, { status: 400 });
    }

    const service = createServiceRoleSupabase();
    const target = await fetchUserAccountById(service, targetId);
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (target.role === "admin") {
      const { data: admins } = await service.from("users").select("id").eq("role", "admin");
      if ((admins?.length ?? 0) <= 1) {
        return NextResponse.json({ error: "Last admin" }, { status: 400 });
      }
    }

    const { error } = await service.auth.admin.deleteUser(targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
