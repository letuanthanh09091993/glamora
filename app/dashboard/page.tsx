import { redirect } from "next/navigation";
import { AppRoutes } from "@/lib/app-routes";
import type { UserRole } from "@/lib/auth-types";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import { ROLE_META } from "@/lib/role-meta";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

export const dynamic = "force-dynamic";

function dashboardPathForDbRole(role: UserRole): string {
  return ROLE_META[role]?.dashboardPath ?? AppRoutes.dashboardCustomer;
}

export default async function DashboardEntryPage() {
  const supabase = await createRouteSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log("[DASHBOARD REDIRECT]", {
      redirectTo: AppRoutes.login,
      reason: "no_authenticated_user",
    });
    redirect(AppRoutes.login);
  }

  const authRow = await fetchDbAuthRow(supabase, user.id);

  console.log("[ROLE FETCH]", {
    userId: user.id,
    role: authRow.row?.role ?? null,
    account_status: authRow.row?.account_status ?? null,
    source: authRow.source,
    error: authRow.error,
  });

  if (!authRow.row) {
    console.log("[DASHBOARD REDIRECT]", {
      redirectTo: AppRoutes.login,
      reason: "profile_not_found",
    });
    redirect(AppRoutes.login);
  }

  if (authRow.row.account_status !== "active") {
    console.log("[DASHBOARD REDIRECT]", {
      redirectTo: AppRoutes.login,
      reason: "inactive_account",
    });
    redirect(AppRoutes.login);
  }

  const role = authRow.row.role as UserRole;
  const redirectTo = dashboardPathForDbRole(role);

  console.log("[DASHBOARD REDIRECT]", { redirectTo, role });

  redirect(redirectTo);
}
