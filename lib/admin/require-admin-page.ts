import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppRoutes } from "@/lib/app-routes";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

type AdminAccessContext = {
  supabase: SupabaseClient;
  authUserId: string;
};

/**
 * Server-only gate for `/dashboard/admin/*`.
 * Uses SSR Supabase session + `public.users` role (no client redirects).
 */
export async function requireAdminAccess(): Promise<AdminAccessContext> {
  const supabase = await createRouteSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.log("[DASHBOARD REDIRECT]", {
      redirectTo: AppRoutes.dashboard,
      reason: "admin_gate_no_session",
      from: "requireAdminAccess",
    });
    redirect(AppRoutes.dashboard);
  }

  const authRow = await fetchDbAuthRow(supabase, user.id);

  console.log("[ROLE FETCH]", {
    userId: user.id,
    role: authRow.row?.role ?? null,
    account_status: authRow.row?.account_status ?? null,
    source: authRow.source,
    error: authRow.error,
    context: "admin_gate",
  });

  if (
    !authRow.row ||
    authRow.row.role !== "admin" ||
    authRow.row.account_status !== "active"
  ) {
    console.log("[DASHBOARD REDIRECT]", {
      redirectTo: AppRoutes.dashboard,
      reason: "admin_gate_forbidden",
      role: authRow.row?.role ?? null,
      account_status: authRow.row?.account_status ?? null,
    });
    redirect(AppRoutes.dashboard);
  }

  return { supabase, authUserId: user.id };
}

/** @deprecated Alias — prefer `requireAdminAccess`. */
export async function requireAdminPageAccess(): Promise<AdminAccessContext> {
  return requireAdminAccess();
}
